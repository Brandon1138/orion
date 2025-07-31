/**
 * TaskParser Unit Tests
 * Chunk 1.3: Integration Testing with mocked Google Tasks API responses
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskParser } from './index.js';
import type { Task, TaskContext } from './types.js';

// Create a mock GoogleTasksAuth class
const mockGoogleTasksAuth = {
	setCredentials: vi.fn(),
	getAuthUrl: vi.fn().mockResolvedValue('https://accounts.google.com/oauth/authorize?...'),
	exchangeCodeForTokens: vi.fn().mockResolvedValue({
		access_token: 'mock_access_token',
		refresh_token: 'mock_refresh_token',
		expiry_date: Date.now() + 3600000,
	}),
	ensureValidTokens: vi.fn().mockResolvedValue(undefined),
	getOAuth2Client: vi.fn().mockReturnValue({
		credentials: { access_token: 'mock_token' },
	}),
};

// Mock the google-auth module
vi.mock('./google-auth.js', () => ({
	GoogleTasksAuth: vi.fn().mockImplementation(() => mockGoogleTasksAuth),
	createGoogleTasksAuth: vi.fn().mockImplementation(() => mockGoogleTasksAuth),
}));

// Mock googleapis
vi.mock('googleapis', () => ({
	google: {
		tasks: vi.fn().mockReturnValue({
			tasklists: {
				list: vi.fn(),
				get: vi.fn(),
			},
			tasks: {
				list: vi.fn(),
			},
		}),
		auth: {
			OAuth2: vi.fn().mockImplementation(() => ({
				setCredentials: vi.fn(),
				generateAuthUrl: vi.fn(),
				getToken: vi.fn(),
				refreshAccessToken: vi.fn(),
			})),
		},
	},
}));

describe('TaskParser', () => {
	let taskParser: TaskParser;
	let mockTasksService: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Set up environment variables for testing
		process.env.GOOGLE_CLIENT_ID = 'test_client_id';
		process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret';

		taskParser = new TaskParser({
			google: {
				includeCompleted: true,
				maxResults: 50,
			},
			privacy: {
				maskPrivateTasks: true,
				privateKeywords: ['private', 'confidential'],
			},
		});

		// Get the mocked tasks service
		const googleapis = await import('googleapis');
		mockTasksService = googleapis.google.tasks('v1');
	});

	describe('Configuration and Setup', () => {
		it('should create TaskParser instance with default config', () => {
			const parser = new TaskParser();
			expect(parser).toBeInstanceOf(TaskParser);
		});

		it('should detect Google credentials availability', () => {
			expect(() => new TaskParser()).not.toThrow();
		});

		it('should handle missing Google credentials gracefully', () => {
			delete process.env.GOOGLE_CLIENT_ID;
			delete process.env.GOOGLE_CLIENT_SECRET;

			const parser = new TaskParser();
			expect(parser).toBeInstanceOf(TaskParser);
		});
	});

	describe('Google Tasks Integration', () => {
		beforeEach(() => {
			// Mock task lists response
			mockTasksService.tasklists.list.mockResolvedValue({
				data: {
					items: [
						{
							id: '@default',
							title: 'My Tasks',
							updated: '2025-01-31T10:30:00.000Z',
							selfLink: 'https://www.googleapis.com/tasks/v1/users/@me/lists/@default',
						},
						{
							id: 'work_list_123',
							title: 'Work Projects',
							updated: '2025-01-31T09:15:00.000Z',
							selfLink: 'https://www.googleapis.com/tasks/v1/users/@me/lists/work_list_123',
						},
					],
				},
			});

			// Mock tasks response
			mockTasksService.tasks.list.mockResolvedValue({
				data: {
					items: [
						{
							id: 'task_1',
							title: 'Review quarterly reports',
							updated: '2025-01-31T10:30:00.000Z',
							status: 'needsAction',
							due: '2025-02-05T23:59:59.000Z',
							notes: 'Need to review Q4 reports',
							position: '00000000000000000001',
						},
						{
							id: 'task_2',
							title: 'Private: Personal task',
							updated: '2025-01-31T09:45:00.000Z',
							status: 'needsAction',
							due: '2025-02-01T17:00:00.000Z',
							notes: 'This is a private task',
							position: '00000000000000000002',
						},
						{
							id: 'task_3',
							title: 'Completed task',
							updated: '2025-01-30T14:20:00.000Z',
							status: 'completed',
							completed: '2025-01-30T16:30:00.000Z',
							position: '00000000000000000003',
						},
					],
				},
			});
		});

		it('should load Google Tasks successfully', async () => {
			const result = await taskParser.loadGoogleTasks();

			expect(result.tasks).toBeDefined();
			expect(result.taskLists).toBeDefined();
			expect(result.tasks.length).toBeGreaterThan(0);
			expect(result.taskLists.length).toBe(2);
		});

		it('should normalize Google task data correctly', async () => {
			const result = await taskParser.loadGoogleTasks();
			const task = result.tasks[0];

			expect(task).toMatchObject({
				id: 'task_1',
				title: 'Review quarterly reports',
				status: 'needsAction',
				source: 'google',
				sourceId: 'task_1',
				level: 0,
				children: [],
			});
			expect(task.due).toBeInstanceOf(Date);
			expect(task.updated).toBeInstanceOf(Date);
		});

		it('should build task hierarchy correctly', async () => {
			// Mock with parent-child relationship
			mockTasksService.tasks.list.mockResolvedValue({
				data: {
					items: [
						{
							id: 'parent_task',
							title: 'Parent Task',
							updated: '2025-01-31T10:30:00.000Z',
							status: 'needsAction',
							position: '00000000000000000001',
						},
						{
							id: 'child_task',
							title: 'Child Task',
							parent: 'parent_task',
							updated: '2025-01-31T10:30:00.000Z',
							status: 'needsAction',
							position: '00000000000000000002',
						},
					],
				},
			});

			const result = await taskParser.loadGoogleTasks();
			const parentTask = result.tasks.find(t => t.id === 'parent_task');

			expect(parentTask?.level).toBe(0);
			expect(parentTask?.children).toHaveLength(1);
			expect(parentTask?.children[0]?.id).toBe('child_task');
			expect(parentTask?.children[0]?.level).toBe(1);
		});

		it('should apply privacy masking to private tasks', async () => {
			const result = await taskParser.loadGoogleTasks();
			const privateTask = result.tasks.find(t => t.title.includes('Private:'));

			// Note: loadGoogleTasks returns raw tasks, privacy is applied in loadTasks()
			const context = await taskParser.loadTasks();
			const maskedTask = context.tasks.find(t => t.title === '🔒 Private Task');

			expect(maskedTask).toBeDefined();
			expect(maskedTask?.notes).toBeUndefined();
		});
	});

	describe('Error Handling', () => {
		it('should handle network failures gracefully', async () => {
			mockTasksService.tasklists.list.mockRejectedValue(new Error('Network error'));

			const context = await taskParser.loadTasks();
			expect(context.tasks).toHaveLength(0);
			expect(context.taskLists).toHaveLength(0);
		});

		it('should handle empty task lists', async () => {
			mockTasksService.tasklists.list.mockResolvedValue({ data: {} });

			const result = await taskParser.loadGoogleTasks();
			expect(result.tasks).toHaveLength(0);
			expect(result.taskLists).toHaveLength(0);
		});

		it('should handle malformed task data', async () => {
			mockTasksService.tasklists.list.mockResolvedValue({
				data: {
					items: [
						{
							id: '@default',
							title: 'My Tasks',
							updated: '2025-01-31T10:30:00.000Z',
						},
					],
				},
			});

			mockTasksService.tasks.list.mockResolvedValue({
				data: {
					items: [
						{
							// Missing required fields
							id: 'malformed_task',
							// No title, updated, status
						},
						{
							id: 'deleted_task',
							title: 'Deleted Task',
							updated: '2025-01-31T10:30:00.000Z',
							status: 'needsAction',
							deleted: true, // Should be filtered out
						},
					],
				},
			});

			const result = await taskParser.loadGoogleTasks();
			// Should handle malformed data gracefully and filter out deleted tasks
			expect(result.tasks.length).toBeLessThanOrEqual(1);
		});

		it('should handle authentication errors', async () => {
			// Clear environment variables to simulate no credentials
			delete process.env.GOOGLE_CLIENT_ID;
			delete process.env.GOOGLE_CLIENT_SECRET;
			delete process.env.GOOGLE_TASKS_CLIENT_ID;
			delete process.env.GOOGLE_TASKS_CLIENT_SECRET;

			const parserWithoutAuth = new TaskParser();

			await expect(parserWithoutAuth.loadGoogleTasks()).rejects.toThrow(
				'Google Tasks authentication not configured'
			);

			// Restore environment variables for other tests
			process.env.GOOGLE_CLIENT_ID = 'test_client_id';
			process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret';
		});
	});

	describe('Task Statistics', () => {
		const mockTasks: Task[] = [
			{
				id: '1',
				title: 'Overdue task',
				status: 'needsAction',
				due: new Date('2025-01-01'),
				updated: new Date(),
				source: 'google',
				sourceId: '1',
				listId: '@default',
				listTitle: 'My Tasks',
				level: 0,
				children: [],
			},
			{
				id: '2',
				title: 'Completed task',
				status: 'completed',
				completed: new Date(),
				updated: new Date(),
				source: 'google',
				sourceId: '2',
				listId: '@default',
				listTitle: 'My Tasks',
				level: 0,
				children: [],
			},
			{
				id: '3',
				title: 'Future task',
				status: 'needsAction',
				due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
				updated: new Date(),
				source: 'google',
				sourceId: '3',
				listId: '@default',
				listTitle: 'My Tasks',
				level: 0,
				children: [],
			},
		];

		it('should calculate task statistics correctly', () => {
			const stats = taskParser.getTaskStats(mockTasks);

			expect(stats.total).toBe(3);
			expect(stats.completed).toBe(1);
			expect(stats.pending).toBe(2);
			expect(stats.overdue).toBe(1);
		});

		it('should handle empty task list', () => {
			const stats = taskParser.getTaskStats([]);

			expect(stats.total).toBe(0);
			expect(stats.completed).toBe(0);
			expect(stats.pending).toBe(0);
			expect(stats.overdue).toBe(0);
			expect(stats.dueToday).toBe(0);
			expect(stats.dueTomorrow).toBe(0);
		});
	});
});
