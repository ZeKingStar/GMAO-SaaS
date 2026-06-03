"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { Building2, ChevronDown, LogOut, Check } from "lucide-react"
import { authClient } from "@/lib/better-auth-client"
import { switchOrganization } from "@/actions/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
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
  return "GMAO"
}

function initials(name: string | null | undefined): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

type Org = { id: string; name: string }
type User = { id: string; name: string; email: string; image?: string | null }

interface Props {
  user: User | null
  currentOrg: Org | null
  orgs: Org[]
}

export function HeaderClient({ user, currentOrg, orgs }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  function handleSwitchOrg(orgId: string) {
    startTransition(async () => {
      await switchOrganization(orgId)
      router.refresh()
    })
  }

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <SidebarSheet />
        <h1 className="font-semibold text-sm hidden sm:block">
          {getTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Org Switcher */}
        {orgs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-md hover:bg-muted transition-colors outline-none">
              <Building2 className="size-4 text-muted-foreground shrink-0" />
              <span className="max-w-[140px] truncate font-medium">
                {currentOrg?.name ?? "Organisation"}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Vos organisations
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {orgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSwitchOrg(org.id)}
                  disabled={pending}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{org.name}</span>
                  {org.id === currentOrg?.id && (
                    <Check className="size-3.5 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/onboarding")}>
                <span className="text-muted-foreground">+ Nouvelle organisation</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none rounded-full">
            <Avatar size="sm">
              {user?.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback>{initials(user?.name)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2">
              <p className="text-sm font-medium truncate">{user?.name ?? "Utilisateur"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="size-4 mr-2" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
