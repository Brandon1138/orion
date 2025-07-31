/**
 * File System Policy - Phase 1A
 * Policy enforcement for file operations with allowlist/denylist
 */

import { resolve, relative } from 'path';
import type { PolicyConfig } from './types.js';

export class FileSystemPolicy {
	private allowedRoots: string[];
	private deniedPatterns: string[];
	private maxFileSize: number; // bytes

	constructor(private config: PolicyConfig) {
		this.allowedRoots = config.fsAllow.map(path => resolve(path.replace('**', '')));
		this.deniedPatterns = config.fsDeny.map(pattern => pattern.replace('**', ''));
		this.maxFileSize = this.parseFileSize(config.rateLimits.maxFileSize);
	}

	/**
	 * Validate if a path is allowed for read operations
	 */
	validatePath(path: string): { allowed: boolean; reason?: string } {
		try {
			const resolvedPath = resolve(path);

			// Check deny list first (more restrictive)
			for (const deniedPattern of this.deniedPatterns) {
				const resolvedDenied = resolve(deniedPattern);
				if (resolvedPath.startsWith(resolvedDenied)) {
					return {
						allowed: false,
						reason: `Path is in denied list: ${deniedPattern}`,
					};
				}
			}

			// Check allow list
			let isAllowed = false;
			for (const allowedRoot of this.allowedRoots) {
				if (resolvedPath.startsWith(allowedRoot)) {
					isAllowed = true;
					break;
				}
			}

			if (!isAllowed) {
				return {
					allowed: false,
					reason: 'Path is not in allowed directories',
				};
			}

			return { allowed: true };
		} catch (error) {
			return {
				allowed: false,
				reason: `Invalid path: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * Check if file size is within limits
	 */
	checkFileSize(sizeBytes: number): { allowed: boolean; reason?: string } {
		if (sizeBytes > this.maxFileSize) {
			return {
				allowed: false,
				reason: `File size (${sizeBytes} bytes) exceeds limit (${this.config.rateLimits.maxFileSize})`,
			};
		}

		return { allowed: true };
	}

	/**
	 * Enforce read-only policy for Phase 1A
	 */
	enforceReadOnlyPolicy(operation: string): { allowed: boolean; reason?: string } {
		const readOnlyOperations = ['fs.read', 'fs.list', 'fs.search'];

		if (!readOnlyOperations.includes(operation)) {
			return {
				allowed: false,
				reason: `Operation '${operation}' not allowed in Phase 1A (read-only mode)`,
			};
		}

		return { allowed: true };
	}

	/**
	 * Get safe relative path for display purposes
	 */
	getSafeDisplayPath(path: string): string {
		try {
			const resolvedPath = resolve(path);

			// Find the closest allowed root to show relative path
			for (const allowedRoot of this.allowedRoots) {
				if (resolvedPath.startsWith(allowedRoot)) {
					const relativePath = relative(allowedRoot, resolvedPath);
					const rootName = allowedRoot.split('/').pop() || allowedRoot;
					return relativePath ? `${rootName}/${relativePath}` : rootName;
				}
			}

			// If not under any allowed root, show just the filename
			return path.split('/').pop() || path;
		} catch {
			return path;
		}
	}

	/**
	 * Validate and sanitize glob patterns for search
	 */
	validateSearchPattern(
		pattern: string,
		rootPath: string
	): { valid: boolean; sanitized?: string; reason?: string } {
		try {
			// Check if root path is allowed
			const pathCheck = this.validatePath(rootPath);
			if (!pathCheck.allowed) {
				return {
					valid: false,
					reason: pathCheck.reason,
				};
			}

			// Sanitize pattern to prevent directory traversal
			const sanitizedPattern = pattern
				.replace(/\.\./g, '') // Remove parent directory references
				.replace(/\/+/g, '/') // Normalize multiple slashes
				.replace(/^\//, ''); // Remove leading slash

			// Block potentially dangerous patterns
			const dangerousPatterns = [
				'/etc/',
				'/sys/',
				'/proc/',
				'/.git/',
				'/node_modules/',
				'/.ssh/',
				'/password',
				'/secret',
			];

			for (const dangerous of dangerousPatterns) {
				if (sanitizedPattern.toLowerCase().includes(dangerous)) {
					return {
						valid: false,
						reason: `Pattern contains restricted path: ${dangerous}`,
					};
				}
			}

			return {
				valid: true,
				sanitized: sanitizedPattern,
			};
		} catch (error) {
			return {
				valid: false,
				reason: `Invalid search pattern: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * Get configuration summary for debugging
	 */
	getConfigSummary(): {
		allowedRoots: string[];
		deniedPatterns: string[];
		maxFileSize: string;
		phase: string;
	} {
		return {
			allowedRoots: this.allowedRoots,
			deniedPatterns: this.deniedPatterns,
			maxFileSize: this.config.rateLimits.maxFileSize,
			phase: '1A (read-only)',
		};
	}

	/**
	 * Parse file size string to bytes (shared utility)
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
}
