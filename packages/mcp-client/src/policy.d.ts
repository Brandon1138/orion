/**
 * File System Policy - Phase 1A
 * Policy enforcement for file operations with allowlist/denylist
 */
import type { PolicyConfig } from './types.js';
export declare class FileSystemPolicy {
    private config;
    private allowedRoots;
    private deniedPatterns;
    private maxFileSize;
    constructor(config: PolicyConfig);
    /**
     * Validate if a path is allowed for read operations
     */
    validatePath(path: string): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * Check if file size is within limits
     */
    checkFileSize(sizeBytes: number): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * Enforce read-only policy for Phase 1A
     */
    enforceReadOnlyPolicy(operation: string): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * Get safe relative path for display purposes
     */
    getSafeDisplayPath(path: string): string;
    /**
     * Validate and sanitize glob patterns for search
     */
    validateSearchPattern(pattern: string, rootPath: string): {
        valid: boolean;
        sanitized?: string;
        reason?: string;
    };
    /**
     * Get configuration summary for debugging
     */
    getConfigSummary(): {
        allowedRoots: string[];
        deniedPatterns: string[];
        maxFileSize: string;
        phase: string;
    };
    /**
     * Parse file size string to bytes (shared utility)
     */
    private parseFileSize;
}
