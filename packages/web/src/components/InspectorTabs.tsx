'use client';

import { useState } from 'react';

type TabKey = 'tools' | 'plan' | 'memory';

export function InspectorTabs() {
	const [tab, setTab] = useState<TabKey>('tools');
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center gap-1 border-b border-neutral-200 px-2 py-2 text-sm dark:border-neutral-800">
				<button
					className={`rounded px-2 py-1 ${tab === 'tools' ? 'font-medium text-neutral-800 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-300'} hover:bg-neutral-100 dark:hover:bg-neutral-800`}
					onClick={() => setTab('tools')}
				>
					Tools
				</button>
				<button
					className={`rounded px-2 py-1 ${tab === 'plan' ? 'font-medium text-neutral-800 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-300'} hover:bg-neutral-100 dark:hover:bg-neutral-800`}
					onClick={() => setTab('plan')}
				>
					Plan
				</button>
				<button
					className={`rounded px-2 py-1 ${tab === 'memory' ? 'font-medium text-neutral-800 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-300'} hover:bg-neutral-100 dark:hover:bg-neutral-800`}
					onClick={() => setTab('memory')}
				>
					Memory
				</button>
			</div>
			<div className="scrollbar-thin scrollbar-thumb-rounded flex-1 space-y-2 overflow-y-auto p-2">
				{tab === 'tools' && (
					<div className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
						<p className="text-xs text-neutral-600 dark:text-neutral-400">
							Tool timeline will appear here.
						</p>
					</div>
				)}
				{tab === 'plan' && (
					<div className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
						<p className="text-xs text-neutral-600 dark:text-neutral-400">
							Task plan visualization will appear here.
						</p>
					</div>
				)}
				{tab === 'memory' && (
					<div className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
						<p className="text-xs text-neutral-600 dark:text-neutral-400">
							Memory timeline will appear here.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
