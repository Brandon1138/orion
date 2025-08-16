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
				itemContent={(index, message) => (
					<div 
						className="mb-6 animate-slide-up" 
						style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
					>
						<MessageBubble 
							role={message.role} 
							content={message.content} 
							timestamp={message.timestamp} 
						/>
					</div>
				)}
			/>
		</div>
	);
}
