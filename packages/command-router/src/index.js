/**
 * Command Router - Phase 1A Implementation
 * Simplified routing for read-only operations
 */
export * from './types.js';
export class CommandRouter {
    mcpClient;
    constructor(mcpClient) {
        this.mcpClient = mcpClient;
    }
    /**
     * Process a command request through the Phase 1A pipeline
     */
    async processCommand(request) {
        const startTime = Date.now();
        try {
            // Step 1: Risk Assessment
            const risk = this.assessRisk(request);
            // Step 2: Policy Check (Phase 1A: read-only operations auto-approved)
            if (risk.recommendation === 'block') {
                return {
                    commandId: request.id,
                    success: false,
                    error: `Operation blocked: ${risk.reasons.join(', ')}`,
                    duration: Date.now() - startTime,
                };
            }
            // Step 3: Execute if auto-approved (Phase 1A: read operations only)
            if (risk.recommendation === 'auto') {
                const result = await this.mcpClient.execute({
                    serverId: 'local-fs',
                    tool: request.operation,
                    args: request.args,
                });
                return {
                    commandId: request.id,
                    success: result.ok,
                    output: result.stdout ?? String(result.data),
                    error: result.error,
                    duration: Date.now() - startTime,
                };
            }
            // Step 4: Require approval (Phase 1A: this shouldn't happen for supported operations)
            return {
                commandId: request.id,
                success: false,
                error: 'Manual approval required - not supported in Phase 1A',
                duration: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                commandId: request.id,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime,
            };
        }
    }
    /**
     * Assess risk level for Phase 1A operations
     */
    assessRisk(request) {
        const reasons = [];
        let level = 'low';
        let recommendation = 'auto';
        // Phase 1A: Only allow read operations
        const readOnlyOps = ['fs.read', 'fs.list', 'fs.search'];
        if (!readOnlyOps.includes(request.operation)) {
            level = 'high';
            recommendation = 'block';
            reasons.push(`Operation ${request.operation} not allowed in Phase 1A`);
        }
        // Check for suspicious paths
        if (request.args.path) {
            const path = request.args.path;
            const suspiciousPaths = ['/etc', '~/.ssh', 'System32', 'node_modules'];
            if (suspiciousPaths.some(sp => path.includes(sp))) {
                level = 'medium';
                recommendation = 'ask';
                reasons.push('Accessing sensitive system path');
            }
        }
        return { level, reasons, recommendation };
    }
    /**
     * Generate approval request for manual review
     */
    generateApprovalRequest(request, risk) {
        return {
            kind: 'approval-request',
            commandId: request.id,
            risk: risk.level,
            preview: {
                command: `${request.operation} ${JSON.stringify(request.args)}`,
                effects: [`Execute ${request.type} operation: ${request.operation}`],
            },
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        };
    }
}
export default CommandRouter;
