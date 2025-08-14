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
				<p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
				{timestamp ? <p className="mt-1 text-[10px] text-neutral-500">{timestamp}</p> : null}
			</div>
		</div>
	);
}
