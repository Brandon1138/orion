import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rune - AI Orchestration Platform',
  description: 'Create, share, and execute AI workflows with Nordic-inspired magic',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen`}>
        <div className="min-h-screen bg-background">
          <header className="bg-card shadow-sm border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-rune-frost to-rune-ice rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-background">ᚱ</span>
                  </div>
                  <h1 className="text-xl font-bold text-foreground">Rune</h1>
                  <span className="text-xs text-rune-stone bg-muted px-2 py-1 rounded-full">
                    Ancient Wisdom
                  </span>
                </div>
                <nav className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    Beta
                  </span>
                </nav>
              </div>
            </div>
          </header>
          <main className="relative">{children}</main>
        </div>
      </body>
    </html>
  )
}