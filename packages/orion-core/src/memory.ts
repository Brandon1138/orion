/**
 * MemoryStore — Sprint 4
 * - Short-term session memory with TTL and size caps
 * - JSONL snapshots per session
 * - Optional long-term KV toggle (noop in Phase 1A)
 */

import { appendFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

export type MemoryItem = {
	ts: string;
	kind: 'message' | 'event' | 'note';
	data: Record<string, unknown>;
};

export interface MemoryConfig {
	ttlSeconds?: number; // default 3600 (1h)
	maxItems?: number; // default 200
	snapshotPath?: string; // default ./logs/memory
	enableLongTermKV?: boolean; // reserved, not implemented in Phase 1A
}

export class MemoryStore {
	private sessionIdToItems: Map<string, MemoryItem[]> = new Map();

	constructor(private config: MemoryConfig = {}) {}

	ensureSession(sessionId: string): void {
		if (!this.sessionIdToItems.has(sessionId)) {
			this.sessionIdToItems.set(sessionId, []);
		}
	}

	async remember(sessionId: string, item: MemoryItem): Promise<void> {
		this.ensureSession(sessionId);
		const items = this.sessionIdToItems.get(sessionId)!;
		items.push(item);
		this.prune(sessionId);
		await this.snapshot(sessionId, item);
	}

	getRecent(sessionId: string, limit = 20): MemoryItem[] {
		const items = this.sessionIdToItems.get(sessionId) ?? [];
		return items.slice(-limit);
	}

	prune(sessionId: string): void {
		const items = this.sessionIdToItems.get(sessionId);
		if (!items) return;

		const ttlSeconds = this.config.ttlSeconds ?? 3600;
		const maxItems = this.config.maxItems ?? 200;

		const now = Date.now();
		// TTL prune
		const ttlCutoff = now - ttlSeconds * 1000;
		const kept: MemoryItem[] = [];
		for (const it of items) {
			const ts = Date.parse(it.ts);
			if (isNaN(ts) || ts >= ttlCutoff) kept.push(it);
		}

		// Size cap
		const startIdx = Math.max(0, kept.length - maxItems);
		const capped = kept.slice(startIdx);
		this.sessionIdToItems.set(sessionId, capped);
	}

	private async snapshot(sessionId: string, item: MemoryItem): Promise<void> {
		try {
			const base = this.config.snapshotPath || './logs/memory';
			const filePath = `${base}/memory-${sessionId}.jsonl`;
			const dir = dirname(filePath);
			await mkdir(dir, { recursive: true });
			await appendFile(filePath, `${JSON.stringify({ sessionId, ...item })}\n`).catch(() => {});
		} catch {
			// ignore snapshot errors
		}
	}
}

export default MemoryStore;
