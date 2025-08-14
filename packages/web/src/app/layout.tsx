import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Orion Chat',
	description: 'Chat UI for the Orion agent',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-neutral-100 text-neutral-900 antialiased dark:bg-neutral-900 dark:text-neutral-100">
				{children}
			</body>
		</html>
	);
}
