/**
 * MCP Client - Phase 1A Implementation
 * Read-only file operations with basic policy enforcement
 */

import { promises as fs } from 'fs';
import { resolve, dirname, extname } from 'path';
import { glob } from 'glob';
import type { MCPResult, MCPServerConfig, MCPToolCall, PolicyConfig } from './types.js';
import { FileSystemPolicy } from './policy.js';

export * from './types.js';
export * from './policy.js';

interface RateLimitEntry {
	count: number;
	windowStart: number;
}

export class MCPClient {
	private rateLimitMap = new Map<string, RateLimitEntry>();
	private fsPolicy: FileSystemPolicy;

	constructor(
		private servers: MCPServerConfig[],
		private policy: PolicyConfig
	) {
		this.fsPolicy = new FileSystemPolicy(policy);
	}

	/**
	 * Execute a tool call via MCP
	 * Phase 1A: Read-only file operations only
	 */
	async execute(toolCall: MCPToolCall): Promise<MCPResult> {
		try {
			// Phase 1A: Rate limiting check
			if (!this.checkRateLimit(toolCall.serverId)) {
				return {
					ok: false,
					error: `Rate limit exceeded for server ${toolCall.serverId}. Max ${this.policy.rateLimits.operationsPerMinute} operations per minute.`,
				};
			}

			// Phase 1A: Policy check for allowed operations
			if (!this.isOperationAllowed(toolCall)) {
				return {
					ok: false,
					error: 'Operation not allowed by policy in Phase 1A',
				};
			}

			// Increment rate limit counter
			this.incrementRateLimit(toolCall.serverId);

			// Phase 1A: File operations
			if (toolCall.tool.startsWith('fs.')) {
				return await this.executeFileOperation(toolCall);
			}

			// Phase 1A: Shell operations blocked
			if (toolCall.tool.startsWith('shell.')) {
				return {
					ok: false,
					error: 'Shell operations not supported in Phase 1A (read-only mode)',
				};
			}

			return {
				ok: false,
				error: `Unknown tool: ${toolCall.tool}`,
			};
		} catch (error) {
			return {
				ok: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Check if operation is allowed by Phase 1A policy
	 */
	private isOperationAllowed(toolCall: MCPToolCall): boolean {
		// Phase 1A: Enforce read-only policy
		const readOnlyCheck = this.fsPolicy.enforceReadOnlyPolicy(toolCall.tool);
		if (!readOnlyCheck.allowed) {
			return false;
		}

		// Check path validation if path is provided
		if (toolCall.args.path) {
			const path = toolCall.args.path as string;
			const pathCheck = this.fsPolicy.validatePath(path);
			if (!pathCheck.allowed) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Execute file operations
	 * Phase 1A: Basic implementation with Node.js fs
	 */
	private async executeFileOperation(toolCall: MCPToolCall): Promise<MCPResult> {
		const { tool, args } = toolCall;

		switch (tool) {
			case 'fs.read':
				return await this.readFile(args.path as string);
			case 'fs.list':
				return await this.listDirectory(args.path as string);
			case 'fs.search':
				return await this.searchFiles(args.pattern as string, args.path as string);
			default:
				return {
					ok: false,
					error: `Unsupported file operation: ${tool}`,
				};
		}
	}

	/**
	 * Read file contents with size limits
	 */
	private async readFile(path: string): Promise<MCPResult> {
		try {
			const resolvedPath = resolve(path);

			// Check file size limit
			const stats = await fs.stat(resolvedPath);
			const maxSizeBytes = this.parseFileSize(this.policy.rateLimits.maxFileSize);

			if (stats.size > maxSizeBytes) {
				return {
					ok: false,
					error: `File size (${stats.size} bytes) exceeds limit (${this.policy.rateLimits.maxFileSize})`,
				};
			}

			// Check if it's a file
			if (!stats.isFile()) {
				return {
					ok: false,
					error: `Path is not a file: ${resolvedPath}`,
				};
			}

			const content = await fs.readFile(resolvedPath, 'utf-8');

			return {
				ok: true,
				data: {
					path: resolvedPath,
					content,
					size: stats.size,
					modified: stats.mtime.toISOString(),
				},
			};
		} catch (error) {
			return {
				ok: false,
				error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * List directory contents
	 */
	private async listDirectory(path: string): Promise<MCPResult> {
		try {
			const resolvedPath = resolve(path);

			// Check if directory exists and is readable
			const stats = await fs.stat(resolvedPath);
			if (!stats.isDirectory()) {
				return {
					ok: false,
					error: `Path is not a directory: ${resolvedPath}`,
				};
			}

			const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

			const items = await Promise.all(
				entries.map(async entry => {
					const fullPath = resolve(resolvedPath, entry.name);
					try {
						const itemStats = await fs.stat(fullPath);
						return {
							name: entry.name,
							path: fullPath,
							type: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other',
							size: entry.isFile() ? itemStats.size : undefined,
							modified: itemStats.mtime.toISOString(),
							extension: entry.isFile() ? extname(entry.name) : undefined,
						};
					} catch {
						// If we can't stat the item, still include basic info
						return {
							name: entry.name,
							path: fullPath,
							type: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other',
						};
					}
				})
			);

			return {
				ok: true,
				data: {
					path: resolvedPath,
					items: items.sort((a, b) => {
						// Sort directories first, then files alphabetically
						if (a.type === 'directory' && b.type !== 'directory') return -1;
						if (a.type !== 'directory' && b.type === 'directory') return 1;
						return a.name.localeCompare(b.name);
					}),
					count: items.length,
				},
			};
		} catch (error) {
			return {
				ok: false,
				error: `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * Search for files matching a pattern
	 */
	private async searchFiles(pattern: string, rootPath: string): Promise<MCPResult> {
		try {
			const resolvedPath = resolve(rootPath);

			// Ensure root path exists and is a directory
			const stats = await fs.stat(resolvedPath);
			if (!stats.isDirectory()) {
				return {
					ok: false,
					error: `Root path is not a directory: ${resolvedPath}`,
				};
			}

			// Use glob for pattern matching, limiting to the specified root
			const searchPattern = resolve(resolvedPath, pattern);
			const matches = await glob(searchPattern, {
				cwd: resolvedPath,
				absolute: true,
				nodir: false, // Include directories in results
				maxDepth: 10, // Prevent excessive recursion
			});

			const results = await Promise.all(
				matches.slice(0, 100).map(async match => {
					// Limit to 100 results
					try {
						const matchStats = await fs.stat(match);
						return {
							path: match,
							relativePath: match.replace(resolvedPath, '').replace(/^\//, ''),
							type: matchStats.isDirectory() ? 'directory' : 'file',
							size: matchStats.isFile() ? matchStats.size : undefined,
							modified: matchStats.mtime.toISOString(),
							extension: matchStats.isFile() ? extname(match) : undefined,
						};
					} catch {
						return {
							path: match,
							relativePath: match.replace(resolvedPath, '').replace(/^\//, ''),
							type: 'unknown',
						};
					}
				})
			);

			return {
				ok: true,
				data: {
					pattern,
					rootPath: resolvedPath,
					results,
					count: results.length,
					truncated: matches.length > 100,
				},
			};
		} catch (error) {
			return {
				ok: false,
				error: `Failed to search files: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * Parse file size string (e.g., "1MB", "500KB") to bytes
	 */
	private parseFileSize(sizeStr: string): number {
		const units: Record<string, number> = {
			B: 1,
			KB: 1024,
			MB: 1024 * 1024,
			GB: 1024 * 1024 * 1024,
		};

		const match = sizeStr.match(/^(\d+)(B|KB|MB|GB)$/i);
		if (!match) {
			throw new Error(`Invalid file size format: ${sizeStr}`);
		}

		const [, num, unit] = match;
		return parseInt(num, 10) * (units[unit.toUpperCase()] || 1);
	}

	/**
	 * Check rate limiting for a server
	 */
	private checkRateLimit(serverId: string): boolean {
		const now = Date.now();
		const windowDuration = 60 * 1000; // 1 minute in milliseconds
		const entry = this.rateLimitMap.get(serverId);

		if (!entry) {
			return true; // No previous requests
		}

		// Reset counter if window has expired
		if (now - entry.windowStart > windowDuration) {
			this.rateLimitMap.delete(serverId);
			return true;
		}

		// Check if under limit
		return entry.count < this.policy.rateLimits.operationsPerMinute;
	}

	/**
	 * Increment rate limit counter for a server
	 */
	private incrementRateLimit(serverId: string): void {
		const now = Date.now();
		const windowDuration = 60 * 1000; // 1 minute in milliseconds
		const entry = this.rateLimitMap.get(serverId);

		if (!entry || now - entry.windowStart > windowDuration) {
			// Start new window
			this.rateLimitMap.set(serverId, {
				count: 1,
				windowStart: now,
			});
		} else {
			// Increment existing window
			entry.count++;
		}
	}

	/**
	 * Get policy configuration summary for debugging/display
	 */
	getPolicySummary() {
		return this.fsPolicy.getConfigSummary();
	}

	/**
	 * Get rate limit status for a server
	 */
	getRateLimitStatus(serverId: string): { remaining: number; resetTime: number } {
		const entry = this.rateLimitMap.get(serverId);
		const windowDuration = 60 * 1000; // 1 minute

		if (!entry) {
			return {
				remaining: this.policy.rateLimits.operationsPerMinute,
				resetTime: Date.now() + windowDuration,
			};
		}

		const remaining = Math.max(0, this.policy.rateLimits.operationsPerMinute - entry.count);
		const resetTime = entry.windowStart + windowDuration;

		return { remaining, resetTime };
	}
}

export default MCPClient;
