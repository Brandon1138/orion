/**
 * Command Router - Phase 1A Implementation
 * Simplified routing for read-only operations
 */
import type { MCPClient } from '@orion/mcp-client';
import type { ApprovalRequest, CommandRequest, ExecutionResult, RiskAssessment } from './types.js';
export * from './types.js';
export declare class CommandRouter {
    private mcpClient;
    constructor(mcpClient: MCPClient);
    /**
     * Process a command request through the Phase 1A pipeline
     */
    processCommand(request: CommandRequest): Promise<ExecutionResult>;
    /**
     * Assess risk level for Phase 1A operations
     */
    private assessRisk;
    /**
     * Generate approval request for manual review
     */
    generateApprovalRequest(request: CommandRequest, risk: RiskAssessment): ApprovalRequest;
}
export default CommandRouter;
