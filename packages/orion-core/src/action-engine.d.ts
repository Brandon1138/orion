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
    (tool: string, args: Record<string, unknown>): Promise<{
        ok: boolean;
        data?: unknown;
        error?: string;
    }>;
}
export interface AuditLogger {
    (event: string, payload: Record<string, unknown>): void;
}
export declare class ActionEngine {
    private executeTool;
    private requestApproval;
    private audit;
    constructor(executeTool: ToolExecutor, requestApproval: ApprovalHandler, audit: AuditLogger);
    run(actions: Action[]): Promise<ActionResult[]>;
    private redactArgs;
}
export default ActionEngine;
