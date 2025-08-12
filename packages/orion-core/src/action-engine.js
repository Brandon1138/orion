/**
 * ActionEngine - Sprint 1 minimal executor
 * - Executes a linear list of actions
 * - Approvals: auto (low), ask (med/high) via callback
 * - Emits audit events via provided logger
 */
export class ActionEngine {
    executeTool;
    requestApproval;
    audit;
    constructor(executeTool, requestApproval, audit) {
        this.executeTool = executeTool;
        this.requestApproval = requestApproval;
        this.audit = audit;
    }
    async run(actions) {
        const results = [];
        for (const action of actions) {
            const start = Date.now();
            const risk = action.risk ?? 'low';
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
                }
                else {
                    results.push({ tool: action.tool, ok: false, error: exec.error, durationMs });
                    this.audit('error', { tool: action.tool, error: exec.error, durationMs });
                }
            }
            catch (error) {
                const durationMs = Date.now() - start;
                const message = error instanceof Error ? error.message : 'Unknown error';
                results.push({ tool: action.tool, ok: false, error: message, durationMs });
                this.audit('error', { tool: action.tool, error: message, durationMs });
            }
        }
        return results;
    }
    redactArgs(args) {
        const clone = { ...args };
        for (const key of Object.keys(clone)) {
            if (key.toLowerCase().includes('token') || key.toLowerCase().includes('authorization')) {
                clone[key] = '[redacted]';
            }
        }
        return clone;
    }
}
export default ActionEngine;
