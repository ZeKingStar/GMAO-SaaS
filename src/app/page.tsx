import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Cpu,
  ClipboardList,
  Calendar,
  Package,
  QrCode,
  Smartphone,
  CheckCircle2,
} from "lucide-react"
import { KorviaLogo } from "@/components/brand/korvia-logo"

export default async function Home() {
  const { userId, orgId } = await auth()

  if (userId && orgId) {
    redirect("/dashboard")
  }

  if (userId && !orgId) {
    redirect("/onboarding")
  }

  // !userId → afficher la landing page (forcer thème sombre Korvia local à cette page)
  return (
    <div className="dark min-h-screen bg-background text-foreground font-sans">
      {/* ── Navbar ── fond navy plein, pas de backdrop-blur */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center transition-opacity hover:opacity-85" aria-label="Korvia — Accueil">
            <KorviaLogo variant="white" size={32} showWordmark />
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-normal text-muted-foreground transition-colors hover:text-foreground"
            >
              Se connecter
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-[#C97009] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Démarrer
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-[#0F1C2E] to-[#0D1824] py-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <span className="mb-6 inline-block rounded-full border border-[rgba(232,131,12,0.3)] bg-[rgba(232,131,12,0.15)] px-3 py-1 text-sm font-normal text-primary">
            Nouveau · Gestion de maintenance moderne
          </span>

          <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-[48px]">
            La GMAO moderne pour les{" "}
            <span className="text-primary">PME québécoises</span>
          </h1>

          <p className="mb-10 text-base font-normal leading-[1.5] text-muted-foreground sm:text-lg">
            Gérez vos actifs, planifiez la maintenance et coordonnez vos équipes
            — en français, conçu pour le marché québécois.
          </p>

          <div className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-base font-bold text-primary-foreground transition-colors hover:bg-[#C97009] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="#demo"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.2)] bg-transparent px-6 text-base font-normal text-foreground transition-colors hover:bg-[rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Voir une démo
            </Link>
          </div>

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
      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center font-heading text-[28px] font-bold leading-[1.2] text-foreground">
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
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[rgba(232,131,12,0.12)]">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="mb-2 font-heading text-base font-bold text-card-foreground">{title}</h3>
                <p className="text-sm font-normal leading-[1.5] text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-heading text-[28px] font-bold leading-[1.2] text-foreground">
              Tarification simple et transparente
            </h2>
            <p className="text-base font-normal text-muted-foreground">
              Facturation par organisation, pas par utilisateur. Changez de plan
              à tout moment.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Démarrage */}
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="mb-1 font-heading text-lg font-bold text-card-foreground">Démarrage</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Jusqu&apos;à 5 utilisateurs
              </p>
              <div className="mb-6">
                <span className="font-heading text-4xl font-bold text-card-foreground">59 $</span>
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
                className="block w-full rounded-lg border border-[rgba(255,255,255,0.2)] py-2.5 text-center text-sm font-bold text-foreground transition-colors hover:bg-[rgba(255,255,255,0.08)]"
              >
                Commencer
              </Link>
            </div>

            {/* Croissance — mis en avant avec accent ambre */}
            <div className="relative rounded-xl border border-primary bg-card p-8 ring-2 ring-primary">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                Populaire
              </span>
              <h3 className="mb-1 font-heading text-lg font-bold text-card-foreground">Croissance</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Jusqu&apos;à 15 utilisateurs
              </p>
              <div className="mb-6">
                <span className="font-heading text-4xl font-bold text-card-foreground">149 $</span>
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
                className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground transition-colors hover:bg-[#C97009]"
              >
                Commencer
              </Link>
            </div>

            {/* Entreprise */}
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="mb-1 font-heading text-lg font-bold text-card-foreground">Entreprise</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Utilisateurs illimités
              </p>
              <div className="mb-6">
                <span className="font-heading text-4xl font-bold text-card-foreground">349 $</span>
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
                className="block w-full rounded-lg border border-[rgba(255,255,255,0.2)] py-2.5 text-center text-sm font-bold text-foreground transition-colors hover:bg-[rgba(255,255,255,0.08)]"
              >
                Commencer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── fond secondary (#162136), pas full ambre */}
      <section className="bg-secondary py-16 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-4 font-heading text-[28px] font-bold leading-[1.2] text-foreground">
            Prêt à moderniser votre maintenance?
          </h2>
          <p className="mb-8 text-base font-normal text-muted-foreground">
            Rejoignez les entreprises québécoises qui ont choisi Korvia.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-base font-bold text-primary-foreground transition-colors hover:bg-[#C97009] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Commencer gratuitement
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-background py-8 text-center text-sm font-normal text-muted-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-3">© 2026 Korvia — Fait au Québec 🍁</p>
          <nav className="flex items-center justify-center gap-6">
            <a href="#" className="transition-colors hover:text-foreground">
              Confidentialité
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Conditions
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Support
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
