'use client';

import { useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';

type ChatMessage = {
	id: string;
	role: 'assistant' | 'user' | 'system';
	content: string;
	timestamp?: string;
};

export function ChatWindow() {
	const [messages, setMessages] = useState<ChatMessage[]>([
		{ id: 'm1', role: 'assistant', content: 'Hello! Ask me anything about your plan.' },
		{ id: 'm2', role: 'user', content: 'Show me today’s tasks.' },
	]);

	function handleSend(text: string) {
		const newMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
		setMessages(prev => [...prev, newMsg]);
		// TODO: Wire to /api/chat in a follow-up LOP.
	}

	return (
		<div className="flex h-full flex-col">
			<div className="scrollbar-thin scrollbar-thumb-rounded flex-1 space-y-3 overflow-y-auto">
				{messages.map(m => (
					<MessageBubble key={m.id} role={m.role} content={m.content} timestamp={m.timestamp} />
				))}
			</div>
			<div className="mt-3">
				<Composer onSend={handleSend} />
			</div>
		</div>
	);
}
