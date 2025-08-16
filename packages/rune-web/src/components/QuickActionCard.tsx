import Link from 'next/link'

interface QuickActionCardProps {
  title: string
  description: string
  icon: string
  href: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}

const colorVariants = {
  blue: 'border-blue-800 hover:border-blue-600 hover:bg-blue-950/50',
  green: 'border-green-800 hover:border-green-600 hover:bg-green-950/50',
  purple: 'border-purple-800 hover:border-purple-600 hover:bg-purple-950/50',
  orange: 'border-orange-800 hover:border-orange-600 hover:bg-orange-950/50',
}

const iconColorVariants = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400',
}

export function QuickActionCard({ title, description, icon, href, color }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <div className={`
        bg-slate-800 rounded-lg border-2 p-6 transition-all duration-200 cursor-pointer
        ${colorVariants[color]}
      `}>
        <div className="text-center">
          <div className={`text-4xl mb-3 ${iconColorVariants[color]}`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </Link>
  )
}