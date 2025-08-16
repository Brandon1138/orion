type SessionListProps = {
	sessions: Array<{ id: string; label: string }>;
};

export function SessionList({ sessions }: SessionListProps) {
	return (
		<div className="flex h-full flex-col">
			{/* Header with new session button */}
			<div className="flex items-center justify-between p-6 border-b border-border">
				<div>
					<h2 className="text-sm font-semibold text-foreground">Sessions</h2>
					<p className="text-xs text-foreground-muted mt-1">Recent conversations</p>
				</div>
				<button className="interactive rounded-lg bg-surface-elevated p-2 hover:bg-surface focus-ring group">
					<svg className="h-4 w-4 text-foreground-secondary group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
					</svg>
				</button>
			</div>
			
			{/* Sessions list */}
			<div className="flex-1 overflow-hidden p-3">
				<div className="scrollbar-custom h-full overflow-y-auto space-y-2">
					{sessions.map((session, index) => (
						<SessionItem 
							key={session.id} 
							session={session} 
							isActive={index === 0}
							index={index}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

type SessionItemProps = {
	session: { id: string; label: string };
	isActive?: boolean;
	index?: number;
};

function SessionItem({ session, isActive = false, index = 0 }: SessionItemProps) {
	return (
		<div
			className={`
				group relative w-full rounded-xl p-3 text-left transition-all duration-200 cursor-pointer
				${isActive 
					? 'bg-surface-elevated border border-border-accent shadow-soft' 
					: 'hover:bg-surface-elevated hover:shadow-soft'
				}
			`}
		>
			{/* Active indicator */}
			{isActive && (
				<div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-gradient-primary"></div>
			)}
			
			<div className="flex items-center gap-3">
				{/* Session icon */}
				<div className={`
					flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center
					${isActive ? 'gradient-primary' : 'bg-surface'}
				`}>
					<svg className={`h-4 w-4 ${isActive ? 'text-white' : 'text-foreground-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
				</div>
				
				{/* Session info */}
				<div className="flex-1 min-w-0">
					<div className={`
						text-sm font-medium truncate
						${isActive ? 'text-foreground' : 'text-foreground-secondary group-hover:text-foreground'}
					`}>
						{session.label}
					</div>
					<div className="text-xs text-foreground-muted mt-1">
						{index === 0 ? 'Active now' : '2h ago'}
					</div>
				</div>
				
				{/* Menu button */}
				<button className="opacity-0 group-hover:opacity-100 rounded-lg p-1 hover:bg-surface transition-all focus-ring">
					<svg className="h-4 w-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
					</svg>
				</button>
			</div>
		</div>
	);
}
