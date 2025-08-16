'use client';

import { createContext, useContext } from 'react';
import { useChat, type ChatMessage, type ToolEvent } from './use-chat';

export type ChatContextValue = ReturnType<typeof useChat>;

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
	const value = useChat();
	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
	const ctx = useContext(ChatContext);
	if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
	return ctx;
}
