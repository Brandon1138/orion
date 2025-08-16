import { QuickActionCard } from './QuickActionCard'

export function HomePanel() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-slate-100 mb-4">
          Welcome to Rune
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Create, share, and execute AI workflows that orchestrate multiple providers into powerful automation sequences.
        </p>
      </section>

      {/* Quick Actions Grid */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-100 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            title="Cast a Rune"
            description="Execute existing workflows"
            icon="⚡"
            href="/cast"
            color="blue"
          />
          <QuickActionCard
            title="Create a Rune"
            description="Build new workflows"
            icon="✨"
            href="/create"
            color="green"
          />
          <QuickActionCard
            title="Runestone"
            description="Your spellbook of runes"
            icon="📜"
            href="/runestone"
            color="purple"
          />
          <QuickActionCard
            title="Browse Runes"
            description="Discover marketplace"
            icon="🔍"
            href="/marketplace"
            color="orange"
          />
        </div>
      </section>

      {/* Status Dashboard */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-100 mb-6">Dashboard</h2>
        <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">0</div>
              <div className="text-sm text-slate-400">Runes Cast Today</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">0</div>
              <div className="text-sm text-slate-400">Runes Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">∞</div>
              <div className="text-sm text-slate-400">Credits Remaining</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}