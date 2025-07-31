/**
 * MCP Client Types - Phase 1A
 * Model Context Protocol client for file and shell operations
 */
export interface MCPToolCall {
    serverId: string;
    tool: string;
    args: Record<string, unknown>;
}
export interface MCPResult {
    ok: boolean;
    stdout?: string;
    stderr?: string;
    data?: unknown;
    error?: string;
}
export interface MCPServerConfig {
    id: string;
    endpoint: string;
    scopes: string[];
}
export interface PolicyConfig {
    fsAllow: string[];
    fsDeny: string[];
    commandPolicy: {
        allow: string[];
        deny: string[];
        default: 'ask' | 'block' | 'auto';
    };
    rateLimits: {
        operationsPerMinute: number;
        maxFileSize: string;
        timeoutSeconds: number;
    };
}
export interface FileOperation {
    type: 'read' | 'list' | 'search';
    path: string;
    args?: Record<string, unknown>;
}
export interface ShellOperation {
    type: 'cmd' | 'powershell' | 'sh';
    command: string;
    cwd?: string;
    env?: Record<string, string>;
}
