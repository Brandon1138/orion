/**
 * Orion Core - Phase 1A Implementation with OpenAI Agents SDK Integration (Chunk 3.2)
 * Task interviewing workflow with Google Tasks integration
 */
import 'dotenv/config';
import type { OrionConfig, PlanRequest, PlanResponse, SessionContext } from './types.js';
export * from './types.js';
export declare class OrionCore {
    private config;
    private calendarParser;
    private taskParser;
    private plannerLLM;
    private mcpClient;
    private commandRouter;
    private openai;
    private sessions;
    private orionAgent;
    private agentContext;
    constructor(config: OrionConfig);
    /**
     * Start a new conversation session
     */
    startSession(userId: string): string;
    /**
     * Handle user message with OpenAI Agents SDK (Chunk 3.2)
     * This is the new preferred method for task interviewing workflow
     */
    handleUserMessageWithAgent(message: string, sessionId?: string, userId?: string): Promise<string>;
    /**
     * Handle user message with task interviewing workflow (Chunk 3.1) - Legacy method
     */
    handleUserMessage(message: string, sessionId?: string): Promise<string>;
    /**
     * Build task context from Google Tasks (Chunk 3.1)
     */
    private buildTaskContext;
    /**
     * Conduct task interview using PlannerLLM (Chunk 3.1)
     */
    private conductTaskInterview;
    /**
     * Handle follow-up questions in task interview (Chunk 3.1)
     */
    private handleFollowUpQuestions;
    /**
     * Check if message is a task planning request
     */
    private isTaskPlanningRequest;
    /**
     * Format TaskPlan with questions for user
     */
    private formatTaskPlanWithQuestions;
    /**
     * Format final TaskPlan for user
     */
    private formatTaskPlan;
    /**
     * Process a user message in the conversation using OpenAI client with function calling
     */
    processMessage(sessionId: string, userMessage: string): Promise<string>;
    /**
     * Generate a day plan
     */
    generatePlan(sessionId: string, request: PlanRequest): Promise<PlanResponse>;
    /**
     * Get session information
     */
    getSession(sessionId: string): SessionContext | undefined;
    /**
     * Set Google Tasks authentication tokens
     */
    setGoogleTasksTokens(tokens: {
        access_token: string;
        refresh_token?: string;
        expiry_date?: number;
    }): void;
    /**
     * Get Google Tasks OAuth authorization URL
     */
    getGoogleTasksAuthUrl(): Promise<string>;
    /**
     * Exchange Google Tasks authorization code for tokens
     */
    exchangeGoogleTasksAuthCode(code: string): Promise<import("@orion/task-parser/dist/google-auth.js").Tokens>;
    /**
     * Build system instructions for the OpenAI Agent (Task Interviewing Workflow)
     */
    private buildSystemInstructions;
    /**
     * Get tool definitions for OpenAI function calling (Task Interviewing Workflow)
     */
    private getToolDefinitions;
    /**
     * Build conversation history for OpenAI API
     */
    private buildConversationHistory;
    /**
     * Handle tool calls and return results
     */
    private handleToolCalls;
    /**
     * Tool handler: Conduct task interview (Chunk 3.1)
     */
    private handleConductTaskInterview;
    /**
     * Tool handler: Read tasks from Google Tasks
     */
    private handleReadTasks;
    /**
     * Tool handler: Generate day plan
     */
    private handleGenerateDayPlan;
    /**
     * Tool handler: Read calendar
     */
    private handleReadCalendar;
    /**
     * Tool handler: Read file
     */
    private handleReadFile;
    /**
     * Tool handler: List directory
     */
    private handleListDirectory;
    /**
     * Tool handler: Search files
     */
    private handleSearchFiles;
    /**
     * Build session context for the agent
     */
    private buildSessionContext;
    /**
     * Determine session state based on agent response (Task Interviewing Workflow)
     */
    private determineSessionState;
    /**
     * Detect conversation pattern from message history (Task Interviewing Workflow)
     */
    private detectConversationPattern;
    /**
     * Check if message is a planning request
     */
    private isPlanningRequest;
    /**
     * Handle planning-related requests
     */
    private handlePlanningRequest;
    /**
     * Handle general queries (Task Interviewing Workflow)
     */
    private handleGeneralQuery;
    /**
     * Get help message (Task Interviewing Workflow with OpenAI Agents SDK)
     */
    private getHelpMessage;
    /**
     * Get status message (Task Interviewing Workflow with OpenAI Agents SDK)
     */
    private getStatusMessage;
    /**
     * Log audit events
     */
    private auditLog;
    /**
     * Generate simple hash for audit chain
     */
    private generateHash;
}
export default OrionCore;
