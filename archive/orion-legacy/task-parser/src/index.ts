/**
 * Task Parser - Unified task parsing for Google Tasks and other task systems
 * Phase 1A: Google Tasks integration with OAuth2 authentication
 */

import { google } from 'googleapis';
import type {
	Task,
	TaskList,
	TaskParserConfig,
	TaskContext,
	GoogleTask,
	GoogleTaskList,
	GoogleTasksApiResponse,
	GoogleTaskListsApiResponse,
} from './types.js';
import { GoogleTasksAuth, createGoogleTasksAuth } from './google-auth.js';

export class TaskParser {
	private googleAuth?: GoogleTasksAuth;

	constructor(private config: TaskParserConfig = {}) {
		// Initialize Google Tasks authentication if credentials available
		if (this.hasGoogleCredentials()) {
			this.googleAuth = createGoogleTasksAuth({});
		}
	}

	/**
	 * Check if Google credentials are available
	 */
	private hasGoogleCredentials(): boolean {
		return !!(
			(process.env.GOOGLE_TASKS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) &&
			(process.env.GOOGLE_TASKS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)
		);
	}

	/**
	 * Set Google Tasks authentication tokens
	 */
	setGoogleTokens(tokens: {
		access_token: string;
		refresh_token?: string;
		expiry_date?: number;
	}): void {
		if (!this.googleAuth) {
			throw new Error('Google Tasks authentication not configured. Check your credentials.');
		}
		this.googleAuth.setCredentials(tokens);
	}

	/**
	 * Get Google OAuth authorization URL
	 */
	async getGoogleAuthUrl(): Promise<string> {
		if (!this.googleAuth) {
			throw new Error('Google Tasks authentication not configured. Check your credentials.');
		}
		return await this.googleAuth.getAuthUrl();
	}

	/**
	 * Exchange authorization code for tokens
	 */
	async exchangeGoogleAuthCode(code: string) {
		if (!this.googleAuth) {
			throw new Error('Google Tasks authentication not configured. Check your credentials.');
		}
		return await this.googleAuth.exchangeCodeForTokens(code);
	}

	/**
	 * Load tasks from all configured sources
	 */
	async loadTasks(): Promise<TaskContext> {
		const tasks: Task[] = [];
		const taskLists: TaskList[] = [];

		// Load Google Tasks if configured
		if (this.googleAuth) {
			try {
				const googleTasks = await this.loadGoogleTasks();
				tasks.push(...googleTasks.tasks);
				taskLists.push(...googleTasks.taskLists);
			} catch (error) {
				console.error('Failed to load Google Tasks:', error);
				// Continue with other sources
			}
		}

		return {
			tasks: this.applPrivacyMasking(tasks),
			taskLists,
			totalTasks: tasks.length,
			lastUpdated: new Date(),
			source: 'TaskParser',
		};
	}

	/**
	 * Load tasks from Google Tasks
	 */
	async loadGoogleTasks(taskListIds?: string[]): Promise<{ tasks: Task[]; taskLists: TaskList[] }> {
		if (!this.googleAuth) {
			throw new Error('Google Tasks authentication not configured');
		}

		// Ensure we have valid tokens before making API calls
		await this.googleAuth.ensureValidTokens();

		const tasksService = google.tasks({ version: 'v1', auth: this.googleAuth.getOAuth2Client() });
		const tasks: Task[] = [];
		const taskLists: TaskList[] = [];

		// First, get all task lists or specific ones
		const targetListIds = taskListIds || this.config.google?.taskListIds || [];
		let listsToProcess: GoogleTaskList[] = [];

		if (targetListIds.length === 0) {
			// Get all task lists
			const listsResponse = await tasksService.tasklists.list({
				maxResults: 100,
			});

			if (listsResponse.data.items) {
				listsToProcess = listsResponse.data.items as GoogleTaskList[];
			}
		} else {
			// Get specific task lists
			for (const listId of targetListIds) {
				try {
					const listResponse = await tasksService.tasklists.get({
						tasklist: listId,
					});
					if (listResponse.data) {
						listsToProcess.push(listResponse.data as GoogleTaskList);
					}
				} catch (error) {
					console.error(`Failed to load task list ${listId}:`, error);
					// Continue with other lists
				}
			}
		}

		// Convert task lists to our format
		for (const googleList of listsToProcess) {
			taskLists.push(this.normalizeGoogleTaskList(googleList));
		}

		// Load tasks from each list
		for (const taskList of listsToProcess) {
			try {
				const tasksResponse = await tasksService.tasks.list({
					tasklist: taskList.id,
					maxResults: this.config.google?.maxResults || 100,
					showCompleted: this.config.google?.includeCompleted || false,
					showHidden: false, // Don't show hidden tasks
					showDeleted: false, // Don't show deleted tasks
				});

				if (tasksResponse.data.items) {
					const listTasks = tasksResponse.data.items as GoogleTask[];

					// Convert to our Task format and build hierarchy
					const normalizedTasks = listTasks
						.map(googleTask => this.normalizeGoogleTask(googleTask, taskList))
						.filter(task => task !== null) as Task[];

					// Build task hierarchy
					const hierarchicalTasks = this.buildTaskHierarchy(normalizedTasks);
					tasks.push(...hierarchicalTasks);
				}
			} catch (error) {
				console.error(`Failed to load tasks from list ${taskList.title}:`, error);
				// Continue with other lists
			}
		}

		return { tasks, taskLists };
	}

	/**
	 * Normalize Google TaskList to internal TaskList format
	 */
	private normalizeGoogleTaskList(googleList: GoogleTaskList): TaskList {
		return {
			id: googleList.id,
			title: googleList.title,
			updated: new Date(googleList.updated),
			source: 'google',
			selfLink: googleList.selfLink,
		};
	}

	/**
	 * Normalize Google Task to internal Task format
	 */
	private normalizeGoogleTask(googleTask: GoogleTask, taskList: GoogleTaskList): Task | null {
		// Skip deleted or hidden tasks
		if (googleTask.deleted || googleTask.hidden) {
			return null;
		}

		return {
			id: googleTask.id,
			title: googleTask.title,
			notes: googleTask.notes,
			status: googleTask.status,
			due: googleTask.due ? new Date(googleTask.due) : undefined,
			completed: googleTask.completed ? new Date(googleTask.completed) : undefined,
			updated: new Date(googleTask.updated),
			parent: googleTask.parent,
			position: googleTask.position,
			links: googleTask.links,
			source: 'google',
			sourceId: googleTask.id,
			listId: taskList.id,
			listTitle: taskList.title,
			level: 0, // Will be calculated in buildTaskHierarchy
			children: [],
		};
	}

	/**
	 * Build task hierarchy from flat list of tasks
	 */
	private buildTaskHierarchy(tasks: Task[]): Task[] {
		const taskMap = new Map<string, Task>();
		const rootTasks: Task[] = [];

		// First pass: create map and identify root tasks
		for (const task of tasks) {
			taskMap.set(task.id, task);
			if (!task.parent) {
				task.level = 0;
				rootTasks.push(task);
			}
		}

		// Second pass: build parent-child relationships
		for (const task of tasks) {
			if (task.parent) {
				const parentTask = taskMap.get(task.parent);
				if (parentTask) {
					task.level = parentTask.level + 1;
					parentTask.children.push(task);
				} else {
					// Parent not found, treat as root task
					task.level = 0;
					rootTasks.push(task);
				}
			}
		}

		// Sort tasks by position if available
		const sortByPosition = (taskList: Task[]) => {
			return taskList.sort((a, b) => {
				if (a.position && b.position) {
					return a.position.localeCompare(b.position);
				}
				return a.title.localeCompare(b.title);
			});
		};

		// Sort root tasks and their children recursively
		const sortTasksRecursively = (taskList: Task[]) => {
			const sorted = sortByPosition(taskList);
			for (const task of sorted) {
				if (task.children.length > 0) {
					task.children = sortTasksRecursively(task.children);
				}
			}
			return sorted;
		};

		return sortTasksRecursively(rootTasks);
	}

	/**
	 * Apply privacy masking to tasks
	 */
	private applPrivacyMasking(tasks: Task[]): Task[] {
		if (!this.config.privacy?.maskPrivateTasks) {
			return tasks;
		}

		const privateKeywords = this.config.privacy.privateKeywords || [
			'private',
			'personal',
			'confidential',
		];

		return tasks.map(task => {
			const isPrivate = privateKeywords.some(
				keyword =>
					task.title.toLowerCase().includes(keyword.toLowerCase()) ||
					(task.notes && task.notes.toLowerCase().includes(keyword.toLowerCase()))
			);

			if (isPrivate) {
				return {
					...task,
					title: '🔒 Private Task',
					notes: undefined,
				};
			}

			return task;
		});
	}

	/**
	 * Get task statistics
	 */
	getTaskStats(tasks: Task[]): {
		total: number;
		completed: number;
		pending: number;
		overdue: number;
		dueToday: number;
		dueTomorrow: number;
	} {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const stats = {
			total: tasks.length,
			completed: 0,
			pending: 0,
			overdue: 0,
			dueToday: 0,
			dueTomorrow: 0,
		};

		for (const task of tasks) {
			if (task.status === 'completed') {
				stats.completed++;
			} else {
				stats.pending++;

				if (task.due) {
					const dueDate = new Date(task.due.getFullYear(), task.due.getMonth(), task.due.getDate());

					if (dueDate < today) {
						stats.overdue++;
					} else if (dueDate.getTime() === today.getTime()) {
						stats.dueToday++;
					} else if (dueDate.getTime() === tomorrow.getTime()) {
						stats.dueTomorrow++;
					}
				}
			}
		}

		return stats;
	}
}

// Re-export types for convenience
export type { Task, TaskList, TaskParserConfig, TaskContext } from './types.js';

export { GoogleTasksAuth, createGoogleTasksAuth } from './google-auth.js';
