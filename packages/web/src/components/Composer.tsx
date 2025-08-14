'use client';

import { useState } from 'react';

type ComposerProps = {
	onSend: (text: string, options?: { dryRun?: boolean }) => void;
};

export function Composer({ onSend }: ComposerProps) {
	const [text, setText] = useState('');

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!text.trim()) return;
		onSend(text);
		setText('');
	}

	return (
		<form className="flex items-end gap-2" onSubmit={handleSubmit}>
			<textarea
				rows={3}
				value={text}
				onChange={e => setText(e.target.value)}
				placeholder="Send a message..."
				className="min-h-[44px] w-full resize-y rounded-md border border-neutral-300 bg-white p-2 text-sm shadow-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
			/>
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => text.trim() && onSend(text, { dryRun: true })}
					className="rounded-md border border-neutral-300 px-2 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
				>
					Dry Run
				</button>
				<button
					type="submit"
					className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-brand-700"
				>
					Send
				</button>
			</div>
		</form>
	);
}
