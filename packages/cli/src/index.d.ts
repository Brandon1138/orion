/**
 * Orion CLI - Phase 1A Implementation
 * Command line interface for Orion
 */
import 'dotenv/config';
export declare class OrionCLI {
    private orion?;
    private sessionId?;
    private config?;
    run(): Promise<void>;
    private initializeOrion;
    private loadConfig;
    private handlePlanCommand;
    private handleChatCommand;
    private handleAgentChatCommand;
    private showStatusCommand;
    private handleAuditCommand;
    private handleDebugCommand;
    private handleAuthCommand;
    private handleInterviewTasksCommand;
    private handleReadTasksCommand;
    private handleTaskPlanCommand;
    private continueTaskInterview;
    private displayTasksTable;
    private displayTasksSummary;
    private displayTaskPlan;
    private getPriorityColor;
    private getComplexityEmoji;
    private getTypeEmoji;
}
export default OrionCLI;
