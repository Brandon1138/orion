'use client';

import { useMemo, useState } from 'react';
import { useChatContext } from '@/lib/chat-context';

function RedactedBadge() {
	return (
		<span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
			redacted
		</span>
	);
}

function ExpandableJson({ data }: { data?: Record<string, unknown> }) {
	const [open, setOpen] = useState(false);
	const hasRedacted = useMemo(() => {
		if (!data) return false;
		return Object.values(data).some(v => v === '[redacted]');
	}, [data]);
	if (!data) return null;
	return (
		<div className="mt-1">
			<button
				onClick={() => setOpen(o => !o)}
				className="rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
				aria-expanded={open}
			>
				{open ? 'Hide args' : 'Show args'}
				{hasRedacted ? <RedactedBadge /> : null}
			</button>
			{open ? (
				<pre className="mt-1 max-h-32 overflow-auto rounded bg-neutral-950 p-2 text-[11px] text-neutral-100">
					{JSON.stringify(data, null, 2)}
				</pre>
			) : null}
		</div>
	);
}

export function ToolInspector() {
	const { toolEvents } = useChatContext();
	const items = useMemo(() => [...toolEvents].reverse(), [toolEvents]);
	return (
		<div className="space-y-2">
			{items.length === 0 ? (
				<p className="text-xs text-neutral-600 dark:text-neutral-400">No tool activity yet</p>
			) : null}
			{items.map(ev => (
				<div
					key={ev.id}
					className="rounded-md border border-neutral-200 p-2 text-xs dark:border-neutral-800"
				>
					<div className="flex items-center justify-between">
						<div className="font-mono text-[12px]">{ev.tool}</div>
						<div>
							<span
								className={`rounded px-1.5 py-0.5 text-[10px] ${
									ev.status === 'completed'
										? ev.ok
											? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
											: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
										: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
								}`}
							>
								{ev.status === 'completed' ? (ev.ok ? 'completed' : 'failed') : 'started'}
							</span>
							{typeof ev.durationMs === 'number' ? (
								<span className="ml-2 text-[10px] text-neutral-500">{ev.durationMs} ms</span>
							) : null}
						</div>
					</div>
					<ExpandableJson data={ev.args} />
				</div>
			))}
		</div>
	);
}

export default ToolInspector;
