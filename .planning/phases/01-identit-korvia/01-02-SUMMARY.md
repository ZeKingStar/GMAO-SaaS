---
phase: 01-identit-korvia
plan: "02"
subsystem: brand/app-shell
tags: [rebrand, layout, sidebar, pwa, korvia, inter, fonts]
dependency_graph:
  requires:
    - 01-01 (KorviaLogo component, CSS tokens)
  provides:
    - src/app/layout.tsx (Inter + Geist chargés, metadata Korvia, themeColor navy)
    - src/components/layout/sidebar.tsx (KorviaLogo color variant)
    - src/components/layout/sidebar-sheet.tsx (KorviaLogo color variant mobile)
    - src/components/layout/header.tsx (fallback titre "Korvia")
    - src/app/(auth)/onboarding/page.tsx (Bienvenue dans Korvia)
    - src/app/manifest.ts (PWA manifest Korvia)
  affects:
    - Plan 03 (landing page verra Inter disponible via --font-inter)
    - Tous utilisateurs de l'app authentifiée (sidebar, header, onboarding)
tech_stack:
  added: []
  patterns:
    - next/font/google Inter variable font (sans weight — variable font)
    - Metadata + Viewport exports séparés (Next.js App Router convention)
    - KorviaLogo consommé via import canonique @/components/brand/korvia-logo
key_files:
  created: []
  modified:
    - src/app/layout.tsx
    - src/components/layout/sidebar.tsx
    - src/components/layout/sidebar-sheet.tsx
    - src/components/layout/header.tsx
    - src/app/(auth)/onboarding/page.tsx
    - src/app/manifest.ts
decisions:
  - "Inter chargé sans weight — c'est une variable font (doc Next.js confirme)"
  - "KorviaLogo variant=color dans sidebar navy — symbole ambre + wordmark via currentColor"
  - "GMAO conservé dans title.default et manifest.name uniquement — catégorie produit SEO"
metrics:
  duration: "5m"
  completed_date: "2026-05-19"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 6
---

# Phase 01 Plan 02: Rebrand Interface Authentifiée — Layout, Sidebar, Manifest

**One-liner:** Rebrand complet de l'app shell authentifiée avec Inter chargé, KorviaLogo dans les deux sidebars, metadata et manifest PWA brandés Korvia, themeColor navy #0F1C2E.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | layout.tsx — Inter + metadata Korvia + themeColor | 8e56eb0 | src/app/layout.tsx |
| 2 | Sidebar desktop + sheet mobile + header | 8fc6c29 | src/components/layout/sidebar.tsx, sidebar-sheet.tsx, header.tsx |
| 3 | Onboarding + manifest PWA | db90c37 | src/app/(auth)/onboarding/page.tsx, src/app/manifest.ts |

---

## Artifacts Produced

### layout.tsx

- `Inter` ajouté depuis `next/font/google` avec `variable: "--font-inter"`, `display: "swap"` (variable font — pas de `weight`)
- `Geist` conservé, `display: "swap"` ajouté
- `metadata.title.default`: `"Korvia — GMAO pour PME québécoises"`
- `metadata.title.template`: `"%s | Korvia"`
- `metadata.description`: `"Gérez vos actifs, bons de travail et maintenance préventive en français."`
- `metadata.appleWebApp.title`: `"Korvia"`
- `viewport.themeColor`: `"#0F1C2E"` (était `"#09090b"`)
- `<html className>`: `${geistSans.variable} ${inter.variable} h-full antialiased`

### sidebar.tsx + sidebar-sheet.tsx

- Import `Wrench` supprimé de `lucide-react`
- Import `KorviaLogo` ajouté depuis `@/components/brand/korvia-logo`
- Bloc logo remplacé : `<div className="flex items-center px-6 py-5 border-b text-sidebar-foreground"><KorviaLogo variant="color" size={32} showWordmark /></div>`
- Le `text-sidebar-foreground` sur le parent transmet `currentColor` au wordmark (blanc cassé sur fond navy)

### header.tsx

- Fallback `return "GMAO"` → `return "Korvia"` dans la fonction `getTitle`

### onboarding/page.tsx

- `CardTitle`: `"Bienvenue dans votre GMAO"` → `"Bienvenue dans Korvia"`

### manifest.ts

- `name`: `"Korvia — GMAO pour PME québécoises"` (terme catégorie SEO conservé)
- `short_name`: `"Korvia"`
- `description`: `"Gérez vos actifs, bons de travail et maintenance préventive en français."`
- `theme_color`: `"#0F1C2E"` (était `"#09090b"`)
- `background_color`: `"#0F1C2E"` (était `"#ffffff"`)
- Chemins `icons[]`, `orientation`, `categories`, `screenshots` préservés tels quels

---

## Occurrences "GMAO" — état résiduel

| Fichier | Occurrence | Statut |
|---------|-----------|--------|
| `src/app/layout.tsx` | `"Korvia — GMAO pour PME québécoises"` (title.default) | Intentionnel — catégorie SEO |
| `src/app/manifest.ts` | `'Korvia — GMAO pour PME québécoises'` (name) | Intentionnel — catégorie SEO |
| `src/components/layout/sidebar.tsx` | Aucune | Eliminé |
| `src/components/layout/sidebar-sheet.tsx` | Aucune | Eliminé |
| `src/components/layout/header.tsx` | Aucune | Eliminé |
| `src/app/(auth)/onboarding/page.tsx` | Aucune | Eliminé |

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Inter sans `weight:` | Variable font — inclut tous les poids. Doc Next.js: "If loading a variable font, you don't need to specify the font weight" |
| `variant="color"` dans sidebar navy | Symbole ambre apporte la touche d'accent; wordmark hérite `currentColor` du parent `text-sidebar-foreground` (blanc) |
| "GMAO" conservé dans title/manifest name | Catégorie produit pour SEO (Gestion de Maintenance Assistée par Ordinateur). Le nom de marque est "Korvia" partout ailleurs |
| `background_color` manifest → `#0F1C2E` | Cohérence avec theme_color navy; le splash screen PWA sera navy |

---

## Deviations from Plan

None — plan exécuté exactement tel qu'écrit. Les changements correspondent précisément aux spécifications (variant="color", taille 32, themeColor #0F1C2E, fallback "Korvia").

---

## Known Stubs

None — tous les composants sont branchés sur de vraies données. KorviaLogo retourne un SVG réel. Les métadonnées sont des valeurs finales.

---

## Tests visuels suggérés

1. **Sidebar desktop** (viewport > 1024px) : logo Korvia visible en haut gauche, symbole ambre + wordmark blanc sur fond navy
2. **Sidebar mobile** (viewport < 1024px) : ouvrir le Sheet via le bouton hamburger, même logo Korvia
3. **Header** : naviguer vers une URL sans titre défini (ex: `/unknown`) → affiche "Korvia" comme fallback
4. **Onboarding** : visiter `/onboarding` → titre de carte "Bienvenue dans Korvia" (sans "votre GMAO")
5. **Onglet navigateur** : titre HTML = "Korvia — GMAO pour PME québécoises"
6. **DevTools > Application > Manifest** : name "Korvia", theme_color "#0F1C2E"
7. **Ajout à l'écran d'accueil** (mobile) : icône ambre, titre court "Korvia"

---

## Threat Flags

None — modifications purement UI/branding. Aucun nouveau endpoint, aucun accès auth modifié, aucun changement de schéma.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/app/layout.tsx modified | FOUND |
| src/components/layout/sidebar.tsx modified | FOUND |
| src/components/layout/sidebar-sheet.tsx modified | FOUND |
| src/components/layout/header.tsx modified | FOUND |
| src/app/(auth)/onboarding/page.tsx modified | FOUND |
| src/app/manifest.ts modified | FOUND |
| Commit 8e56eb0 (layout.tsx) | FOUND |
| Commit 8fc6c29 (sidebar + header) | FOUND |
| Commit db90c37 (onboarding + manifest) | FOUND |
| No GMAO in sidebar/sheet/header/onboarding | PASS |
| Inter loaded with --font-inter variable | PASS |
| KorviaLogo in both sidebars | PASS |
| themeColor #0F1C2E in layout + manifest | PASS |
