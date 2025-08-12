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
  (tool: string, args: Record<string, unknown>): Promise<{ ok: boolean; data?: unknown; error?: string }>
}

export interface AuditLogger {
  (event: string, payload: Record<string, unknown>): void;
}

export class ActionEngine {
  constructor(
    private executeTool: ToolExecutor,
    private requestApproval: ApprovalHandler,
    private audit: AuditLogger,
  ) {}

  async run(actions: Action[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    for (const action of actions) {
      const start = Date.now();
      const risk: Risk = action.risk ?? 'low';

      // Approval gate
      if (risk === 'medium' || risk === 'high') {
        this.audit('approval_requested', { tool: action.tool, args: this.redactArgs(action.args), risk });
        const approved = await this.requestApproval(action);
        if (!approved) {
          const durationMs = Date.now() - start;
          results.push({ tool: action.tool, ok: false, error: 'User rejected', durationMs });
          this.audit('approval_rejected', { tool: action.tool, durationMs });
          continue;
        }
      }

      this.audit('tool_called', { tool: action.tool, args: this.redactArgs(action.args), risk });
      try {
        const exec = await this.executeTool(action.tool, action.args);
        const durationMs = Date.now() - start;
        if (exec.ok) {
          results.push({ tool: action.tool, ok: true, output: exec.data, durationMs });
          this.audit('completed', { tool: action.tool, durationMs });
        } else {
          results.push({ tool: action.tool, ok: false, error: exec.error, durationMs });
          this.audit('error', { tool: action.tool, error: exec.error, durationMs });
        }
      } catch (error) {
        const durationMs = Date.now() - start;
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({ tool: action.tool, ok: false, error: message, durationMs });
        this.audit('error', { tool: action.tool, error: message, durationMs });
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


