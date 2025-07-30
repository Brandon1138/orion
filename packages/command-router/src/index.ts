/**
 * Command Router - Phase 1A Implementation
 * Simplified routing for read-only operations
 */

import { MCPClient } from '@orion/mcp-client';
import {
	CommandRequest,
	RiskAssessment,
	ApprovalRequest,
	ApprovalResponse,
	ExecutionResult,
	ApprovalMode,
	RiskLevel,
} from './types.js';

export * from './types.js';

export class CommandRouter {
	constructor(private mcpClient: MCPClient) {}

	/**
	 * Process a command request through the Phase 1A pipeline
	 */
	async processCommand(request: CommandRequest): Promise<ExecutionResult> {
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
					output: result.stdout || String(result.data),
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
		} catch (error) {
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
	private assessRisk(request: CommandRequest): RiskAssessment {
		const reasons: string[] = [];
		let level: RiskLevel = 'low';
		let recommendation: ApprovalMode = 'auto';

		// Phase 1A: Only allow read operations
		const readOnlyOps = ['fs.read', 'fs.list', 'fs.search'];

		if (!readOnlyOps.includes(request.operation)) {
			level = 'high';
			recommendation = 'block';
			reasons.push(`Operation ${request.operation} not allowed in Phase 1A`);
		}

		// Check for suspicious paths
		if (request.args.path) {
			const path = request.args.path as string;
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
	generateApprovalRequest(request: CommandRequest, risk: RiskAssessment): ApprovalRequest {
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