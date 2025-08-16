"use client"

import { RuneCard } from './RuneCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function HomePanel() {
  return (
    <div className="space-y-12">
      {/* Hero Section with Nordic Mysticism */}
      <section className="text-center py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-rune-frost/5 via-transparent to-rune-aurora/5 pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 text-rune-stone mb-4">
            <span className="text-2xl">ᚨᚱᚲᚨᚾᚢᛗ</span>
            <Badge variant="outline" className="border-rune-stone/30 text-rune-stone">
              Ancient Knowledge
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-rune-frost to-rune-ice bg-clip-text text-transparent mb-6">
            Welcome to Rune
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Harness the ancient art of AI orchestration. Weave together multiple providers into powerful automation sequences that bend digital reality to your will.
          </p>
          
          <div className="flex items-center justify-center space-x-4 pt-4">
            <div className="flex items-center space-x-2 text-sm text-rune-stone">
              <span className="w-2 h-2 bg-rune-frost rounded-full animate-pulse" />
              <span>AI Providers United</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center space-x-2 text-sm text-rune-stone">
              <span className="w-2 h-2 bg-rune-aurora rounded-full animate-pulse" />
              <span>Workflows Enchanted</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center space-x-2 text-sm text-rune-stone">
              <span className="w-2 h-2 bg-rune-ember rounded-full animate-pulse" />
              <span>Magic Awaits</span>
            </div>
          </div>
        </div>
      </section>

      {/* Rune Circles - Nordic Inspired Action Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Choose Your Path</h2>
          <p className="text-muted-foreground">Select a mystical discipline to begin your journey</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <RuneCard
            title="Cast a Rune"
            description="Channel existing spells and execute powerful workflows that have been crafted by masters"
            runeSymbol="ᚲ"
            href="/cast"
            variant="frost"
            level="novice"
          />
          <RuneCard
            title="Forge New Magic"
            description="Inscribe new runes into existence, weaving AI providers into novel automation sequences"
            runeSymbol="ᚠ"
            href="/create"
            variant="aurora"
            level="adept"
          />
          <RuneCard
            title="Sacred Runestone"
            description="Access your personal grimoire of spells, organized and ready for invocation"
            runeSymbol="ᚱ"
            href="/runestone"
            variant="ember"
            level="adept"
          />
          <RuneCard
            title="Mystic Marketplace"
            description="Discover ancient wisdom shared by fellow practitioners across the realms"
            runeSymbol="ᛗ"
            href="/marketplace"
            variant="void"
            level="master"
          />
        </div>
      </section>

      {/* Practitioner's Dashboard - Nordic Status Cards */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Practitioner's Chronicle</h2>
          <p className="text-muted-foreground">Your journey through the digital mystical arts</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-rune-frost/20 bg-gradient-to-br from-card to-rune-frost/5">
            <CardHeader className="text-center space-y-2">
              <div className="text-4xl text-rune-frost">ᚦ</div>
              <CardTitle className="text-rune-frost">Spells Cast</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-rune-frost mb-2">0</div>
              <CardDescription>Runes invoked this dawn</CardDescription>
              <Badge variant="outline" className="mt-2 border-rune-frost/30 text-rune-frost">
                Awaiting Power
              </Badge>
            </CardContent>
          </Card>
          
          <Card className="border-rune-aurora/20 bg-gradient-to-br from-card to-rune-aurora/5">
            <CardHeader className="text-center space-y-2">
              <div className="text-4xl text-rune-aurora">ᚹ</div>
              <CardTitle className="text-rune-aurora">Runes Crafted</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-rune-aurora mb-2">0</div>
              <CardDescription>Spells inscribed in stone</CardDescription>
              <Badge variant="outline" className="mt-2 border-rune-aurora/30 text-rune-aurora">
                Begin Creating
              </Badge>
            </CardContent>
          </Card>
          
          <Card className="border-rune-ember/20 bg-gradient-to-br from-card to-rune-ember/5">
            <CardHeader className="text-center space-y-2">
              <div className="text-4xl text-rune-ember">ᛟ</div>
              <CardTitle className="text-rune-ember">Mystical Energy</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-rune-ember mb-2">∞</div>
              <CardDescription>Credits flowing eternally</CardDescription>
              <Badge variant="outline" className="mt-2 border-rune-ember/30 text-rune-ember">
                Beta Blessing
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Ancient Wisdom Footer */}
      <section className="text-center py-8 border-t border-border/50">
        <p className="text-sm text-rune-stone italic">
          "ᚹᛁᛋᛞᛟᛗ ᚠᛚᛟᚹᛋ ᚦᚱᛟᚢᚷᚺ ᚦᛟᛋᛖ ᚹᚺᛟ ᛞᚨᚱᛖ ᛏᛟ ᚹᛖᚨᚢᛖ"
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          "Wisdom flows through those who dare to weave"
        </p>
      </section>
    </div>
  )
}