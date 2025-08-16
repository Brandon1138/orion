export type ServerEvent =
	| { type: 'connected'; sessionId: string }
	| { type: 'ping'; ts: number }
	| { type: 'orion_ready' }
	| { type: 'message_started'; sessionId: string }
	| { type: 'tool_call_started'; sessionId?: string; tool: string; args?: Record<string, unknown> }
	| { type: 'assistant_token'; sessionId?: string; text: string }
	| {
			type: 'approval_requested';
			sessionId?: string;
			approvalId: string;
			tool: string;
			risk: 'low' | 'medium' | 'high';
	  }
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

/**
 * Open an SSE connection for a session and forward parsed events.
 * Returns an unsubscribe function to close the connection.
 */
export function connectToEvents(
	sessionId: string | '*',
	onEvent: (e: ServerEvent) => void
): () => void {
	const url = `/api/events?sessionId=${encodeURIComponent(sessionId)}`;
	console.log('[SSE] Connecting to:', url);
	const source = new EventSource(url, { withCredentials: false });

	source.onmessage = evt => {
		try {
			const data = JSON.parse(evt.data) as ServerEvent;
			console.log('[SSE] Received event:', data.type, data);
			if (data.type === 'assistant_completed') {
				console.log('[SSE] Assistant completed event details:', {
					sessionId: data.sessionId,
					textLength: data.text?.length,
					textPreview: data.text?.substring(0, 100)
				});
			}
			onEvent(data);
		} catch (error) {
			console.error('[SSE] Failed to parse event:', evt.data, error);
		}
	};

	source.onerror = (error) => {
		console.error('[SSE] Connection error:', error);
		// Keep the connection open; browser will attempt to reconnect
	};

	return () => {
		try {
			source.close();
		} catch {}
	};
}
