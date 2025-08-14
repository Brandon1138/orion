type SessionListProps = {
	sessions: Array<{ id: string; label: string }>;
};

export function SessionList({ sessions }: SessionListProps) {
	return (
		<div className="flex min-h-0 flex-col gap-2">
			<div className="flex items-center justify-between">
				<h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Sessions</h2>
				<div className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white/90">
					New
				</div>
			</div>
			<div className="scrollbar-thin scrollbar-thumb-rounded -mr-2 flex-1 space-y-1 overflow-y-auto pr-1">
				{sessions.map(s => (
					<div
						key={s.id}
						className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
					>
						{s.label}
					</div>
				))}
			</div>
		</div>
	);
}
