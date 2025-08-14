/**
 * ActionEngine - Sprint 1 minimal executor
 * - Executes a linear list of actions
 * - Approvals: auto (low), ask (med/high) via callback
 * - Emits audit events via provided logger
 */

export type Risk = 'low' | 'medium' | 'high';

export interface Action {
	tool: string;
	args: Record<string, unknown>;
	risk?: Risk;
}

export interface ActionResult {
	tool: string;
	ok: boolean;
	output?: unknown;
	error?: string;
	durationMs: number;
}

export interface ApprovalHandler {
	(action: Action): Promise<boolean>;
}

export interface ToolExecutor {
	(
		tool: string,
		args: Record<string, unknown>
	): Promise<{ ok: boolean; data?: unknown; error?: string }>;
}

export interface AuditLogger {
	(event: string, payload: Record<string, unknown>): void;
}

export type ReflectionGuard = (
	action: Action
) => Promise<{ ok: true } | { ok: false; reason: string }>;

export interface RetryPolicy {
	maxAttempts: number; // default 2
	baseDelayMs: number; // default 250
	jitterMs: number; // default 150
}

export class ActionEngine {
	private guard?: ReflectionGuard;
	private retry: RetryPolicy;

	constructor(
		private executeTool: ToolExecutor,
		private requestApproval: ApprovalHandler,
		private audit: AuditLogger,
		options?: { guard?: ReflectionGuard; retry?: Partial<RetryPolicy> }
	) {
		this.guard = options?.guard;
		this.retry = {
			maxAttempts: options?.retry?.maxAttempts ?? 2,
			baseDelayMs: options?.retry?.baseDelayMs ?? 250,
			jitterMs: options?.retry?.jitterMs ?? 150,
		};
	}

	async run(actions: Action[]): Promise<ActionResult[]> {
		const results: ActionResult[] = [];
		for (const action of actions) {
			const start = Date.now();
			const risk: Risk = action.risk ?? 'low';

			// Approval gate
			if (risk === 'medium' || risk === 'high') {
				this.audit('approval_requested', {
					tool: action.tool,
					args: this.redactArgs(action.args),
					risk,
				});
				const approved = await this.requestApproval(action);
				if (!approved) {
					const durationMs = Date.now() - start;
					results.push({ tool: action.tool, ok: false, error: 'User rejected', durationMs });
					this.audit('approval_rejected', { tool: action.tool, durationMs });
					continue;
				}
			}

			// Reflection guard
			if (this.guard) {
				const guardResult = await this.guard(action);
				if (!guardResult.ok) {
					const durationMs = Date.now() - start;
					results.push({
						tool: action.tool,
						ok: false,
						error: `blocked_by_guard: ${guardResult.reason}`,
						durationMs,
					});
					this.audit('reflection_block', {
						tool: action.tool,
						reason: guardResult.reason,
						durationMs,
					});
					continue;
				}
			}

			this.audit('tool_called', { tool: action.tool, args: this.redactArgs(action.args), risk });
			const { maxAttempts, baseDelayMs, jitterMs } = this.retry;
			let attempt = 0;
			let lastError: string | undefined;
			let successOutput: unknown | undefined;
			let ok = false;
			while (attempt < Math.max(1, maxAttempts)) {
				try {
					const exec = await this.executeTool(action.tool, action.args);
					if (exec.ok) {
						ok = true;
						successOutput = exec.data;
						break;
					}
					lastError = exec.error || 'unknown_error';
					this.audit('retryable_error', {
						tool: action.tool,
						attempt: attempt + 1,
						error: lastError,
					});
				} catch (error) {
					lastError = error instanceof Error ? error.message : 'Unknown error';
					this.audit('retryable_error', {
						tool: action.tool,
						attempt: attempt + 1,
						error: lastError,
					});
				}
				attempt++;
				if (attempt < Math.max(1, maxAttempts)) {
					const jitter = Math.floor(Math.random() * jitterMs);
					await new Promise(res => setTimeout(res, baseDelayMs + jitter));
				}
			}

			const durationMs = Date.now() - start;
			if (ok) {
				results.push({ tool: action.tool, ok: true, output: successOutput, durationMs });
				this.audit('completed', { tool: action.tool, attempts: attempt + 1, durationMs });
			} else {
				results.push({ tool: action.tool, ok: false, error: lastError, durationMs });
				this.audit('error', { tool: action.tool, error: lastError, attempts: attempt, durationMs });
			}
		}
		return results;
	}

	private redactArgs(args: Record<string, unknown>): Record<string, unknown> {
		const clone = { ...args } as Record<string, unknown>;
		for (const key of Object.keys(clone)) {
			if (key.toLowerCase().includes('token') || key.toLowerCase().includes('authorization')) {
				clone[key] = '[redacted]';
			}
		}
		return clone;
	}
}

export default ActionEngine;
