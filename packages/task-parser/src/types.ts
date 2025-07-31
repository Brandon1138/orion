/**
 * Task Parser Types
 * Unified types for task management systems (Google Tasks, etc.)
 */

export interface Task {
	id: string;
	title: string;
	notes?: string;
	status: 'needsAction' | 'completed';
	due?: Date;
	completed?: Date;
	updated: Date;
	parent?: string; // Parent task ID for subtasks
	position?: string; // Position in the list
	links?: Array<{
		type: string;
		description: string;
		link: string;
	}>;
	// Source metadata
	source: 'google' | 'manual';
	sourceId: string;
	listId: string;
	listTitle: string;
	// Hierarchy info
	level: number; // 0 for top-level, 1+ for subtasks
	children: Task[];
}

export interface TaskList {
	id: string;
	title: string;
	updated: Date;
	source: 'google' | 'manual';
	selfLink?: string;
}

export interface TaskParserConfig {
	google?: {
		taskListIds?: string[]; // Specific lists to parse, default: ['@default']
		includeCompleted?: boolean; // Include completed tasks, default: false
		maxResults?: number; // Max tasks per list, default: 100
	};
	privacy?: {
		maskPrivateTasks?: boolean;
		privateKeywords?: string[];
	};
}

export interface TaskContext {
	tasks: Task[];
	taskLists: TaskList[];
	totalTasks: number;
	lastUpdated: Date;
	source: string;
}

// Google Tasks API raw response types
export interface GoogleTaskList {
	kind: string;
	id: string;
	etag: string;
	title: string;
	updated: string;
	selfLink: string;
}

export interface GoogleTask {
	kind: string;
	id: string;
	etag: string;
	title: string;
	updated: string;
	selfLink: string;
	parent?: string;
	position?: string;
	notes?: string;
	status: 'needsAction' | 'completed';
	due?: string; // RFC 3339 timestamp
	completed?: string; // RFC 3339 timestamp
	deleted?: boolean;
	hidden?: boolean;
	links?: Array<{
		type: string;
		description: string;
		link: string;
	}>;
}

export interface GoogleTasksApiResponse {
	kind: string;
	etag: string;
	nextPageToken?: string;
	items?: GoogleTask[];
}

export interface GoogleTaskListsApiResponse {
	kind: string;
	etag: string;
	nextPageToken?: string;
	items?: GoogleTaskList[];
}
