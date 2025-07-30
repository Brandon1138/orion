/**
 * MCP Client - Phase 1A Implementation
 * Read-only file operations with basic policy enforcement
 */

import { MCPToolCall, MCPResult, MCPServerConfig, PolicyConfig, FileOperation } from './types.js';

export * from './types.js';

export class MCPClient {
	constructor(
		private servers: MCPServerConfig[],
		private policy: PolicyConfig
	) {}

	/**
	 * Execute a tool call via MCP
	 * Phase 1A: Read-only file operations only
	 */
	async execute(toolCall: MCPToolCall): Promise<MCPResult> {
		try {
			// Phase 1A: Policy check for allowed operations
			if (!this.isOperationAllowed(toolCall)) {
				return {
					ok: false,
					error: 'Operation not allowed by policy in Phase 1A',
				};
			}

			// Phase 1A: Basic file operations simulation
			if (toolCall.tool.startsWith('fs.')) {
				return await this.executeFileOperation(toolCall);
			}

			// Phase 1A: Shell operations blocked
			if (toolCall.tool.startsWith('shell.')) {
				return {
					ok: false,
					error: 'Shell operations not supported in Phase 1A',
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
		// Phase 1A: Only allow read operations
		const readOnlyOperations = ['fs.read', 'fs.list', 'fs.search'];
		
		if (!readOnlyOperations.includes(toolCall.tool)) {
			return false;
		}

		// Check path allowlist
		if (toolCall.args.path) {
			const path = toolCall.args.path as string;
			const isAllowed = this.policy.fsAllow.some(allowedPath =>
				path.startsWith(allowedPath.replace('**', ''))
			);
			const isDenied = this.policy.fsDeny.some(deniedPath =>
				path.startsWith(deniedPath.replace('**', ''))
			);

			return isAllowed && !isDenied;
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

	private async readFile(path: string): Promise<MCPResult> {
		try {
			// TODO: Implement actual file reading with Node.js fs
			// For Phase 1A, return placeholder
			return {
				ok: true,
				data: `File content from ${path} - Phase 1A placeholder`,
			};
		} catch (error) {
			return {
				ok: false,
				error: `Failed to read file: ${error}`,
			};
		}
	}

	private async listDirectory(path: string): Promise<MCPResult> {
		try {
			// TODO: Implement actual directory listing
			return {
				ok: true,
				data: [`Contents of ${path} - Phase 1A placeholder`],
			};
		} catch (error) {
			return {
				ok: false,
				error: `Failed to list directory: ${error}`,
			};
		}
	}

	private async searchFiles(pattern: string, path: string): Promise<MCPResult> {
		try {
			// TODO: Implement file search
			return {
				ok: true,
				data: [`Search results for ${pattern} in ${path} - Phase 1A placeholder`],
			};
		} catch (error) {
			return {
				ok: false,
				error: `Failed to search files: ${error}`,
			};
		}
	}
}

export default MCPClient;