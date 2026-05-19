---
phase: 01-identit-korvia
plan: "03"
subsystem: ui
tags: [landing-page, dark-theme, korvia-brand, tailwind-v4, next-js, korvia-logo]

dependency_graph:
  requires:
    - phase: 01-01
      provides: "KorviaLogo composant (variant white/color/dark) + tokens CSS .dark (navy + ambre)"
  provides:
    - src/app/page.tsx (landing Korvia dark navy + accents ambre + KorviaLogo navbar + copy contractuelle)
  affects:
    - Plan 01-02 (sidebar/header — mêmes composants de layout, thème clair non affecté)

tech-stack:
  added: []
  patterns:
    - "Isolation du thème sombre par wrapper <div className='dark'> sur la landing uniquement"
    - "Hover ambre hardcodé #C97009 (assombri 15%) pour les CTA primaires"
    - "focus-visible ring ambre pour l'accessibilité WCAG sur tous les CTA"
    - "bg-transparent + border rgba(255,255,255,0.2) pour les CTA outline sur fond sombre"

key-files:
  created: []
  modified:
    - src/app/page.tsx

key-decisions:
  - "Wrapper <div className='dark'> isole le thème sombre à la landing — l'app authentifiée reste en :root clair"
  - "CTA final section bg-secondary (#162136) et non fond ambre plein — conforme UI-SPEC (ambre réservé aux petits accents)"
  - "hover:opacity-85 sur le logo KorviaLogo — comportement UI-SPEC pour les éléments de navigation"

requirements-completed:
  - BRAND-01
  - BRAND-02
  - BRAND-03

duration: ~5min
completed: 2026-05-19
---

# Phase 01 Plan 03: Landing Page Korvia Dark Navy

**Landing page intégralement refondue en thème dark Korvia (navy #0F1C2E + accents ambre #E8830C) avec KorviaLogo variant white dans la navbar, copy contractuelle UI-SPEC au caractère près, et isolation du thème via wrapper `<div className="dark">`.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-19T21:14:00Z
- **Completed:** 2026-05-19T21:19:02Z
- **Tasks:** 1 complete / 2 total (Task 2 = checkpoint humain — en attente)
- **Files modified:** 1

## Accomplishments

- `src/app/page.tsx` intégralement réécrit : suppression du placeholder "GMAO SaaS", intégration de KorviaLogo (variant white), passage au thème dark Korvia via wrapper `<div className="dark">`
- Copy contractuelle 100% conforme UI-SPEC : badge "Nouveau · Gestion de maintenance moderne", H1 "La GMAO moderne pour les PME québécoises", CTA "Commencer gratuitement" / "Démarrer" / "Voir une démo", footer "© 2026 Korvia — Fait au Québec 🍁"
- Palette ambre strictement aux emplacements autorisés : badge pill, CTA primaires, ring card Croissance, badge "Populaire", CheckCircle2, icônes feature cards, span H1 "PME québécoises"
- CTA final section `bg-secondary` (#162136 en mode dark) — UI-SPEC interdit l'ambre comme grand fond plein
- TypeScript propre : `npx tsc --noEmit` — 0 erreur

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refondre src/app/page.tsx en landing Korvia dark navy | bc88a17 | src/app/page.tsx |
| 2 | Validation visuelle humaine de la landing | — | checkpoint en attente |

## Files Created/Modified

- `src/app/page.tsx` — Landing page refondue: wrapper dark, KorviaLogo navbar, sections Hero/Features/Pricing/CTA/Footer avec palette Korvia

## Avant/Après

### Navbar
- **Avant:** Logo placeholder (Wrench icon + texte "GMAO"), fond `bg-background/95 backdrop-blur`, CTA "Commencer gratuitement"
- **Après:** `<KorviaLogo variant="white" size={32} showWordmark />`, fond `bg-background` plein (navy via .dark, pas de blur), CTA "Démarrer" (ambre #E8830C)

### Hero
- **Avant:** Badge `bg-primary/10` (sans bordure), H1 générique sans font-heading, CTA "Commencer gratuitement →" (avec flèche), fond default
- **Après:** Badge pill avec `border border-[rgba(232,131,12,0.3)] bg-[rgba(232,131,12,0.15)]`, H1 `font-heading text-4xl font-bold leading-[1.15]`, CTA sans flèche (conforme copy contractuelle), gradient `from-[#0F1C2E] to-[#0D1824]`

### Features Section
- **Avant:** `bg-muted/50`, icônes `bg-primary/10`, h3 `font-semibold` sans font-heading
- **Après:** `bg-background` (navy via .dark = #0F1C2E), icônes `bg-[rgba(232,131,12,0.12)]`, h3 `font-heading font-bold`

### Pricing
- **Avant:** Cards avec `ring-1 ring-border shadow-sm`, CTA Démarrage/Entreprise `hover:bg-muted`
- **Après:** Cards avec `border-border` seulement, CTA outline avec `border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.08)]`

### CTA Final Section
- **Avant:** `bg-primary py-16 text-center text-primary-foreground` (fond ambre plein — interdit par UI-SPEC), texte "ont déjà fait confiance à GMAO"
- **Après:** `bg-secondary py-16 text-center` (fond #162136 via .dark), texte "Rejoignez les entreprises québécoises qui ont choisi Korvia."

### Footer
- **Avant:** "© 2025 GMAO SaaS — Fait au Québec 🍁"
- **Après:** "© 2026 Korvia — Fait au Québec 🍁"

## Inventaire final des occurrences "GMAO"

Occurrences dans `src/app/page.tsx` : **1** (autorisée — terme catégorie SEO dans le H1)

```
src/app/page.tsx:61: La GMAO moderne pour les{" "}
```

Occurrences dans d'autres fichiers `src/` (hors scope Plan 03 — Plan 03 ne modifie que page.tsx) :
- `src/app/layout.tsx` : title/metadata (Plan 01-02 devra mettre à jour)
- `src/app/manifest.ts` : PWA manifest (Plan 01-02)
- `src/components/layout/header.tsx` : "GMAO" dans getPageTitle (Plan 01-02)
- `src/components/layout/sidebar.tsx` : wordmark sidebar (Plan 01-02)
- `src/components/layout/sidebar-sheet.tsx` : wordmark sidebar mobile (Plan 01-02)
- `src/(auth)/onboarding/page.tsx` : "Bienvenue dans votre GMAO" (Plan 01-02)

Note : Ces occurrences sont dans le scope de Plan 01-02 (rebrand composants app authentifiée). Plan 03 ne couvre que `src/app/page.tsx`.

## Confirmation isolation thème .dark

Le wrapper `<div className="dark">` est local au composant `Home` — il n'affecte que le sous-arbre JSX de la landing page. L'app authentifiée (dashboard, actifs, BTs, etc.) continue d'utiliser les tokens `:root` clairs (`bg-background` → #F5F6F8, sidebar navy). Aucun risque de régression sur l'app.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Wrapper `<div className="dark">` (pas de thème global) | L'app authentifiée reste en mode clair — shadcn + tokens :root intacts |
| `bg-secondary` pour section CTA final (pas ambre plein) | UI-SPEC interdit l'ambre comme grand fond plein — `#162136` donne du contraste sans violer la règle |
| Hover `#C97009` hardcodé (pas `hover:bg-primary/90`) | oklch() + opacity ne donne pas le même résultat que l'assombrissement de 15% spécifié UI-SPEC |

## Deviations from Plan

None — Task 1 exécutée exactement comme spécifiée. Le code JSX livré correspond au code du plan au caractère près (hors reformatage automatique).

Note : Les occurrences GMAO résiduelles dans d'autres fichiers (header, sidebar, layout, manifest, onboarding) sont PRÉ-EXISTANTES et hors scope Plan 03. Elles sont dans le scope de Plan 01-02. Déposées dans le déferred log ci-dessous pour traçabilité.

## Known Stubs

None — la landing page est complète. Tous les liens (sign-in, sign-up, #demo, Confidentialité, Conditions, Support) sont présents. Le lien `#demo` pointe vers une ancre sur la même page — section démo non encore construite (future fonctionnalité, intentionnellement stub car hors scope Phase 01).

## Threat Flags

None — modification purement statique (JSX / CSS). Aucun nouveau endpoint réseau, aucune surface d'authentification, aucun accès fichier dynamique.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/app/page.tsx exists | FOUND |
| Import KorviaLogo dans page.tsx | FOUND |
| className="dark" wrapper | FOUND |
| variant="white" dans navbar | FOUND |
| "Commencer gratuitement" dans page.tsx | FOUND |
| "© 2026 Korvia — Fait au Québec" dans page.tsx | FOUND |
| "GMAO SaaS" absent | CONFIRMED ABSENT |
| "© 2025" absent | CONFIRMED ABSENT |
| GMAO count = 1 dans page.tsx | CONFIRMED (1 occurrence) |
| font-heading présent | FOUND |
| #C97009 hover color présent | FOUND |
| TypeScript propre (tsc --noEmit) | PASSED — 0 erreur |
| Commit bc88a17 | FOUND |
| Checkpoint Task 2 | EN ATTENTE validation humaine |
