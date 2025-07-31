/**
 * Task Parser - Unified task parsing for Google Tasks and other task systems
 * Phase 1A: Google Tasks integration with OAuth2 authentication
 */
import type { Task, TaskList, TaskParserConfig, TaskContext } from './types.js';
export declare class TaskParser {
    private config;
    private googleAuth?;
    constructor(config?: TaskParserConfig);
    /**
     * Check if Google credentials are available
     */
    private hasGoogleCredentials;
    /**
     * Set Google Tasks authentication tokens
     */
    setGoogleTokens(tokens: {
        access_token: string;
        refresh_token?: string;
        expiry_date?: number;
    }): void;
    /**
     * Get Google OAuth authorization URL
     */
    getGoogleAuthUrl(): Promise<string>;
    /**
     * Exchange authorization code for tokens
     */
    exchangeGoogleAuthCode(code: string): Promise<import("./google-auth.js").Tokens>;
    /**
     * Load tasks from all configured sources
     */
    loadTasks(): Promise<TaskContext>;
    /**
     * Load tasks from Google Tasks
     */
    loadGoogleTasks(taskListIds?: string[]): Promise<{
        tasks: Task[];
        taskLists: TaskList[];
    }>;
    /**
     * Normalize Google TaskList to internal TaskList format
     */
    private normalizeGoogleTaskList;
    /**
     * Normalize Google Task to internal Task format
     */
    private normalizeGoogleTask;
    /**
     * Build task hierarchy from flat list of tasks
     */
    private buildTaskHierarchy;
    /**
     * Apply privacy masking to tasks
     */
    private applPrivacyMasking;
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
    };
}
export type { Task, TaskList, TaskParserConfig, TaskContext } from './types.js';
export { GoogleTasksAuth, createGoogleTasksAuth } from './google-auth.js';
