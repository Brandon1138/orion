'use client';

import { Virtuoso } from 'react-virtuoso';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '@/lib/use-chat';

type MessageListProps = {
	messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
	return (
		<div role="log" aria-live="polite" className="flex-1">
			<Virtuoso
				style={{ height: '100%' }}
				data={messages}
				followOutput="smooth"
				itemContent={(_, m) => (
					<div className="mb-3">
						<MessageBubble role={m.role} content={m.content} timestamp={m.timestamp} />
					</div>
				)}
			/>
		</div>
	);
}
