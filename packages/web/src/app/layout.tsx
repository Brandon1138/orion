import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { InspectorTabs } from '@/components/InspectorTabs';
import { SessionList } from '@/components/SessionList';
import { ChatProvider } from '@/lib/chat-context';

export const metadata: Metadata = {
	title: 'Orion Chat',
	description: 'Chat UI for the Orion agent',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-neutral-100 text-neutral-900 antialiased dark:bg-neutral-900 dark:text-neutral-100">
				<div className="flex h-screen flex-col">
					<a
						href="#mainContent"
						className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-neutral-900 focus:px-3 focus:py-2 focus:text-white"
					>
						Skip to content
					</a>
					<header
						className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70"
						role="banner"
					>
						<div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
							<div className="flex items-center gap-3">
								<div className="h-6 w-6 rounded bg-brand-600"></div>
								<span className="text-sm font-semibold tracking-wide text-neutral-700 dark:text-neutral-200">
									Orion
								</span>
							</div>
							<nav
								aria-label="Primary"
								className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300"
							>
								<Link
									className="rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
									href="/"
								>
									Chat
								</Link>
							</nav>
						</div>
					</header>
					<ChatProvider>
						<main
							id="mainContent"
							role="main"
							className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-12 gap-4 px-4 py-4"
						>
							{/* Left: Sessions */}
							<aside
								aria-label="Sessions"
								className="col-span-3 hidden min-h-0 flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 lg:flex"
							>
								<SessionList
									sessions={Array.from({ length: 12 }).map((_, i) => ({
										id: `s${i + 1}`,
										label: `Session ${i + 1}`,
									}))}
								/>
							</aside>

							{/* Center: Chat */}
							<section
								aria-label="Conversation"
								className="col-span-12 flex min-h-0 flex-col gap-3 lg:col-span-6"
							>
								<div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
									<div>
										<h1 className="text-base font-semibold tracking-tight">Orion Chat</h1>
										<p className="text-xs text-neutral-600 dark:text-neutral-400">Welcome back</p>
									</div>
								</div>
								<div className="scrollbar-thin scrollbar-thumb-rounded flex-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
									{children}
								</div>
							</section>

							{/* Right: Inspector */}
							<aside
								aria-label="Inspector"
								className="col-span-3 hidden min-h-0 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950 lg:block"
							>
								<InspectorTabs />
							</aside>
						</main>
					</ChatProvider>
				</div>
			</body>
		</html>
	);
}
