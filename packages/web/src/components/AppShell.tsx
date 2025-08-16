'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { InspectorTabs } from '@/components/InspectorTabs';
import { SessionList } from '@/components/SessionList';

type AppShellProps = {
	children: ReactNode;
};

function getInitialCollapsed(key: string, fallback: boolean): boolean {
	if (typeof window === 'undefined') return fallback;
	try {
		const stored = window.localStorage.getItem(key);
		if (stored === 'true') return true;
		if (stored === 'false') return false;
	} catch {}
	return fallback;
}

export function AppShell({ children }: AppShellProps) {
	const [isLgUp, setIsLgUp] = useState<boolean>(
		typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
	);

	const [leftCollapsed, setLeftCollapsed] = useState<boolean>(() =>
		getInitialCollapsed('orion_leftCollapsed', true)
	);
	const [rightCollapsed, setRightCollapsed] = useState<boolean>(() =>
		getInitialCollapsed('orion_rightCollapsed', true)
	);

	// Persist to localStorage
	useEffect(() => {
		try {
			localStorage.setItem('orion_leftCollapsed', String(leftCollapsed));
		} catch {}
	}, [leftCollapsed]);
	useEffect(() => {
		try {
			localStorage.setItem('orion_rightCollapsed', String(rightCollapsed));
		} catch {}
	}, [rightCollapsed]);

	// Keyboard shortcut: Cmd/Ctrl + B toggles both panels
	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
				e.preventDefault();
				setLeftCollapsed(v => !v);
				setRightCollapsed(v => !v);
			}
			if (e.key === 'Escape') {
				setLeftCollapsed(true);
				setRightCollapsed(true);
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	// Responsive: track breakpoint and collapse on mobile
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(min-width: 1024px)');
		const handler = () => {
			setIsLgUp(mq.matches);
			if (!mq.matches) {
				setLeftCollapsed(true);
				setRightCollapsed(true);
			}
		};
		handler();
		mq.addEventListener?.('change', handler);
		return () => mq.removeEventListener?.('change', handler as any);
	}, []);

	const centerLgCols = useMemo(() => {
		if (leftCollapsed && rightCollapsed) return 'lg:col-span-12';
		if (leftCollapsed !== rightCollapsed) return 'lg:col-span-10';
		return 'lg:col-span-8';
	}, [leftCollapsed, rightCollapsed]);

	const centerXlCols = useMemo(() => {
		if (leftCollapsed && rightCollapsed) return 'xl:col-span-12';
		if (leftCollapsed !== rightCollapsed) return 'xl:col-span-9';
		return 'xl:col-span-6';
	}, [leftCollapsed, rightCollapsed]);

	const handleTempOpenLeft = useCallback(() => setLeftCollapsed(false), []);
	const handleTempOpenRight = useCallback(() => setRightCollapsed(false), []);

	return (
		<main
			id="mainContent"
			role="main"
			className="mx-auto grid w-full max-w-full flex-1 min-h-0 grid-cols-12 gap-4 px-4 py-4 xl:max-w-[1920px] xl:px-6 xl:py-6"
		>
			{/* Left Sidebar: Sessions (desktop) */}
			{!leftCollapsed && isLgUp && (
				<aside
					aria-label="Sessions"
					className="col-span-2 xl:col-span-3 min-h-0 flex flex-col transition-all duration-300 ease-out"
				>
					<div className="glass-card h-full animate-fade-in overflow-hidden">
						<div className="h-full flex flex-col">
							<div className="flex-1 min-h-0 p-0">
								<div className="h-full overflow-y-auto scrollbar-custom p-0">
									<SessionList
										sessions={Array.from({ length: 12 }).map((_, i) => ({
											id: `s${i + 1}`,
											label: `Session ${i + 1}`,
										}))}
										onToggleCollapse={() => setLeftCollapsed(true)}
										isCollapsed={false}
									/>
								</div>
							</div>
						</div>
					</div>
				</aside>
			)}

			{/* Left Overlay (mobile/tablet) */}
			{!leftCollapsed && !isLgUp && (
				<div className="fixed inset-0 z-40">
					<button
						aria-label="Close sessions panel"
						className="absolute inset-0 bg-black/40"
						onClick={() => setLeftCollapsed(true)}
					/>
					<div className="absolute inset-y-0 left-0 w-[80vw] max-w-sm p-3 animate-slide-in-left">
						<div className="glass-card h-full overflow-hidden">
							<div className="h-full overflow-y-auto scrollbar-custom">
								<SessionList
									sessions={Array.from({ length: 12 }).map((_, i) => ({
										id: `s${i + 1}`,
										label: `Session ${i + 1}`,
									}))}
									onToggleCollapse={() => setLeftCollapsed(true)}
									isCollapsed={false}
								/>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Collapse handle (Left) */}
			{leftCollapsed && isLgUp && (
				<button
					aria-label="Expand sessions panel"
					title="Expand sessions (Ctrl/Cmd+B)"
					onClick={handleTempOpenLeft}
					className="fixed left-2 top-24 z-40 rounded-full bg-surface/90 border border-border backdrop-blur px-2 py-2 text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-all duration-200 shadow-soft"
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
			)}

			{/* Center: Chat Area */}
			<section
				aria-label="Conversation"
				className={`col-span-12 flex min-h-0 flex-col gap-4 ${centerLgCols} ${centerXlCols} transition-all duration-300 ease-out`}
			>
				{/* Chat messages area */}
				<div className="glass-card flex-1 animate-fade-in">
					<div className="h-full overflow-hidden p-4 md:p-6">
						<div className="scrollbar-custom h-full overflow-y-auto">{children}</div>
					</div>
				</div>
			</section>

			{/* Right Panel: Inspector (desktop) */}
			{!rightCollapsed && isLgUp && (
				<aside
					aria-label="Inspector"
					className="col-span-2 xl:col-span-3 min-h-0 flex flex-col transition-all duration-300 ease-out"
				>
					<div className="glass-card h-full animate-fade-in">
						<InspectorTabs onToggleCollapse={() => setRightCollapsed(true)} isCollapsed={false} />
					</div>
				</aside>
			)}

			{/* Right Overlay (mobile/tablet) */}
			{!rightCollapsed && !isLgUp && (
				<div className="fixed inset-0 z-40">
					<button
						aria-label="Close inspector panel"
						className="absolute inset-0 bg-black/40"
						onClick={() => setRightCollapsed(true)}
					/>
					<div className="absolute inset-y-0 right-0 w-[80vw] max-w-sm p-3 animate-slide-in-right">
						<div className="glass-card h-full">
							<InspectorTabs onToggleCollapse={() => setRightCollapsed(true)} isCollapsed={false} />
						</div>
					</div>
				</div>
			)}

			{/* Collapse handle (Right) */}
			{rightCollapsed && isLgUp && (
				<button
					aria-label="Expand inspector panel"
					title="Expand inspector (Ctrl/Cmd+B)"
					onClick={handleTempOpenRight}
					className="fixed right-2 top-24 z-40 rounded-full bg-surface/90 border border-border backdrop-blur px-2 py-2 text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-all duration-200 shadow-soft"
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>
			)}
		</main>
	);
}
