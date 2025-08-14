/**
 * MemoryStore — Sprint 4
 * - Short-term session memory with TTL and size caps
 * - JSONL snapshots per session
 * - Optional long-term KV toggle (noop in Phase 1A)
 */
export type MemoryItem = {
    ts: string;
    kind: 'message' | 'event' | 'note';
    data: Record<string, unknown>;
};
export interface MemoryConfig {
    ttlSeconds?: number;
    maxItems?: number;
    snapshotPath?: string;
    enableLongTermKV?: boolean;
}
export declare class MemoryStore {
    private config;
    private sessionIdToItems;
    constructor(config?: MemoryConfig);
    ensureSession(sessionId: string): void;
    remember(sessionId: string, item: MemoryItem): Promise<void>;
    getRecent(sessionId: string, limit?: number): MemoryItem[];
    prune(sessionId: string): void;
    private snapshot;
}
export default MemoryStore;
