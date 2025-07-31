/**
 * Command Router Types - Phase 1A
 * Simplified approval workflow for Phase 1A read-only operations
 */
export type ApprovalMode = 'auto' | 'ask' | 'block';
export type RiskLevel = 'low' | 'medium' | 'high';
export interface CommandRequest {
    id: string;
    type: 'file' | 'shell' | 'editor';
    operation: string;
    args: Record<string, unknown>;
    context?: string;
    source: 'plan' | 'chat' | 'user';
}
export interface RiskAssessment {
    level: RiskLevel;
    reasons: string[];
    recommendation: ApprovalMode;
}
export interface ApprovalRequest {
    kind: 'approval-request';
    commandId: string;
    risk: RiskLevel;
    preview: {
        command: string;
        effects: string[];
    };
    expiresAt: string;
}
export interface ApprovalResponse {
    commandId: string;
    approved: boolean;
    reason?: string;
    sessionScope?: boolean;
}
export interface ExecutionResult {
    commandId: string;
    success: boolean;
    output?: string;
    error?: string;
    duration: number;
}
