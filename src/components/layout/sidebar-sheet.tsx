"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, LayoutDashboard, ClipboardList, Cpu, Calendar, Package, BarChart2, Settings, Lock } from "lucide-react"
import { KorviaLogo } from "@/components/brand/korvia-logo"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/bons-de-travail", label: "Bons de travail", icon: ClipboardList },
  { href: "/actifs", label: "Actifs", icon: Cpu },
  { href: "/maintenance", label: "Maintenance préventive", icon: Calendar },
  { href: "/inventaire", label: "Inventaire", icon: Package },
  { href: "/rapports", label: "Rapports", icon: BarChart2 },
  { href: "/parametres/organisation", label: "Paramètres", icon: Settings },
]

const GATED_HREFS = new Set(['/inventaire', '/rapports'])

interface SidebarSheetProps {
  userPlan?: 'starter' | 'growth' | 'enterprise'
}

export function SidebarSheet({ userPlan = 'starter' }: SidebarSheetProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex items-center px-6 py-5 border-b text-sidebar-foreground">
          <KorviaLogo variant="color" size={32} showWordmark />
        </div>
        <nav className="py-4 px-3">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === href || pathname.startsWith(href + "/")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  {GATED_HREFS.has(href) && userPlan === 'starter' && (
                    <Lock
                      className="h-3 w-3 ml-auto text-muted-foreground/60"
                      aria-label="Fonctionnalité verrouillée"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
