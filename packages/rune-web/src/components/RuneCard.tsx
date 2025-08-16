"use client"

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface RuneCardProps {
  title: string
  description: string
  runeSymbol: string
  href: string
  variant: 'frost' | 'aurora' | 'ember' | 'void'
  level?: 'novice' | 'adept' | 'master'
  className?: string
}

const variantStyles = {
  frost: {
    card: 'border-rune-frost/20 hover:border-rune-frost/40 bg-gradient-to-br from-card to-rune-frost/5',
    glow: 'hover:rune-frost-glow',
    badge: 'bg-rune-frost/10 text-rune-frost border-rune-frost/20',
    symbol: 'text-rune-frost',
    button: 'border-rune-frost/20 hover:border-rune-frost hover:bg-rune-frost/10'
  },
  aurora: {
    card: 'border-rune-aurora/20 hover:border-rune-aurora/40 bg-gradient-to-br from-card to-rune-aurora/5',
    glow: 'hover:rune-aurora-glow',
    badge: 'bg-rune-aurora/10 text-rune-aurora border-rune-aurora/20',
    symbol: 'text-rune-aurora',
    button: 'border-rune-aurora/20 hover:border-rune-aurora hover:bg-rune-aurora/10'
  },
  ember: {
    card: 'border-rune-ember/20 hover:border-rune-ember/40 bg-gradient-to-br from-card to-rune-ember/5',
    glow: 'hover:rune-ember-glow',
    badge: 'bg-rune-ember/10 text-rune-ember border-rune-ember/20',
    symbol: 'text-rune-ember',
    button: 'border-rune-ember/20 hover:border-rune-ember hover:bg-rune-ember/10'
  },
  void: {
    card: 'border-rune-void/20 hover:border-rune-void/40 bg-gradient-to-br from-card to-rune-void/5',
    glow: 'hover:shadow-lg hover:shadow-rune-void/20',
    badge: 'bg-rune-void/10 text-rune-void border-rune-void/20',
    symbol: 'text-rune-void',
    button: 'border-rune-void/20 hover:border-rune-void hover:bg-rune-void/10'
  }
}

const levelStyles = {
  novice: 'border-rune-stone/30',
  adept: 'border-rune-ice/30',
  master: 'border-rune-frost/30'
}

const levelLabels = {
  novice: 'Novice',
  adept: 'Adept', 
  master: 'Master'
}

export function RuneCard({ 
  title, 
  description, 
  runeSymbol, 
  href, 
  variant, 
  level = 'novice',
  className 
}: RuneCardProps) {
  const styles = variantStyles[variant]
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={cn(
            'relative overflow-hidden transition-all duration-300 cursor-pointer group',
            styles.card,
            styles.glow,
            'transform hover:scale-[1.02]',
            className
          )}>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto">
                <div className="relative">
                  <div className={cn(
                    'text-6xl font-bold transition-all duration-300 group-hover:scale-110',
                    styles.symbol
                  )}>
                    {runeSymbol}
                  </div>
                  <div className="absolute inset-0 blur-xl opacity-30 group-hover:opacity-50 transition-opacity">
                    <div className={cn('text-6xl font-bold', styles.symbol)}>
                      {runeSymbol}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {title}
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'transition-all duration-300',
                    styles.badge,
                    levelStyles[level]
                  )}
                >
                  {levelLabels[level]}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <CardDescription className="text-muted-foreground leading-relaxed">
                {description}
              </CardDescription>
              
              <Button 
                variant="outline" 
                className={cn(
                  'w-full transition-all duration-300 group-hover:shadow-md',
                  styles.button
                )}
                asChild
              >
                <Link href={href}>
                  Begin Ritual
                </Link>
              </Button>
            </CardContent>
            
            {/* Mystical background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-4 left-4 w-16 h-16 border border-current rounded-full" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border border-current rounded-full" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-current rotate-45" />
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to begin your {title.toLowerCase()} journey</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}