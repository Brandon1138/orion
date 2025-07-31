/**
 * MCP Client - Phase 1A Implementation
 * Read-only file operations with basic policy enforcement
 */
import type { MCPResult, MCPServerConfig, MCPToolCall, PolicyConfig } from './types.js';
export * from './types.js';
export * from './policy.js';
export declare class MCPClient {
    private servers;
    private policy;
    private rateLimitMap;
    private fsPolicy;
    constructor(servers: MCPServerConfig[], policy: PolicyConfig);
    /**
     * Execute a tool call via MCP
     * Phase 1A: Read-only file operations only
     */
    execute(toolCall: MCPToolCall): Promise<MCPResult>;
    /**
     * Check if operation is allowed by Phase 1A policy
     */
    private isOperationAllowed;
    /**
     * Execute file operations
     * Phase 1A: Basic implementation with Node.js fs
     */
    private executeFileOperation;
    /**
     * Read file contents with size limits
     */
    private readFile;
    /**
     * List directory contents
     */
    private listDirectory;
    /**
     * Search for files matching a pattern
     */
    private searchFiles;
    /**
     * Parse file size string (e.g., "1MB", "500KB") to bytes
     */
    private parseFileSize;
    /**
     * Check rate limiting for a server
     */
    private checkRateLimit;
    /**
     * Increment rate limit counter for a server
     */
    private incrementRateLimit;
    /**
     * Get policy configuration summary for debugging/display
     */
    getPolicySummary(): {
        allowedRoots: string[];
        deniedPatterns: string[];
        maxFileSize: string;
        phase: string;
    };
    /**
     * Get rate limit status for a server
     */
    getRateLimitStatus(serverId: string): {
        remaining: number;
        resetTime: number;
    };
}
export default MCPClient;
