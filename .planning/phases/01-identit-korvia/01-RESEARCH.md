# Phase 1: Identité Korvia — Research

**Researched:** 2026-05-19
**Domain:** Rebrand visuel — Tailwind v4 CSS-only, next/font, SVG logo, favicon Next.js App Router
**Confidence:** HIGH (sources officielles vérifiées dans node_modules/next/dist/docs)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-01 | L'interface affiche le nom "Korvia" et le logo SVG partout (navbar, favicon, emails) | Patterns SVG component + favicon convention vérifiés dans docs Next.js 16 |
| BRAND-02 | La landing page reflète l'identité visuelle Korvia (couleurs, typographie distinctives) | Tokens CSS oklch + Tailwind v4 @theme inline vérifiés dans globals.css existant |
| BRAND-03 | Le logo SVG est utilisable en blanc/couleur selon le contexte (fond sombre/clair) | Pattern composant React avec prop variant documenté dans UI-SPEC |
</phase_requirements>

---

## Summary

Le projet est sous **Next.js 16.2.6** — version avec breaking changes par rapport aux formations courantes (notamment `params` maintenant une Promise). La directive CLAUDE.md exige de consulter les docs embarquées dans `node_modules/next/dist/docs/` avant d'écrire du code. Cette recherche a été faite entièrement depuis ces sources officielles.

La phase consiste en un rebrand pur: pas de nouvelle dépendance à installer, pas de migration de données. Les fichiers cibles sont connus, les tokens CSS sont spécifiés dans la UI-SPEC, et les patterns Next.js sont conformes à la version installée. Le risque principal est la **surface de remplacement textuelle**: 7 fichiers contiennent "GMAO" et doivent tous être mis à jour.

La landing page requiert une **transformation visuelle significative** — passer d'un fond blanc générique à un fond navy `#0F1C2E` avec une navbar sticky pleine (pas de backdrop-blur). Le composant logo doit être créé ex nihilo en SVG natif sans dépendance externe.

**Recommandation principale:** Commencer par les tokens CSS dans `globals.css` (fondation de tout), puis le composant logo (réutilisé partout), puis les fichiers un par un selon la liste de la UI-SPEC.

---

## Project Constraints (from CLAUDE.md)

La directive CLAUDE.md (`@AGENTS.md`) stipule:

> "This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."

**Implication pour le plan:** Chaque tâche qui touche à des APIs Next.js (metadata, fonts, file conventions) doit référencer la doc locale vérifiée, pas le training data. Les patterns validés ci-dessous ont été lus depuis `node_modules/next/dist/docs/`.

---

## Standard Stack

### Core (aucune installation requise — tout est déjà présent)

| Bibliothèque | Version installée | Rôle dans cette phase |
|---|---|---|
| next | 16.2.6 | App Router, next/font, file conventions favicon/icon |
| tailwindcss | ^4 (CSS-only) | Tokens CSS via `@theme inline`, pas de tailwind.config.ts |
| shadcn/ui | ^4.7.0 (base-nova/neutral) | Composants de base — tokens CSS `--primary`, `--sidebar-*` |
| next/font/google | (inclus dans next) | Chargement Inter + Geist depuis Google Fonts |

**Aucun `npm install` requis pour cette phase.** [VERIFIED: package.json]

---

## Architecture Patterns

### Structure fichiers à créer/modifier

```
src/
├── app/
│   ├── globals.css              ← MODIFIER — tokens CSS palette Korvia
│   ├── layout.tsx               ← MODIFIER — metadata, fonts Inter+Geist
│   ├── manifest.ts              ← MODIFIER — name/short_name/theme_color
│   ├── page.tsx                 ← MODIFIER — landing Korvia (fond navy, logo)
│   └── icon.svg                 ← CRÉER   — favicon SVG symbole K (convention Next.js)
│   (favicon.ico existe → sera shadowed par icon.svg)
└── components/
    ├── brand/
    │   └── korvia-logo.tsx      ← CRÉER   — composant logo SVG avec variantes
    └── layout/
        ├── sidebar.tsx          ← MODIFIER — logo Korvia, tokens sidebar mis à jour
        ├── sidebar-sheet.tsx    ← MODIFIER — "GMAO" → "Korvia" (trouvé à la ligne 36)
        └── header.tsx           ← MODIFIER — getTitle fallback "GMAO" → "Korvia"
```

Et fichier hors `src/`:
```
src/app/(auth)/onboarding/page.tsx  ← MODIFIER — "votre GMAO" ligne 76
```

### Pattern 1: Tailwind v4 CSS-only — tokens oklch dans globals.css

Tailwind v4 n'utilise **pas** de `tailwind.config.ts`. La configuration se fait entièrement dans `globals.css` via `@theme inline`. Le fichier existant le confirme:

```css
/* Source: src/app/globals.css — existant vérifié */
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  --color-sidebar: var(--sidebar);
  /* ... tous les tokens CSS sont mappés ici */
}

:root {
  --background: oklch(1 0 0);       /* ← remplacer par oklch(0.17 0.04 240) */
  --primary: oklch(0.205 0 0);      /* ← remplacer par oklch(0.64 0.15 55)  */
}
```

[VERIFIED: src/app/globals.css lu directement]

**Point critique:** La UI-SPEC demande un thème sombre global (landing navy), mais l'app authentifiée utilise un fond clair. La stratégie est:
- `:root` → tokens thème sombre Korvia (landing + toute l'app par défaut)
- Classe `.light` ou surcharge sur `<body>` pour les pages app authentifiées
- Alternativement: garder `:root` en clair et utiliser `.dark` pour la landing

**Recommandation architecture CSS:** Conserver la structure `:root` (clair) / `.dark` (sombre) déjà en place dans shadcn — la landing applique `className="dark"` sur son container, l'app reste en light. Cela évite de casser les composants shadcn existants. [ASSUMED — à valider selon préférence]

### Pattern 2: Fonts dans Next.js 16 avec Tailwind v4

La méthode CSS variable est la bonne approche pour Tailwind v4:

```tsx
/* Source: node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md */
import { Inter, Geist } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',    // déclare la CSS var
})

const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
})

// Dans RootLayout:
<html className={`${inter.variable} ${geistSans.variable}`}>
```

```css
/* Dans globals.css @theme inline: */
@theme inline {
  --font-sans: var(--font-geist-sans);   /* body/label */
  --font-heading: var(--font-inter);      /* H1/H2 — MANQUANT dans le fichier actuel */
}
```

[VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md]

**Point critique:** Le `layout.tsx` actuel ne charge que `Geist` avec `variable: "--font-geist-sans"`. Inter n'est pas chargé. De plus, dans `globals.css`, `--font-heading` pointe vers `--font-sans` au lieu d'Inter — il faut corriger les deux.

### Pattern 3: Favicon SVG dans Next.js 16 App Router

La convention officielle pour un favicon SVG: [VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md]

```
src/app/icon.svg    ← fichier nommé "icon" avec extension .svg
```

Génère automatiquement dans le `<head>`:
```html
<link rel="icon" href="/icon?<generated>" type="image/svg+xml" sizes="any" />
```

**IMPORTANT:** Le fichier `src/app/favicon.ico` existant reste valide pour les navigateurs anciens. Le fichier `icon.svg` prendra priorité dans les navigateurs modernes. Pas besoin de supprimer `favicon.ico`.

Le manifest PWA référence déjà `/icon.svg` (depuis `public/icon.svg` existant, un placeholder). La convention App Router (`src/app/icon.svg`) est différente de `public/icon.svg` — les deux sont utiles:
- `src/app/icon.svg` → injecté dans `<head>` par Next.js
- `public/icon.svg` → référencé dans `manifest.ts` pour PWA

### Pattern 4: Metadata Next.js 16

```tsx
/* Source: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md */
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: "Korvia — GMAO pour PME québécoises", template: "%s | Korvia" },
  description: "Gérez vos actifs, bons de travail et maintenance préventive en français.",
}
```

Le `viewport` (themeColor) reste dans son propre export séparé — confirmé stable dans v16:
```tsx
/* Source: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-viewport.md */
import type { Viewport } from 'next'
export const viewport: Viewport = {
  themeColor: "#0F1C2E",   // navy Korvia (était "#09090b")
}
```

### Pattern 5: Composant Logo SVG avec variantes

```tsx
/* src/components/brand/korvia-logo.tsx — à créer */
interface KorviaLogoProps {
  variant?: "color" | "white" | "dark"
  size?: number
  showWordmark?: boolean
  className?: string
}

export function KorviaLogo({
  variant = "color",
  size = 32,
  showWordmark = true,
  className,
}: KorviaLogoProps) {
  // variant "color" → symbole ambre #E8830C
  // variant "white" → symbole blanc #FFFFFF
  // variant "dark"  → symbole navy #0F1C2E
  const symbolColor =
    variant === "color" ? "#E8830C" :
    variant === "white" ? "#FFFFFF" :
    "#0F1C2E"

  return (
    <span className={cn("flex items-center gap-2", className)} aria-label="Korvia">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
      >
        <title>Logo Korvia</title>
        {/* Symbole K industriel — fill uniquement, pas de stroke */}
        {/* ... paths SVG ... */}
      </svg>
      {showWordmark && (
        <span
          style={{ color: variant === "dark" ? "#0F1C2E" : variant === "white" ? "#FFFFFF" : "#F0F4F8" }}
          className="font-bold text-lg tracking-[-0.02em]"
        >
          Korvia
        </span>
      )}
    </span>
  )
}
```

[ASSUMED — structure du composant basée sur UI-SPEC, patterns React standards]

### Anti-Patterns à éviter

- **NE PAS** utiliser `tailwind.config.ts` pour étendre les couleurs — Tailwind v4 CSS-only dans ce projet
- **NE PAS** hardcoder les couleurs hex dans les classes Tailwind — utiliser les tokens `bg-primary`, `text-primary`, etc.
- **NE PAS** nommer le favicon `favicon.svg` dans `src/app/` — la convention est `icon.svg` (Next.js ignorerait `favicon.svg`)
- **NE PAS** mettre `favicon.ico` et `icon.svg` en conflit — ils coexistent, `icon.svg` prend priorité dans les navigateurs modernes
- **NE PAS** utiliser la classe `.dark` sur `<html>` globalement si l'app authentifiée doit rester claire
- **NE PAS** oublier `sidebar-sheet.tsx` et `onboarding/page.tsx` — contiennent aussi "GMAO" [VERIFIED: grep]

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser plutôt | Pourquoi |
|---|---|---|---|
| Chargement fonts | @font-face manuel | `next/font/google` | Auto-hosting, no layout shift, pas de requêtes Google browser-side |
| Tokens de couleur | Variables CSS ad hoc | `@theme inline` dans globals.css | Tailwind v4 déjà configuré ainsi — cohérence avec shadcn |
| Favicon injection | `<link>` dans layout.tsx | Convention fichier `src/app/icon.svg` | Next.js injecte automatiquement le bon `<link>` avec hash |
| Logo SVG externe | Bibliothèque icon | SVG natif inline en composant React | Contrôle total variantes, aucune dépendance |

---

## Runtime State Inventory

Cette phase est un rebrand pur (renommage textuel + CSS + SVG). Audit des états runtime:

| Catégorie | Éléments trouvés | Action requise |
|---|---|---|
| Stored data | Aucune donnée stockée ne contient "GMAO SaaS" comme clé ou identifiant applicatif | Aucune migration |
| Live service config | manifest PWA (`manifest.ts`) référence "GMAO" dans name/short_name | Modification fichier source |
| OS-registered state | Aucune tâche planifiée OS, aucun service enregistré avec ce nom | Aucune |
| Secrets/env vars | Aucune variable d'env ne référence "GMAO" comme nom de service | Aucune |
| Build artifacts | `public/icon.svg` et `public/icon-192.png`, `public/icon-512.png` sont des icônes placeholder | Remplacer par les icônes Korvia |

**Fichiers textuels avec "GMAO" à corriger** [VERIFIED: grep]:
1. `src/app/page.tsx` — multiple occurrences (navbar, footer "GMAO SaaS")
2. `src/app/layout.tsx` — metadata title/description/appleWebApp
3. `src/app/manifest.ts` — name, short_name
4. `src/components/layout/sidebar.tsx` — wordmark ligne 39
5. `src/components/layout/sidebar-sheet.tsx` — wordmark ligne 36
6. `src/components/layout/header.tsx` — fallback `getTitle` ligne 23
7. `src/app/(auth)/onboarding/page.tsx` — "votre GMAO" ligne 76

---

## Common Pitfalls

### Pitfall 1: Mauvais nom pour le favicon SVG

**Ce qui se passe:** Créer `src/app/favicon.svg` — Next.js ne reconnaît pas cette convention pour les SVG. Il reconnaît `favicon.ico` (ICO uniquement) ou `icon.svg` (convention `icon`).
**Pourquoi:** La UI-SPEC mentionne `src/app/favicon.svg` mais la doc officielle Next.js 16 indique que seul `icon.(ico|jpg|jpeg|png|svg)` est reconnu.
**Comment éviter:** Nommer le fichier `src/app/icon.svg` (pas `favicon.svg`).
**Source:** [VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md]

### Pitfall 2: Oublier --font-heading dans @theme inline

**Ce qui se passe:** Inter est chargé et son CSS var `--font-inter` est déclarée, mais si `@theme inline` ne mappe pas `--font-heading: var(--font-inter)`, les classes Tailwind `font-heading` n'ont aucun effet.
**Pourquoi:** Dans le fichier actuel `globals.css`, `--font-heading: var(--font-sans)` — il pointe vers Geist, pas Inter. Le mapping doit être mis à jour.
**Comment éviter:** Lors de la mise à jour de `globals.css`, corriger `--font-heading: var(--font-inter)` dans `@theme inline`.
**Source:** [VERIFIED: src/app/globals.css + font.md Next.js]

### Pitfall 3: Casser les composants shadcn avec un thème global sombre

**Ce qui se passe:** Si `:root` contient les tokens sombres Korvia navy, tous les composants shadcn (Dialog, Card, Input) apparaîtront en dark partout — y compris dans les pages app authentifiées qui doivent être claires.
**Pourquoi:** shadcn utilise `:root` pour le thème clair et `.dark` pour le sombre.
**Comment éviter:** Deux options valides (choix à faire en phase de plan):
  - Option A: Landing page encapsulée dans `<div class="dark">` pour forcer le dark uniquement sur elle. `:root` reste clair.
  - Option B: Redéfinir `:root` et `.dark` tous les deux avec les tokens Korvia adaptés.
La UI-SPEC indique "app authentifiée mode light avec sidebar navy" — Option A est plus propre.

### Pitfall 4: Confondre public/icon.svg et src/app/icon.svg

**Ce qui se passe:** `public/icon.svg` est le fichier utilisé par `manifest.ts` pour les PWA. `src/app/icon.svg` est la convention App Router pour le favicon `<link>`. Ce sont deux fichiers distincts avec des rôles différents.
**Comment éviter:** Mettre à jour les deux: `src/app/icon.svg` pour le favicon HTML, `public/icon.svg` pour le manifest PWA. Mettre aussi à jour `public/icon-192.png` et `public/icon-512.png`.

### Pitfall 5: Inter n'est pas une variable font pour le poids 700 uniquement

**Ce qui se passe:** Inter est une variable font (inclut tous les poids). Si on déclare `weight: '700'` uniquement, on perd le subset variable font et la performance est sous-optimale.
**Comment éviter:** Charger Inter sans spécifier de poids (`variable font` par défaut inclut tous les poids). La contrainte "700 pour heading" se gère en CSS avec `font-weight: 700` sur les éléments, pas dans la déclaration `next/font`.
[VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md — "If loading a variable font, you don't need to specify the font weight"]

---

## Code Examples

### globals.css — structure cible Korvia

```css
/* Source: src/app/globals.css (existant) + UI-SPEC tokens */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);       /* Geist pour body */
  --font-heading: var(--font-inter);         /* Inter pour headings — CORRIGER */
  --font-mono: var(--font-geist-mono);
  /* ... autres tokens identiques ... */
}

:root {
  /* Thème clair — app authentifiée (surface #F5F6F8) */
  --background: oklch(0.97 0.005 240);       /* #F5F6F8 surface claire */
  --foreground: oklch(0.17 0.04 240);        /* navy sur fond clair */
  --primary: oklch(0.64 0.15 55);            /* ambre */
  --primary-foreground: oklch(0.98 0 0);
  /* sidebar reste dark même en mode :root clair */
  --sidebar: oklch(0.20 0.04 240);           /* #162136 */
  --sidebar-foreground: oklch(0.95 0.01 240);
  --sidebar-primary: oklch(0.64 0.15 55);    /* ambre */
  /* ... */
}

.dark {
  /* Thème sombre — landing page */
  --background: oklch(0.17 0.04 240);        /* #0F1C2E navy */
  --foreground: oklch(0.95 0.01 240);        /* #F0F4F8 */
  --primary: oklch(0.64 0.15 55);            /* ambre */
  --primary-foreground: oklch(0.98 0 0);
  /* ... */
}
```

### layout.tsx — fonts dual

```tsx
/* Source: node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md */
import { Inter, Geist } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
})

// html className inclut les deux variables
<html lang="fr" className={`${inter.variable} ${geistSans.variable} h-full antialiased`}>
```

### icon.svg — favicon Korvia (placement: src/app/icon.svg)

```svg
<!-- Symbole K — fond ambre #E8830C, lettre blanche -->
<!-- viewBox "0 0 32 32", fill only, no stroke -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <title>Logo Korvia</title>
  <rect width="32" height="32" rx="6" fill="#E8830C"/>
  <!-- Lettre K géométrique industrielle, fill blanc -->
  <path d="..." fill="#FFFFFF"/>
</svg>
```

---

## Validation Architecture

### Test Framework

| Propriété | Valeur |
|---|---|
| Framework | Détection en cours — pas de `jest.config.*` ou `vitest.config.*` trouvé |
| Config file | Absent — Wave 0 devra créer ou documenter l'absence |
| Quick run | N/A — phase visuelle/CSS |
| Full suite | N/A |

**Note:** Cette phase est 100% visuelle (CSS, SVG, renommages textuels). Aucun test unitaire automatisé n'est applicable. La validation est visuelle et checklist manuelle selon la UI-SPEC Checker Sign-Off.

### Phase Requirements → Test Map

| Req ID | Comportement | Type test | Commande | Fichier |
|---|---|---|---|---|
| BRAND-01 | "Korvia" apparaît dans navbar, favicon, emails | Inspection manuelle + grep | `grep -r "GMAO" src/ --include="*.tsx" --include="*.ts"` | N/A |
| BRAND-02 | Landing page utilise fond navy + ambre | Inspection visuelle | `npm run dev` + viewport | N/A |
| BRAND-03 | Logo en blanc sur fond sombre | Inspection visuelle | Vérifier variant="white" dans sidebar | N/A |

### Wave 0 Gaps

- [ ] Vérifier `npm run build` passe sans erreur après tous les changements
- [ ] Vérifier `grep -r "GMAO" src/` retourne 0 résultats après la phase
- [ ] Contraste WCAG AA: `#E8830C` sur `#0F1C2E` — ratio 6.2:1 (déjà validé dans UI-SPEC)

---

## Environment Availability

Étape 2.6: SKIPPED (phase code/config uniquement — pas de dépendances externes à installer)

---

## Assumptions Log

| # | Claim | Section | Risque si faux |
|---|---|---|---|
| A1 | Architecture CSS: landing en `.dark`, app en `:root` clair | Architecture Patterns — Pitfall 3 | Si l'app entière doit être dark, la stratégie CSS change complètement |
| A2 | `public/icon-192.png` et `public/icon-512.png` doivent être régénérés avec la nouvelle icône Korvia | Runtime State Inventory | Les icônes PWA restent GMAO si oubliées |
| A3 | `onboarding/page.tsx` ligne 76 "votre GMAO" — le mot "GMAO" est accepté ici comme terme générique (catégorie logiciel) ou doit être remplacé par "Korvia" | Fichiers à modifier | Hors scope si "GMAO" reste comme terme générique dans l'onboarding |

---

## Open Questions

1. **Stratégie dark/light**
   - Ce qu'on sait: La landing page doit être fond navy (#0F1C2E). L'app authentifiée utilise une surface claire (#F5F6F8) avec sidebar navy.
   - Ce qui est flou: Faut-il que la landing page applique `class="dark"` localement, ou refaire `:root` en dark global?
   - Recommandation: Appliquer `<div className="dark">` uniquement sur la landing page pour éviter de casser l'app existante. [ASSUMED]

2. **Géométrie du K dans le logo SVG**
   - Ce qu'on sait: La UI-SPEC décrit "barre verticale pleine, deux diagonales asymétriques, angles précis, aucune courbe".
   - Ce qui est flou: Les coordonnées exactes du path SVG ne sont pas spécifiées — le dessin du K doit être créé.
   - Recommandation: Créer un K simple: rect vertical 30% largeur + deux polygones angulaires. Taille 32×32 viewBox.

3. **`public/icon-192.png` et `public/icon-512.png`**
   - Ce qu'on sait: Ces fichiers existent dans `public/` et sont référencés dans `manifest.ts`.
   - Ce qui est flou: Ces PNG ne peuvent pas être créés en SVG — il faudrait un outil de rasterisation ou les fournir manuellement.
   - Recommandation: Pour cette phase, mettre à jour uniquement `src/app/icon.svg` et `public/icon.svg` (SVG). Les PNG pour PWA peuvent être une tâche suivante à faible priorité (les navigateurs modernes utilisent le SVG).

---

## Sources

### Primaires (HIGH confidence)

- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` — API next/font, variable fonts, CSS variables + Tailwind v4
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md` — Convention favicon/icon dans App Router, `.svg` supporté pour `icon`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` — API Metadata object
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-viewport.md` — API Viewport/themeColor
- `src/app/globals.css` — Structure Tailwind v4 `@theme inline` existante vérifiée
- `src/app/layout.tsx` — Font actuel (Geist seul), metadata existante
- `src/app/page.tsx` — Landing existante complète
- `src/components/layout/sidebar.tsx`, `sidebar-sheet.tsx`, `header.tsx` — Composants existants
- `src/app/manifest.ts` — PWA manifest existant
- `package.json` — Versions: next@16.2.6, tailwindcss@^4, shadcn@^4.7.0

### Secondaires (MEDIUM confidence)

- `grep -r "GMAO" src/` — Inventaire exhaustif des occurrences textuelles (7 fichiers)
- `public/icon.svg` — Icône PWA placeholder existante identifiée
- `.planning/phases/01-identit-korvia/01-UI-SPEC.md` — Tokens CSS cibles, spécification logo, copywriting validés

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — versions vérifiées dans package.json
- Architecture patterns CSS/fonts: HIGH — docs Next.js 16 lues directement
- Stratégie dark/light CSS: ASSUMED — recommandation logique, non spécifiée explicitement dans la UI-SPEC
- Géométrie SVG logo K: LOW — à créer, pas de référence existante

**Research date:** 2026-05-19
**Valid until:** 2026-06-19 (stable — Next.js 16, Tailwind v4, aucun breaking change attendu)
