import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MessageBubbleProps = {
	role: 'assistant' | 'user' | 'system';
	content: string;
	timestamp?: string;
};

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
	const isUser = role === 'user';
	const isSystem = role === 'system';
	
	if (isSystem) {
		return <SystemMessage content={content} timestamp={timestamp} />;
	}
	
	return (
		<div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
			{/* Avatar */}
			<div className="flex-shrink-0">
				{isUser ? <UserAvatar /> : <AssistantAvatar />}
			</div>
			
			{/* Message content */}
			<div className={`flex-1 max-w-[80%] ${isUser ? 'flex flex-col items-end' : ''}`}>
				{/* Message header */}
				<div className={`flex items-center gap-2 mb-2 ${isUser ? 'flex-row-reverse' : ''}`}>
					<span className="text-xs font-medium text-foreground-secondary">
						{isUser ? 'You' : 'Orion'}
					</span>
					{timestamp && (
						<span className="text-xs text-foreground-muted">
							{timestamp}
						</span>
					)}
				</div>
				
				{/* Message bubble */}
				<div className={`
					rounded-2xl px-4 py-3 shadow-soft transition-all duration-200 hover:shadow-medium
					${isUser 
						? 'bg-gradient-primary text-white ml-8' 
						: 'bg-surface border border-border mr-8'
					}
				`}>
					<div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-neutral dark:prose-invert'}`}>
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							components={{
								code({ inline, className, children, ...props }: any) {
									const match = /language-(\w+)/.exec(className || '');
									if (!inline) {
										return (
											<div className="my-3">
												<div className="flex items-center justify-between rounded-t-lg bg-background-secondary px-3 py-2">
													<span className="text-xs text-foreground-muted">
														{match ? match[1] : 'code'}
													</span>
													<button className="text-xs text-foreground-muted hover:text-foreground transition-colors">
														Copy
													</button>
												</div>
												<pre className="mt-0 overflow-x-auto rounded-b-lg bg-background p-4 text-sm leading-relaxed">
													<code className={className} {...props}>
														{children}
													</code>
												</pre>
											</div>
										);
									}
									return (
										<code
											className={`rounded px-1.5 py-0.5 text-sm font-mono ${
												isUser 
													? 'bg-white/20 text-white' 
													: 'bg-surface-elevated text-foreground'
											}`}
											{...props}
										>
											{children}
										</code>
									);
								},
								blockquote({ children, ...props }) {
									return (
										<blockquote
											className={`border-l-2 pl-4 italic ${
												isUser 
													? 'border-white/30 text-white/90' 
													: 'border-border-elevated text-foreground-secondary'
											}`}
											{...props}
										>
											{children}
										</blockquote>
									);
								},
							}}
						>
							{content}
						</ReactMarkdown>
					</div>
				</div>
			</div>
		</div>
	);
}

function UserAvatar() {
	return (
		<div className="h-8 w-8 rounded-full bg-surface-elevated flex items-center justify-center ring-2 ring-border">
			<svg className="h-4 w-4 text-foreground-secondary" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
			</svg>
		</div>
	);
}

function AssistantAvatar() {
	return (
		<div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center shadow-glow">
			<svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
			</svg>
		</div>
	);
}

function SystemMessage({ content, timestamp }: { content: string; timestamp?: string }) {
	return (
		<div className="flex justify-center my-4 animate-fade-in">
			<div className="bg-surface-elevated border border-border rounded-full px-4 py-2 text-sm text-foreground-muted">
				<div className="flex items-center gap-2">
					<div className="h-1.5 w-1.5 rounded-full bg-foreground-muted"></div>
					<span>{content}</span>
					{timestamp && (
						<span className="text-xs text-foreground-subtle">
							{timestamp}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
