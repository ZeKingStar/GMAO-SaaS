"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  Cpu,
  Calendar,
  Package,
  BarChart2,
  Settings,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/bons-de-travail", label: "Bons de travail", icon: ClipboardList },
  { href: "/actifs", label: "Actifs", icon: Cpu },
  { href: "/maintenance", label: "Maintenance préventive", icon: Calendar },
  { href: "/inventaire", label: "Inventaire", icon: Package },
  { href: "/rapports", label: "Rapports", icon: BarChart2 },
]

const bottomItems = [
  { href: "/parametres/organisation", label: "Paramètres", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground">
          <Wrench className="h-4 w-4" />
        </div>
        <span className="font-bold text-lg tracking-tight">GMAO</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t">
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
