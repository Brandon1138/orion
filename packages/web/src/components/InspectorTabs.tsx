'use client';

import { useState } from 'react';
import { ToolInspector } from './ToolInspector';
import { PlanView } from './PlanView';
import { MemoryView } from './MemoryView';

type TabKey = 'tools' | 'plan' | 'memory';

const tabs = [
	{
		key: 'tools' as TabKey,
		label: 'Tools',
		icon: (
			<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
		),
	},
	{
		key: 'plan' as TabKey,
		label: 'Plan',
		icon: (
			<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
		),
	},
	{
		key: 'memory' as TabKey,
		label: 'Memory',
		icon: (
			<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
				/>
			</svg>
		),
	},
];

type InspectorTabsProps = {
	onToggleCollapse?: () => void;
	isCollapsed?: boolean;
};

export function InspectorTabs({ onToggleCollapse, isCollapsed = false }: InspectorTabsProps) {
	const [tab, setTab] = useState<TabKey>('tools');

	return (
		<div className="flex h-full flex-col overflow-hidden rounded-xl">
			{/* Header with glass effect */}
			<div className="glass-panel border-b border-border-elevated">
				<div className="p-4">
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-sm font-semibold text-foreground">Inspector</h2>
						<button
							type="button"
							aria-label={isCollapsed ? 'Expand inspector panel' : 'Collapse inspector panel'}
							title={
								isCollapsed ? 'Expand inspector (Ctrl/Cmd+B)' : 'Collapse inspector (Ctrl/Cmd+B)'
							}
							onClick={onToggleCollapse}
							className="interactive-subtle rounded-lg p-2 hover:bg-surface focus-ring-subtle"
						>
							<svg
								className={`h-4 w-4 text-foreground-secondary transition-transform duration-300 ease-out ${isCollapsed ? 'rotate-180' : ''}`}
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					</div>

					{/* Modern tab navigation */}
					<div className="flex bg-surface rounded-xl p-1 gap-3">
						{tabs.map(tabItem => (
							<button
								key={tabItem.key}
								onClick={() => setTab(tabItem.key)}
								className={`
									interactive flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 focus-ring
									${
										tab === tabItem.key
											? 'bg-surface-elevated text-foreground shadow-soft'
											: 'text-foreground-secondary hover:text-foreground hover:bg-surface-elevated'
									}
								`}
							>
								<span className={tab === tabItem.key ? 'text-primary' : ''}>{tabItem.icon}</span>
								<span>{tabItem.label}</span>
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Content area */}
			<div className="flex-1 overflow-hidden">
				<div className="scrollbar-custom h-full overflow-y-auto p-4">
					<div className="animate-fade-in">
						{tab === 'tools' && <ToolInspector />}
						{tab === 'plan' && <PlanView />}
						{tab === 'memory' && <MemoryView />}
					</div>
				</div>
			</div>
		</div>
	);
}
