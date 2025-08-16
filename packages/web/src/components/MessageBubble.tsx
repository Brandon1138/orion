import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MessageBubbleProps = {
	role: 'assistant' | 'user' | 'system';
	content: string;
	timestamp?: string;
};

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
	const isUser = role === 'user';
	const roleLabel = role === 'assistant' ? 'Assistant' : role === 'system' ? 'System' : 'You';
	return (
		<div className={isUser ? 'text-right' : 'text-left'}>
			<div className="inline-block max-w-[75%] rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
				<p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
					{roleLabel}
				</p>
				<div className="prose prose-sm mt-1 max-w-none dark:prose-invert">
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							code({ inline, className, children, ...props }: any) {
								const match = /language-(\w+)/.exec(className || '');
								if (!inline) {
									return (
										<pre className="mt-2 overflow-x-auto rounded-md bg-neutral-900 p-3 text-[12px] leading-relaxed text-neutral-100">
											<code className={className} {...props}>
												{children}
											</code>
										</pre>
									);
								}
								return (
									<code
										className="rounded bg-neutral-200 px-1 py-0.5 text-[0.85em] dark:bg-neutral-800"
										{...props}
									>
										{children}
									</code>
								);
							},
						}}
					>
						{content}
					</ReactMarkdown>
				</div>
				{timestamp ? <p className="mt-1 text-[10px] text-neutral-500">{timestamp}</p> : null}
			</div>
		</div>
	);
}
