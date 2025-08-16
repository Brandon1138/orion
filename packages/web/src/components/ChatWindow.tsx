'use client';

import { Composer } from './Composer';
import { MessageList } from './MessageList';
import { useChatContext } from '@/lib/chat-context';
import { ApprovalModal } from './modals/ApprovalModal';

export function ChatWindow() {
	const { messages, sendMessage, isSending, pendingApproval, resolveApproval, sessionId } =
		useChatContext();
	
	return (
		<div className="flex h-full flex-col">
			{/* Messages area */}
			<div className="flex-1 min-h-0">
				{messages.length === 0 ? (
					<WelcomeView />
				) : (
					<MessageList messages={messages} />
				)}
			</div>
			
			{/* Loading indicator */}
			{isSending && (
				<div className="px-6 py-3">
					<TypingIndicator />
				</div>
			)}
			
			{/* Composer */}
			<div className="border-t border-border bg-surface/50 backdrop-blur-sm">
				<div className="p-4 sm:p-6">
					<Composer onSend={sendMessage} disabled={isSending} />
				</div>
			</div>
			
			{/* Approval modal */}
			<ApprovalModal
				open={!!pendingApproval}
				approvalId={pendingApproval?.approvalId}
				tool={pendingApproval?.tool}
				risk={pendingApproval?.risk}
				onDecision={approve =>
					pendingApproval?.approvalId && resolveApproval(pendingApproval.approvalId, approve)
				}
			/>
		</div>
	);
}

function WelcomeView() {
	return (
		<div className="flex h-full items-center justify-center p-4 sm:p-6">
			<div className="text-center max-w-sm sm:max-w-md w-full">
				<div className="mb-6">
					<div className="mx-auto h-16 w-16 rounded-2xl gradient-primary shadow-glow flex items-center justify-center animate-float">
						<svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
						</svg>
					</div>
				</div>
				
				<h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
					Ready to plan your day?
				</h3>
				
				<p className="text-foreground-muted text-sm sm:text-base leading-relaxed mb-6">
					I&apos;m here to help you organize your tasks, manage your schedule, and make the most of your time. 
					Start by sharing what you&apos;d like to accomplish today.
				</p>
				
				<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
					<SuggestionChip text="Plan my day with current tasks" />
					<SuggestionChip text="Review my calendar conflicts" />
					<SuggestionChip text="Help me prioritize my work" />
				</div>
			</div>
		</div>
	);
}

function SuggestionChip({ text }: { text: string }) {
	return (
		<button className="group rounded-xl bg-surface border border-border px-4 py-3 text-sm text-foreground-secondary hover:text-foreground hover:border-border-elevated hover:bg-surface-elevated transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background min-h-[44px] whitespace-nowrap">
			<span className="transition-all duration-300 ease-out group-hover:scale-[1.02]">
				{text}
			</span>
		</button>
	);
}

function TypingIndicator() {
	return (
		<div className="flex items-center gap-3">
			<div className="flex items-center justify-center h-8 w-8 rounded-lg bg-surface-elevated">
				<div className="h-4 w-4 rounded-full gradient-primary"></div>
			</div>
			<div className="flex items-center gap-1">
				<div className="h-2 w-2 rounded-full bg-foreground-muted animate-pulse-soft"></div>
				<div className="h-2 w-2 rounded-full bg-foreground-muted animate-pulse-soft" style={{ animationDelay: '0.2s' }}></div>
				<div className="h-2 w-2 rounded-full bg-foreground-muted animate-pulse-soft" style={{ animationDelay: '0.4s' }}></div>
			</div>
			<span className="text-sm text-foreground-muted">Orion is thinking...</span>
		</div>
	);
}
