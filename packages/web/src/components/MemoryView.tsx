'use client';

import { useEffect, useMemo, useState } from 'react';
import { useChatContext } from '@/lib/chat-context';
import type { MemoryItem } from '@/lib/types';

function KindBadge({ kind }: { kind: MemoryItem['kind'] }) {
	const icon = kind === 'message' ? '💬' : kind === 'event' ? '⚙️' : '📝';
	const label = kind;
	return (
		<span className="mr-2 inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
			<span aria-hidden>{icon}</span>
			<span className="uppercase">{label}</span>
		</span>
	);
}

function JsonPreview({ data }: { data: Record<string, unknown> }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="mt-1">
			<button
				className="rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
				onClick={() => setOpen(o => !o)}
			>
				{open ? 'Hide details' : 'Show details'}
			</button>
			{open ? (
				<pre className="mt-1 max-h-32 overflow-auto rounded bg-neutral-950 p-2 text-[11px] text-neutral-100">
					{JSON.stringify(data, null, 2)}
				</pre>
			) : null}
		</div>
	);
}

export function MemoryView() {
	const { sessionId } = useChatContext();
	const [items, setItems] = useState<MemoryItem[]>([]);

	useEffect(() => {
		if (!sessionId) return;
		let aborted = false;
		(async () => {
			try {
				const resp = await fetch(`/api/memory/${encodeURIComponent(sessionId)}/recent?limit=50`);
				if (!resp.ok) return;
				const data = (await resp.json()) as { items: MemoryItem[] };
				if (!aborted) setItems(data.items);
			} catch {}
		})();
		return () => {
			aborted = true;
		};
	}, [sessionId]);

	const reversed = useMemo(() => [...items].reverse(), [items]);

	return (
		<div className="rounded-md border border-neutral-200 p-2 text-xs dark:border-neutral-800">
			{reversed.length === 0 ? (
				<p className="text-neutral-600 dark:text-neutral-400">No recent memory items</p>
			) : (
				<div className="space-y-2">
					{reversed.map((it, idx) => (
						<div
							key={`${it.ts}-${idx}`}
							className="rounded border border-neutral-200 p-2 dark:border-neutral-800"
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<KindBadge kind={it.kind} />
									<div className="text-[12px] text-neutral-900 dark:text-neutral-100">
										{new Date(it.ts).toLocaleString()}
									</div>
								</div>
							</div>
							<JsonPreview data={it.data} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default MemoryView;
