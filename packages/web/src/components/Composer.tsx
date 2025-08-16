'use client';

import { useState } from 'react';

type ComposerProps = {
	onSend: (
		text: string,
		options?: { dryRun?: boolean; useAgent?: boolean; approveLow?: boolean }
	) => void;
	disabled?: boolean;
};

export function Composer({ onSend, disabled }: ComposerProps) {
	const [text, setText] = useState('');
	const [useAgent, setUseAgent] = useState(true);
	const [approveLow, setApproveLow] = useState(true);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!text.trim() || disabled) return;
		onSend(text, { dryRun: false, useAgent, approveLow });
		setText('');
	}

	return (
		<form className="flex items-end gap-2" onSubmit={handleSubmit}>
			<textarea
				rows={3}
				value={text}
				onChange={e => setText(e.target.value)}
				placeholder="Send a message..."
				disabled={!!disabled}
				className="min-h-[44px] w-full resize-y rounded-md border border-neutral-300 bg-white p-2 text-sm shadow-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-900"
			/>
			<div className="flex items-center gap-2">
				<label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300">
					<input
						type="checkbox"
						checked={useAgent}
						onChange={e => setUseAgent(e.target.checked)}
						disabled={!!disabled}
					/>
					Use Agent
				</label>
				<label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300">
					<input
						type="checkbox"
						checked={approveLow}
						onChange={e => setApproveLow(e.target.checked)}
						disabled={!!disabled}
					/>
					Auto-approve low
				</label>
				<button
					type="button"
					onClick={() =>
						text.trim() && !disabled && onSend(text, { dryRun: true, useAgent, approveLow })
					}
					disabled={!!disabled}
					className="rounded-md border border-neutral-300 px-2 py-1 text-sm hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed dark:border-neutral-700 dark:hover:bg-neutral-800"
				>
					Dry Run
				</button>
				<button
					type="submit"
					disabled={!!disabled}
					className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
				>
					Send
				</button>
			</div>
		</form>
	);
}
