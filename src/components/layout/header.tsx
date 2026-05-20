"use client"

import { usePathname } from "next/navigation"
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs"
import { SidebarSheet } from "./sidebar-sheet"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/bons-de-travail": "Bons de travail",
  "/actifs": "Actifs",
  "/maintenance": "Maintenance préventive",
  "/inventaire": "Inventaire",
  "/rapports": "Rapports",
  "/parametres/organisation": "Paramètres — Organisation",
  "/parametres/utilisateurs": "Paramètres — Utilisateurs",
  "/parametres/facturation": "Paramètres — Facturation",
}

function getTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title
  }
  return "Korvia"
}

interface HeaderProps {
  userPlan?: 'starter' | 'growth' | 'enterprise'
}

export function Header({ userPlan = 'starter' }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <SidebarSheet userPlan={userPlan} />
        <h1 className="font-semibold text-sm hidden sm:block">
          {getTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl="/onboarding"
          afterSelectOrganizationUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "text-sm",
              organizationSwitcherTrigger: "py-1.5 px-2 rounded-md hover:bg-muted",
            },
          }}
        />
        <UserButton />
      </div>
    </header>
  )
}
