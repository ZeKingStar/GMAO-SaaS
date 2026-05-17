'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/actifs', label: 'Actifs', exact: true },
  { href: '/actifs/sites', label: 'Sites & Localisations' },
  { href: '/actifs/categories', label: 'Catégories' },
]

export default function ActifsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Actifs</h2>
        <p className="text-muted-foreground text-sm">
          Gérez vos équipements, sites et catégories
        </p>
      </div>

      <div className="border-b">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {children}
    </div>
  )
}
