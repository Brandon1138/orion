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
			<body className="min-h-screen bg-background text-foreground antialiased">
				<div className="flex h-screen flex-col">
					{/* Skip to content link for accessibility */}
					<a
						href="#mainContent"
						className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-foreground focus:shadow-floating focus-ring"
					>
						Skip to content
					</a>
					
					{/* Modern header with glassmorphism */}
					<header
						className="sticky top-0 z-50 glass-panel border-b border-border-elevated"
						role="banner"
					>
						<div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
							<div className="flex items-center gap-3">
								{/* Modern logo with gradient */}
								<div className="relative">
									<div className="h-8 w-8 rounded-lg gradient-primary shadow-glow"></div>
									<div className="absolute inset-0 h-8 w-8 rounded-lg bg-white/10 backdrop-blur-sm"></div>
								</div>
								<div className="flex flex-col">
									<span className="text-lg font-bold gradient-text">
										Orion
									</span>
									<span className="text-xs text-foreground-muted leading-none">
										AI Assistant
									</span>
								</div>
							</div>
							
							{/* Status indicator and navigation */}
							<nav
								aria-label="Primary"
								className="flex items-center gap-4"
							>
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
									<span className="text-sm text-foreground-secondary">Online</span>
								</div>
								<Link
									className="interactive rounded-lg px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-surface-elevated focus-ring"
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
							className="mx-auto grid w-full max-w-full flex-1 grid-cols-12 gap-4 px-4 py-4 xl:max-w-[1920px] xl:px-6 xl:py-6"
						>
							{/* Left Sidebar: Sessions */}
							<aside
								aria-label="Sessions"
								className="col-span-2 hidden min-h-0 flex-col lg:flex xl:col-span-3"
							>
								<div className="glass-card h-full animate-fade-in">
									<SessionList
										sessions={Array.from({ length: 12 }).map((_, i) => ({
											id: `s${i + 1}`,
											label: `Session ${i + 1}`,
										}))}
									/>
								</div>
							</aside>

							{/* Center: Chat Area */}
							<section
								aria-label="Conversation"
								className="col-span-12 flex min-h-0 flex-col gap-4 lg:col-span-8 xl:col-span-6"
							>
								{/* Chat header */}
								<div className="glass-card animate-fade-in">
									<div className="p-6">
										<div className="flex items-center justify-between">
											<div>
												<h1 className="text-xl font-bold text-foreground">
													Daily Planning Session
												</h1>
												<p className="text-sm text-foreground-muted">
													Ready to help you organize your day
												</p>
											</div>
											<div className="rounded-full bg-surface-elevated p-3">
												<div className="h-6 w-6 rounded-full gradient-primary"></div>
											</div>
										</div>
									</div>
								</div>
								
								{/* Chat messages area */}
								<div className="glass-card flex-1 animate-fade-in">
									<div className="h-full overflow-hidden p-4 md:p-6">
										<div className="scrollbar-custom h-full overflow-y-auto">
											{children}
										</div>
									</div>
								</div>
							</section>

							{/* Right Panel: Inspector */}
							<aside
								aria-label="Inspector"
								className="col-span-2 hidden min-h-0 lg:block xl:col-span-3"
							>
								<div className="glass-card h-full animate-fade-in">
									<InspectorTabs />
								</div>
							</aside>
						</main>
					</ChatProvider>
				</div>
			</body>
		</html>
	);
}
