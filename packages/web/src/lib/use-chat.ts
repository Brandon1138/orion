'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connectToEvents, type ServerEvent } from './sse-client';
import type { TaskPlan } from './types';

export type ChatMessage = {
	id: string;
	role: 'assistant' | 'user' | 'system';
	content: string;
	timestamp?: string;
};

export type ToolEvent = {
	id: string;
	tool: string;
	status: 'started' | 'completed';
	ok?: boolean;
	durationMs?: number;
	args?: Record<string, unknown>;
	startedAt?: string;
	completedAt?: string;
};

export type PendingApproval = {
	approvalId: string;
	tool: string;
	risk: 'low' | 'medium' | 'high';
};

export function useChat(initialSessionId?: string) {
	const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	
	// Debug logging for message state changes
	useEffect(() => {
		console.log('[CHAT] Messages state changed:', messages.length, 'messages:', messages.map(m => ({ id: m.id, role: m.role, contentLength: m.content.length })));
	}, [messages]);
	// For token streaming: track the id of the in-progress assistant message
	const streamingAssistantIdRef = useRef<string | null>(null);
	const [isSending, setIsSending] = useState(false);
	const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);
	const [approvalQueue, setApprovalQueue] = useState<PendingApproval[]>([]);
	const [taskPlan, setTaskPlan] = useState<TaskPlan | null>(null);
	const idCounter = useRef(0);

	function nextId(prefix: string): string {
		idCounter.current += 1;
		return `${prefix}-${Date.now()}-${idCounter.current}`;
	}

	// Ensure a session exists
	useEffect(() => {
		if (sessionId) return;
		let cancelled = false;
		(async () => {
			try {
				const resp = await fetch('/api/sessions', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({}),
				});
				if (!resp.ok) return;
				const data = (await resp.json()) as { sessionId: string };
				if (!cancelled) setSessionId(data.sessionId);
			} catch {}
		})();
		return () => {
			cancelled = true;
		};
	}, [sessionId]);

	// Load history when session is ready
	useEffect(() => {
		if (!sessionId) return;
		let aborted = false;
		(async () => {
			try {
				const resp = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/history`);
				if (!resp.ok) return;
				const data = (await resp.json()) as {
					messages: Array<{
						role: 'assistant' | 'user' | 'system';
						content: string;
						timestamp?: string;
					}>;
					state?: string;
					pattern?: string;
					taskPlan?: TaskPlan;
				};
				if (!aborted) {
					console.log('[CHAT] Loading history, found', data.messages.length, 'messages');
					const historyMessages = data.messages.map((m, idx) => ({
						id: `h-${idx}`,
						role: m.role,
						content: m.content,
						timestamp: m.timestamp,
					}));
					console.log('[CHAT] Setting messages from history:', historyMessages);
					setMessages(prev => {
						// Only replace with history if we don't have any current messages
						// to avoid overwriting messages that were just added
						if (prev.length === 0) {
							console.log('[CHAT] No current messages, using history');
							return historyMessages;
						} else {
							console.log('[CHAT] Current messages exist, keeping them instead of history');
							return prev;
						}
					});
					setTaskPlan(data.taskPlan ?? null);
				}
			} catch {}
		})();
		return () => {
			aborted = true;
		};
	}, [sessionId]);

	// Connect SSE for events (assistant tokens, completions, tools, approvals)
	useEffect(() => {
		if (!sessionId) return;
		const off = connectToEvents(sessionId, (e: ServerEvent) => {
			if (e.type === 'assistant_token' && e.text) {
				setMessages(prev => {
					// If we already have an in-progress assistant message, append
					const currentId = streamingAssistantIdRef.current;
					if (currentId) {
						return prev.map(m => (m.id === currentId ? { ...m, content: m.content + e.text } : m));
					}
					// Otherwise create a new in-progress assistant message
					const id = crypto.randomUUID();
					streamingAssistantIdRef.current = id;
					return [
						...prev,
						{
							id,
							role: 'assistant',
							content: e.text,
							timestamp: new Date().toISOString(),
						},
					];
				});
				return;
			}
			if (e.type === 'assistant_completed' && e.text) {
				console.log('[CHAT] Processing assistant_completed event:', e.text.length, 'chars');
				setMessages(prev => {
					const currentId = streamingAssistantIdRef.current;
					streamingAssistantIdRef.current = null;
					if (!currentId) {
						// No streaming happened; append a fresh assistant message
						console.log('[CHAT] Adding new assistant message to', prev.length, 'existing messages');
						const newMessage = {
							id: crypto.randomUUID(),
							role: 'assistant' as const,
							content: e.text,
							timestamp: new Date().toISOString(),
						};
						console.log('[CHAT] New message created:', newMessage);
						const newMessages = [...prev, newMessage];
						console.log('[CHAT] Updated messages array length:', newMessages.length);
						return newMessages;
					}
					// If streaming occurred, ensure the final text matches; prefer server final
					console.log('[CHAT] Updating existing streaming message with id:', currentId);
					return prev.map(m => (m.id === currentId ? { ...m, content: e.text } : m));
				});
			}
			if (e.type === 'tool_call_started') {
				const id = nextId('tool');
				setToolEvents(prev => [
					...prev,
					{
						id,
						tool: e.tool,
						status: 'started',
						args: e.args,
						startedAt: new Date().toISOString(),
					},
				]);
			}
			if (e.type === 'tool_call_completed') {
				setToolEvents(prev => {
					// Find the most recent started event for this tool that is not yet completed
					const idx = [...prev]
						.reverse()
						.findIndex(ev => ev.tool === e.tool && ev.status === 'started');
					if (idx === -1) {
						// No matching start; append a completed event
						return [
							...prev,
							{
								id: nextId('tool'),
								tool: e.tool,
								status: 'completed',
								ok: e.ok,
								durationMs: e.durationMs,
								completedAt: new Date().toISOString(),
							},
						];
					}
					const realIdx = prev.length - 1 - idx;
					const updated = [...prev];
					updated[realIdx] = {
						...updated[realIdx],
						status: 'completed',
						ok: e.ok,
						durationMs: e.durationMs,
						completedAt: new Date().toISOString(),
					};
					return updated;
				});
			}
			if (e.type === 'approval_requested') {
				setApprovalQueue(prev => [
					...prev,
					{ approvalId: e.approvalId, tool: e.tool, risk: e.risk },
				]);
			}
		});
		return off;
	}, [sessionId]);

	const pendingApproval = useMemo(() => approvalQueue[0] ?? null, [approvalQueue]);

	const resolveApproval = useCallback(async (approvalId: string, approve: boolean) => {
		try {
			const resp = await fetch('/api/approvals', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ approvalId, approve }),
			});
			if (!resp.ok) return false;
			const data = (await resp.json()) as { ok: boolean };
			if (data.ok) {
				setApprovalQueue(prev => prev.filter(a => a.approvalId !== approvalId));
				return true;
			}
			return false;
		} catch {
			return false;
		}
	}, []);

	async function sendMessage(
		text: string,
		options?: { dryRun?: boolean; useAgent?: boolean; approveLow?: boolean }
	) {
		// Lazily create a session if one doesn't exist yet so the first message succeeds
		let activeSessionId = sessionId;
		if (!activeSessionId) {
			try {
				const resp = await fetch('/api/sessions', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({}),
				});
				if (resp.ok) {
					const data = (await resp.json()) as { sessionId: string };
					activeSessionId = data.sessionId;
					setSessionId(data.sessionId);
				} else {
					return;
				}
			} catch {
				return;
			}
		}
		const userMsg: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			content: text,
			timestamp: new Date().toISOString(),
		};
		console.log('[CHAT] Adding user message:', userMsg);
		setMessages(prev => {
			console.log('[CHAT] Previous messages before adding user message:', prev.length);
			const newMessages = [...prev, userMsg];
			console.log('[CHAT] New messages after adding user message:', newMessages.length);
			return newMessages;
		});
		setIsSending(true);
		try {
			const resp = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId: activeSessionId,
					message: text,
					useAgent: options?.useAgent ?? true,
					dryRun: options?.dryRun ?? false,
					approveLow: options?.approveLow ?? true,
				}),
			});
			// Prefer SSE to append assistant responses, but also capture TaskPlan if present in body
			if (resp.ok) {
				const data = (await resp.json().catch(() => undefined)) as
					| { taskPlan?: TaskPlan }
					| undefined;
				if (data?.taskPlan) setTaskPlan(data.taskPlan);
			}
		} catch {
			// ignore for now; could surface toast
		} finally {
			setIsSending(false);
		}
	}

	return {
		sessionId,
		messages,
		isSending,
		sendMessage,
		toolEvents,
		pendingApproval,
		resolveApproval,
		taskPlan,
	} as const;
}
