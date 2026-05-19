---
phase: 01-identit-korvia
plan: "01"
subsystem: brand/design-system
tags: [css-tokens, tailwind-v4, svg-logo, favicon, oklch, korvia-brand]
dependency_graph:
  requires: []
  provides:
    - src/app/globals.css (tokens CSS palette Korvia oklch)
    - src/components/brand/korvia-logo.tsx (composant KorviaLogo)
    - src/app/icon.svg (favicon SVG Next.js App Router)
  affects:
    - Plans 02 et 03 (consomment KorviaLogo + tokens CSS)
    - Tous les composants shadcn (tokens :root et .dark remplacés)
tech_stack:
  added: []
  patterns:
    - Tailwind v4 CSS-only via @theme inline (pas de tailwind.config.ts)
    - oklch() pour tous les tokens couleur (gamut P3, calculs précis)
    - Convention Next.js App Router icon.svg pour favicon automatique
    - Composant SVG inline React sans dépendance externe
key_files:
  created:
    - src/components/brand/korvia-logo.tsx
    - src/app/icon.svg
  modified:
    - src/app/globals.css
decisions:
  - "Architecture CSS :root clair (app auth) + .dark sombre (landing) — évite de casser shadcn"
  - "Favicon nommé icon.svg (pas favicon.svg) — convention officielle Next.js App Router"
  - "wordmarkColor variant=color utilise currentColor — hérite du parent selon contexte"
metrics:
  duration: "1m 51s"
  completed_date: "2026-05-19"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 1
---

# Phase 01 Plan 01: Fondations Identité Korvia — CSS Tokens, Logo SVG, Favicon

**One-liner:** Tokens CSS palette "Acier québécois" (navy oklch(0.17 0.04 240) + ambre oklch(0.64 0.15 55)) avec composant KorviaLogo 3 variantes et favicon SVG App Router.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Tokens CSS Korvia dans globals.css | 6ebfbec | src/app/globals.css |
| 2 | Composant KorviaLogo | 6644b69 | src/components/brand/korvia-logo.tsx |
| 3 | Favicon SVG Korvia | 59199c7 | src/app/icon.svg |

---

## Artifacts Produced

### Tokens CSS finaux retenus

**:root (thème clair — app authentifiée)**
- `--background: oklch(0.97 0.005 240)` — surface claire #F5F6F8
- `--foreground: oklch(0.17 0.04 240)` — navy sur fond clair
- `--primary: oklch(0.64 0.15 55)` — ambre #E8830C
- `--sidebar: oklch(0.20 0.04 240)` — sidebar navy #162136 (reste sombre en mode clair)
- `--radius: 0.5rem` — 8px conforme UI-SPEC

**.dark (thème sombre — landing page)**
- `--background: oklch(0.17 0.04 240)` — navy #0F1C2E
- `--foreground: oklch(0.95 0.01 240)` — #F0F4F8
- `--primary: oklch(0.64 0.15 55)` — ambre #E8830C

**@theme inline (mappings fonts)**
- `--font-sans: var(--font-geist-sans)` — Geist pour body/label
- `--font-heading: var(--font-inter)` — Inter pour Display/Heading

### Interface publique de KorviaLogo (référence Plans 02 et 03)

```typescript
// src/components/brand/korvia-logo.tsx
interface KorviaLogoProps {
  variant?: "color" | "white" | "dark"  // défaut: "color"
  size?: number                          // défaut: 32 (px)
  showWordmark?: boolean                 // défaut: true
  className?: string
}

export function KorviaLogo(props: KorviaLogoProps): JSX.Element
```

**Comportement des variantes:**
- `"color"` : symbole ambre `#E8830C` + wordmark en `currentColor` (hérite du parent)
- `"white"` : symbole blanc `#FFFFFF` + wordmark blanc (usage sur fond sombre)
- `"dark"` : symbole navy `#0F1C2E` + wordmark navy (usage sur fond clair / documents PDF)

**Géométrie SVG du K (viewBox 0 0 32 32) :**
- Barre verticale : `<rect x="6" y="6" width="6" height="20" />`
- Diagonale supérieure : `<polygon points="12,15 22,6 26,6 14,18" />`
- Diagonale inférieure : `<polygon points="12,15 14,14 26,26 22,26" />`

### Favicon SVG (src/app/icon.svg)

- Fond ambre `#E8830C` avec `rx=6` (carré arrondi)
- Lettre K blanche, même géométrie que le composant (légèrement décalée pour centrer dans le carré)
- `src/app/favicon.ico` conservé comme fallback navigateurs anciens

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Architecture CSS :root clair + .dark sombre | Conforme shadcn — évite de casser les composants existants. Landing appliquera `className="dark"` localement (Plan 03). |
| Favicon nommé `icon.svg` (pas `favicon.svg`) | Seule convention reconnue par Next.js 16 App Router pour SVG. Vérifié dans node_modules/next/dist/docs/. |
| `wordmarkColor` variant="color" → `currentColor` | Flexibilité maximale — le parent contrôle la couleur du texte selon son contexte (fond sombre → text-white, fond clair → text-foreground). |
| Géométrie K en rect + 2 polygons (pas de paths complexes) | Rendu net à toutes tailles favicon, maintenable sans éditeur SVG. |

---

## Deviations from Plan

None — plan executed exactly as written. Les tokens oklch, la géométrie SVG et la convention icon.svg correspondent exactement aux spécifications du plan et de la UI-SPEC.

---

## Known Stubs

None — aucun stub. Tous les artefacts sont complets et fonctionnels. Le composant KorviaLogo retourne du JSX réel (pas de placeholder), les tokens CSS sont des valeurs oklch réelles (pas de TODO), icon.svg est un SVG complet.

---

## Threat Flags

None — cette phase est purement statique (CSS, SVG, composant React sans state). Aucun nouveau endpoint réseau, aucune surface d'authentification, aucun accès fichier dynamique.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/app/globals.css exists | FOUND |
| src/components/brand/korvia-logo.tsx exists | FOUND |
| src/app/icon.svg exists | FOUND |
| SUMMARY.md exists | FOUND |
| Commit 6ebfbec (globals.css) | FOUND |
| Commit 6644b69 (korvia-logo.tsx) | FOUND |
| Commit 59199c7 (icon.svg) | FOUND |
