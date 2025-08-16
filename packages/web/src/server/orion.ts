import fs from 'node:fs';
import path from 'node:path';
import OrionCore from '@orion/core/src/index.js';
import type { Message } from '@orion/core/src/types.js';
import { db } from './db';
import { sessions as sessionsTable, messages as messagesTable } from './schema';
import { desc, eq } from 'drizzle-orm';
import type { OrionConfig } from '@orion/core/src/types.js';
import { requestApproval } from './approvals';
import { publishEvent } from './events';

let singleton: OrionCore | null = null;

function findConfigPath(): string {
	// Try current working dir first, then walk up a couple levels for monorepo root
	const candidates = [
		path.resolve(process.cwd(), 'orion.config.json'),
		path.resolve(process.cwd(), '../../orion.config.json'),
		path.resolve(process.cwd(), '../../../orion.config.json'),
	];
	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) return candidate;
	}
	throw new Error('orion.config.json not found');
}

function loadConfig(): OrionConfig {
	const configPath = findConfigPath();
	const raw = fs.readFileSync(configPath, 'utf-8');
	return JSON.parse(raw) as OrionConfig;
}

export function getOrion(): OrionCore {
	if (singleton) return singleton;

	const config = loadConfig();
	const orion = new OrionCore(config);

	// Hydrate recent sessions/messages from SQLite (best-effort)
	try {
		const recent = db
			.select()
			.from(sessionsTable)
			.orderBy(desc(sessionsTable.startTime))
			.limit(20) as any;
		const recentRows = recent.all?.() ?? [];
		for (const s of recentRows as any[]) {
			const msgSel =
				(
					db
						.select()
						.from(messagesTable)
						.where(eq(messagesTable.sessionId, s.sessionId))
						.orderBy(messagesTable.id) as any
				).all?.() ?? [];
			const msgs: Message[] = (msgSel as any[]).map(r => ({
				role: r.role,
				content: r.content,
				timestamp: new Date(r.timestamp),
			}));
			orion.restoreSession({
				sessionId: s.sessionId,
				userId: s.userId,
				state: s.state,
				pattern: s.pattern,
				messages: msgs,
				startTime: new Date(s.startTime),
				preferences: config.profile,
			});
		}
	} catch {}

	// Wire approval handler to the registry so UI can resolve later
	orion.setApprovalHandler(async action => {
		// We do not have sessionId passed from ActionEngine; publish without one.
		const { approvalId, promise } = requestApproval({
			tool: action.tool,
			risk: action.risk ?? 'medium',
			args: action.args,
		});

		publishEvent({
			type: 'approval_requested',
			tool: action.tool,
			risk: action.risk ?? 'medium',
			approvalId,
		});
		return promise;
	});

	// Minimal redaction for args forwarded to clients
	function redactArgs(
		args: Record<string, unknown> | undefined
	): Record<string, unknown> | undefined {
		if (!args) return undefined;
		const clone: Record<string, unknown> = { ...args };
		for (const key of Object.keys(clone)) {
			const lower = key.toLowerCase();
			if (lower.includes('token') || lower.includes('authorization')) {
				clone[key] = '[redacted]';
			}
		}
		return clone;
	}

	// Bridge Orion audit log to SSE event bus
	orion.onAudit((event, payload) => {
		try {
			const sessionId = (payload as any)?.sessionId as string | undefined;
			const tool = (payload as any)?.tool as string | undefined;
			if (event === 'approval_requested') {
				// Handled above with approvalId; skip duplicate generic audit
				return;
			}
			if (event === 'tool_called' && tool) {
				publishEvent({
					type: 'tool_call_started',
					sessionId,
					tool,
					args: redactArgs((payload as any)?.args as any),
				});
				return;
			}
			if (event === 'completed' && tool) {
				publishEvent({
					type: 'tool_call_completed',
					sessionId,
					tool,
					ok: true,
					durationMs: (payload as any)?.durationMs as number | undefined,
				});
				return;
			}
			if (event === 'error' && tool) {
				publishEvent({
					type: 'tool_call_completed',
					sessionId,
					tool,
					ok: false,
					durationMs: (payload as any)?.durationMs as number | undefined,
				});
			}
			// Always forward raw audit event for inspector
			publishEvent({ type: 'audit', sessionId, event, metadata: payload as any });
		} catch {
			// ignore fanout errors
		}
	});

	publishEvent({ type: 'orion_ready' });
	singleton = orion;
	return orion;
}
