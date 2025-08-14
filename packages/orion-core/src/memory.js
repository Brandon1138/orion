/**
 * MemoryStore — Sprint 4
 * - Short-term session memory with TTL and size caps
 * - JSONL snapshots per session
 * - Optional long-term KV toggle (noop in Phase 1A)
 */
import { appendFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
export class MemoryStore {
    config;
    sessionIdToItems = new Map();
    constructor(config = {}) {
        this.config = config;
    }
    ensureSession(sessionId) {
        if (!this.sessionIdToItems.has(sessionId)) {
            this.sessionIdToItems.set(sessionId, []);
        }
    }
    async remember(sessionId, item) {
        this.ensureSession(sessionId);
        const items = this.sessionIdToItems.get(sessionId);
        items.push(item);
        this.prune(sessionId);
        await this.snapshot(sessionId, item);
    }
    getRecent(sessionId, limit = 20) {
        const items = this.sessionIdToItems.get(sessionId) ?? [];
        return items.slice(-limit);
    }
    prune(sessionId) {
        const items = this.sessionIdToItems.get(sessionId);
        if (!items)
            return;
        const ttlSeconds = this.config.ttlSeconds ?? 3600;
        const maxItems = this.config.maxItems ?? 200;
        const now = Date.now();
        // TTL prune
        const ttlCutoff = now - ttlSeconds * 1000;
        const kept = [];
        for (const it of items) {
            const ts = Date.parse(it.ts);
            if (isNaN(ts) || ts >= ttlCutoff)
                kept.push(it);
        }
        // Size cap
        const startIdx = Math.max(0, kept.length - maxItems);
        const capped = kept.slice(startIdx);
        this.sessionIdToItems.set(sessionId, capped);
    }
    async snapshot(sessionId, item) {
        try {
            const base = this.config.snapshotPath || './logs/memory';
            const filePath = `${base}/memory-${sessionId}.jsonl`;
            const dir = dirname(filePath);
            await mkdir(dir, { recursive: true });
            await appendFile(filePath, `${JSON.stringify({ sessionId, ...item })}\n`).catch(() => { });
        }
        catch {
            // ignore snapshot errors
        }
    }
}
export default MemoryStore;
