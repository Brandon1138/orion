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
    parent?: string;
    position?: string;
    links?: Array<{
        type: string;
        description: string;
        link: string;
    }>;
    source: 'google' | 'manual';
    sourceId: string;
    listId: string;
    listTitle: string;
    level: number;
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
        taskListIds?: string[];
        includeCompleted?: boolean;
        maxResults?: number;
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
    due?: string;
    completed?: string;
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
