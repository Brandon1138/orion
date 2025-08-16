import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
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
									<span className="text-lg font-bold gradient-text">Orion</span>
									<span className="text-xs text-foreground-muted leading-none">AI Assistant</span>
								</div>
							</div>

							{/* Status indicator and navigation */}
							<nav aria-label="Primary" className="flex items-center gap-4">
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
						<AppShell>{children}</AppShell>
					</ChatProvider>
				</div>
			</body>
		</html>
	);
}
