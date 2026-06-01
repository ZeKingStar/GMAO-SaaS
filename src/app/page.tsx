import { getAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Wrench,
  Cpu,
  ClipboardList,
  Calendar,
  Package,
  QrCode,
  Smartphone,
  CheckCircle2,
} from "lucide-react"

export default async function Home() {
  const { userId, orgId } = await getAuth()

  if (userId && orgId) {
    redirect("/dashboard")
  }

  if (userId && !orgId) {
    redirect("/onboarding")
  }

  // !userId → afficher la landing page
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wrench className="size-4" />
            </span>
            <span className="text-lg font-bold">GMAO</span>
          </Link>

          {/* Nav actions */}
          <nav className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Commencer gratuitement
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          {/* Badge */}
          <span className="mb-6 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            Nouveau · Gestion de maintenance moderne
          </span>

          {/* H1 */}
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            La GMAO moderne pour les{" "}
            <span className="text-primary">PME québécoises</span>
          </h1>

          {/* Sous-titre */}
          <p className="mb-10 text-lg text-muted-foreground">
            Gérez vos actifs, planifiez la maintenance et coordonnez vos équipes
            — en français, conçu pour le marché québécois.
          </p>

          {/* CTAs */}
          <div className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Commencer gratuitement →
            </Link>
            <Link
              href="#demo"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-base font-medium transition-colors hover:bg-muted"
            >
              Voir une démo
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-6">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" />
              Essai gratuit 14 jours
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" />
              Sans carte de crédit
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" />
              Support en français
            </span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Tout ce dont vous avez besoin
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                icon: Cpu,
                title: "Gestion des actifs",
                desc: "Centralisez tous vos équipements avec suivi QR et historique complet.",
              },
              {
                icon: ClipboardList,
                title: "Bons de travail",
                desc: "Créez, assignez et suivez les interventions en temps réel.",
              },
              {
                icon: Calendar,
                title: "Maintenance préventive",
                desc: "Planifiez automatiquement les maintenances récurrentes.",
              },
              {
                icon: Package,
                title: "Inventaire",
                desc: "Gérez vos pièces de rechange et recevez des alertes de stock faible.",
              },
              {
                icon: QrCode,
                title: "Codes QR",
                desc: "Scannez un actif pour accéder instantanément à son historique.",
              },
              {
                icon: Smartphone,
                title: "Application mobile",
                desc: "Interface PWA installable sur iOS et Android, fonctionne hors-ligne.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold">
              Tarification simple et transparente
            </h2>
            <p className="text-muted-foreground">
              Facturation par organisation, pas par utilisateur. Changez de plan
              à tout moment.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Démarrage */}
            <div className="rounded-xl border bg-card p-8 ring-1 ring-border shadow-sm">
              <h3 className="mb-1 text-lg font-semibold">Démarrage</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Jusqu&apos;à 5 utilisateurs
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">59 $</span>
                <span className="text-muted-foreground"> CAD/mois</span>
              </div>
              <ul className="mb-8 space-y-2 text-sm text-muted-foreground">
                {[
                  "Actifs illimités",
                  "BTs illimités",
                  "Maintenance préventive",
                  "QR codes",
                  "Support courriel",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted"
              >
                Commencer
              </Link>
            </div>

            {/* Croissance — mis en avant */}
            <div className="relative rounded-xl border bg-card p-8 ring-2 ring-primary shadow-md">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Populaire
              </span>
              <h3 className="mb-1 text-lg font-semibold">Croissance</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Jusqu&apos;à 15 utilisateurs
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">149 $</span>
                <span className="text-muted-foreground"> CAD/mois</span>
              </div>
              <ul className="mb-8 space-y-2 text-sm text-muted-foreground">
                {[
                  "Tout Démarrage",
                  "Rapports avancés",
                  "Inventaire pièces",
                  "API accès",
                  "Support prioritaire",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Commencer
              </Link>
            </div>

            {/* Entreprise */}
            <div className="rounded-xl border bg-card p-8 ring-1 ring-border shadow-sm">
              <h3 className="mb-1 text-lg font-semibold">Entreprise</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Utilisateurs illimités
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">349 $</span>
                <span className="text-muted-foreground"> CAD/mois</span>
              </div>
              <ul className="mb-8 space-y-2 text-sm text-muted-foreground">
                {[
                  "Tout Croissance",
                  "SSO",
                  "Audit log",
                  "SLA garanti",
                  "Support dédié",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted"
              >
                Commencer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="bg-primary py-16 text-center text-primary-foreground">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-4 text-3xl font-bold">
            Prêt à moderniser votre maintenance?
          </h2>
          <p className="mb-8 text-primary-foreground/80">
            Rejoignez les entreprises québécoises qui ont déjà fait confiance à
            GMAO.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-background px-6 text-base font-medium text-foreground transition-colors hover:bg-background/90"
          >
            Commencer gratuitement →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-3">© 2025 GMAO SaaS — Fait au Québec 🍁</p>
          <nav className="flex items-center justify-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">
              Confidentialité
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Conditions
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Support
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
