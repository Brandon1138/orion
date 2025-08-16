export type EventPayload =
	| { type: 'orion_ready' }
	| { type: 'message_started'; sessionId: string }
	| { type: 'tool_call_started'; sessionId?: string; tool: string; args?: Record<string, unknown> }
	| {
			type: 'approval_requested';
			sessionId?: string;
			approvalId: string;
			tool: string;
			risk: 'low' | 'medium' | 'high';
	  }
	| { type: 'assistant_token'; sessionId?: string; text: string }
	| {
			type: 'tool_call_completed';
			sessionId?: string;
			tool: string;
			ok: boolean;
			durationMs?: number;
	  }
	| { type: 'assistant_completed'; sessionId?: string; text: string }
	| { type: 'audit'; sessionId?: string; event: string; metadata?: Record<string, unknown> }
	| { type: 'error'; sessionId?: string; message: string };

type Sink = (event: EventPayload) => void;

// Map of sessionId (or '*' for all) to set of sinks
const subscribers = new Map<string, Set<Sink>>();

export function subscribe(sessionId: string | '*', sink: Sink): () => void {
	const key = sessionId ?? '*';
	const set = subscribers.get(key) ?? new Set<Sink>();
	set.add(sink);
	subscribers.set(key, set);
	return () => {
		set.delete(sink);
		if (set.size === 0) subscribers.delete(key);
	};
}

export function publishEvent(event: EventPayload): void {
	// Fanout to wildcard subscribers
	const all = subscribers.get('*');
	if (all) {
		for (const sink of all) {
			try {
				sink(event);
			} catch {
				/* ignore */
			}
		}
	}
	// Fanout to session-specific subscribers
	const sid = (event as any).sessionId;
	if (sid) {
		const set = subscribers.get(sid);
		if (set) {
			for (const sink of set) {
				try {
					sink(event);
				} catch {
					/* ignore */
				}
			}
		}
	}
}
