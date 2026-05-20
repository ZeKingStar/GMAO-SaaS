---
phase: 2
slug: feature-gating
status: draft
shadcn_initialized: true
preset: base-nova / neutral / cssVariables
created: 2026-05-20
---

# Phase 2 — UI Design Contract: Feature Gating

> Contrat visuel et d'interaction pour les composants de contrôle d'accès aux features.
> Généré par gsd-ui-researcher. Validé par gsd-ui-checker.

---

## Design System

| Propriété | Valeur | Source |
|-----------|--------|--------|
| Outil | shadcn/ui | components.json |
| Preset | base-nova, baseColor neutral, cssVariables activées | components.json |
| Librairie de composants | Radix UI (via shadcn) | Phase 01 UI-SPEC |
| Librairie d'icônes | Lucide React (`Lock`, `AlertCircle`, `CreditCard`) | RESEARCH.md |
| Police heading | Inter (--font-heading) | Phase 01 UI-SPEC |
| Police body | Geist Sans (--font-sans) | Phase 01 UI-SPEC |
| Composants shadcn disponibles | badge, button, card, separator (+ tous Phase 01) | codebase scan |

**Héritage Phase 01:** Ce contrat hérite intégralement de la palette "Acier québécois" et de la typographie Inter/Geist établies en Phase 01. Aucun nouveau token de couleur ou de police n'est introduit.

---

## Spacing Scale

Identique à Phase 01 — multiples de 4 uniquement:

| Token | Valeur | Usage Phase 2 |
|-------|--------|---------------|
| xs | 4px | Gap icône cadenas + texte nav item |
| sm | 8px | Padding badge statut, gap interne banner |
| md | 16px | Padding horizontal/vertical banner UpgradeGate, padding widget dashboard |
| lg | 24px | Padding card widget dashboard, section padding |
| xl | 32px | Espacement entre widget et contenu dashboard |
| 2xl | 48px | — (non utilisé en Phase 2) |
| 3xl | 64px | — (non utilisé en Phase 2) |

Exceptions: cible tactile minimale 44px pour le bouton CTA du banner (hérité Phase 01).

---

## Typography

Identique à Phase 01 — 4 tailles, 2 poids uniquement:

| Rôle | Taille | Poids | Line Height | Usage Phase 2 |
|------|--------|-------|-------------|---------------|
| Display | 48px (3rem) | 700 | 1.15 | Non utilisé en Phase 2 |
| Heading | 28px (1.75rem) | 700 | 1.2 | Non utilisé en Phase 2 |
| Body | 16px (1rem) | 400 | 1.5 | Message principal widget dashboard, texte banner UpgradeGate |
| Label | 14px (0.875rem) | 400 | 1.4 | Nom du plan (badge), date de renouvellement, icône cadenas nav, texte bouton CTA banner |

**Règle héritée Phase 01:** Aucune taille hors de ce tableau. Aucun poids intermédiaire (500 ou 600) — uniquement 400 et 700. Le texte "font-medium" (`font-semibold` dans le code RESEARCH.md) du CTA banner doit utiliser weight 400 + majuscules ou weight 700 si besoin d'emphase — pas de weight 600.

---

## Color

Palette Korvia "Acier québécois" — intégralement héritée de Phase 01:

| Rôle | Valeur hex | oklch | Usage Phase 2 |
|------|-----------|-------|---------------|
| Dominant (60%) | `#F5F6F8` | `oklch(0.97 0.005 240)` | Surface app (fond pages gated, fond widget) |
| Secondary (30%) | `#162136` | `oklch(0.20 0.04 240)` | Sidebar (indicateur cadenas sur fond sombre) |
| Accent (10%) | `#E8830C` | `oklch(0.64 0.15 55)` | Voir liste réservée ci-dessous |
| Destructive | `#DC2626` | `oklch(0.58 0.22 25)` | Non utilisé en Phase 2 |

**Accent ambre réservé exclusivement en Phase 2 à:**
1. Fond et bordure du banner `<UpgradeGate>` (bg-amber-50, border-amber-300 en light / bg-amber-950/20 en dark)
2. Bouton CTA "Voir les plans" dans le banner (fond ambre `#E8830C`, texte blanc)
3. Icône `Lock` dans le banner UpgradeGate (text-amber-600)
4. Badge "Actif" du widget dashboard (déjà défini via STATUS_LABELS — bg-green-100/text-green-700, PAS ambre)

**Note STATUS_LABELS (hérité de billing-section.tsx — ne pas modifier):**
- `trialing` → bg-blue-100 text-blue-700, label "Essai gratuit"
- `active` → bg-green-100 text-green-700, label "Actif"
- `past_due` → bg-yellow-100 text-yellow-700, label "Paiement en retard"
- `canceled` → bg-red-100 text-red-700, label "Annulé"
- `unpaid` → bg-red-100 text-red-700, label "Non payé"

**Couleurs icône cadenas sidebar:**
- `text-muted-foreground/60` — discret, pas ambre (D-15: cadenas "discret")

---

## Composants de phase

### 1. `<UpgradeGate>` — Composant principal (nouveau)

**Fichier:** `src/components/upgrade-gate/upgrade-gate.tsx`

**Comportement:**
- `hasAccess={true}` → rend les enfants directement, aucun wrapper ajouté
- `hasAccess={false}` → affiche le banner amber en haut + enfants avec `blur-sm pointer-events-none select-none`

**Anatomie visuelle (hasAccess=false):**

```
┌─────────────────────────────────────────────────────┐
│ 🔒  Passez au plan Croissance pour accéder           [Voir les plans →] │
│     à cette fonctionnalité                                               │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  [contenu de la page — rendu mais flouté blur-sm]   │
│  [pointer-events-none, aria-hidden="true"]          │
└─────────────────────────────────────────────────────┘
```

**Spécifications du banner:**
- Conteneur: `rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-4`
- Dark mode: `dark:bg-amber-950/20 dark:border-amber-800`
- Layout: `flex items-center justify-between gap-4`
- Icône: `Lock` Lucide, `h-4 w-4 shrink-0 text-amber-600`, placée à gauche du texte
- Texte message: 14px (label), weight 400, `text-amber-800 dark:text-amber-200`
- Bouton CTA: `bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-md shrink-0 transition-colors`
- Hauteur bouton: 32px minimum (contexte inline — pas de nav standalone, pas besoin de 44px)

**Zone contenu floutée:**
- Classes: `blur-sm pointer-events-none select-none`
- `aria-hidden="true"` sur le div wrapper (le contenu est décoratif pour les utilisateurs sans accès)

**Props interface:**
```typescript
interface UpgradeGateProps {
  hasAccess: boolean
  requiredPlan?: 'growth' | 'enterprise'  // défaut: 'growth'
  children: React.ReactNode
}
```

---

### 2. Widget Abonnement Dashboard — Section nouvelle dans `/dashboard`

**Emplacement:** Bas du dashboard `/dashboard`, après les widgets existants

**Anatomie visuelle:**

**Cas 1 — Abonnement actif (active/trialing):**
```
┌──────────────────────────────────────────────────────────┐
│  Votre abonnement                                        │
│                                                          │
│  Plan Croissance  [badge Actif vert]                     │
│  Renouvellement le 19 juin 2026                          │
│                                                          │
│  [Gérer l'abonnement →]                                  │
└──────────────────────────────────────────────────────────┘
```

**Cas 2 — Paiement en retard (past_due/unpaid):**
```
┌──────────────────────────────────────────────────────────┐
│  ⚠  Votre abonnement                                     │
│                                                          │
│  Plan Croissance  [badge Paiement en retard jaune]       │
│  Mettre à jour vos informations de paiement              │
│                                                          │
│  [Mettre à jour la facturation →]                        │
└──────────────────────────────────────────────────────────┘
```

**Cas 3 — Abonnement annulé:**
```
┌──────────────────────────────────────────────────────────┐
│  Votre abonnement                                        │
│                                                          │
│  [badge Annulé rouge]                                    │
│  Votre accès aux fonctionnalités avancées a été suspendu │
│                                                          │
│  [Choisir un plan →]                                     │
└──────────────────────────────────────────────────────────┘
```

**Cas 4 — Aucun abonnement (null):**
```
┌──────────────────────────────────────────────────────────┐
│  Votre abonnement                                        │
│                                                          │
│  Aucun abonnement actif                                  │
│  Débloquez les rapports, l'inventaire et le scan QR.     │
│                                                          │
│  [Choisir un plan →]                                     │
└──────────────────────────────────────────────────────────┘
```

**Spécifications widget:**
- Conteneur: composant `<Card>` shadcn existant
- Fond: `--card` (blanc en light, `#162136` en dark) — cohérent avec les autres cards dashboard
- Titre section: "Votre abonnement", 16px body, weight 400 — utiliser `<CardHeader>`
- Nom du plan: 16px body, weight 700, texte foreground
- Badge statut: composant `<Badge>` shadcn, classes STATUS_LABELS réutilisées depuis billing-section.tsx
- Date renouvellement: 14px label, `text-muted-foreground`, format "19 juin 2026" (canadien-français)
- Lien "Gérer l'abonnement": `<Button variant="outline" size="sm">` — navigue vers `/parametres/organisation`
- Lien "Choisir un plan": `<Button variant="default" size="sm">` (fond ambre) — navigue vers `/parametres/organisation`
- Lien "Mettre à jour la facturation": `<Button variant="outline" size="sm">` — déclenche `createBillingPortalSession()`

---

### 3. Indicateur cadenas sidebar — Modification `sidebar.tsx` + `sidebar-sheet.tsx`

**Emplacement:** À droite du label des nav items gated (Inventaire, Rapports)

**Comportement:**
- Visible uniquement quand `userPlan === 'starter'` (ou plan effectif starter)
- Le lien reste cliquable — pas de `cursor-not-allowed`, pas de `disabled`
- Le cadenas mène l'utilisateur naturellement à la page gated avec le banner

**Spécifications:**
- Icône: `Lock` Lucide, `h-3 w-3 ml-auto text-muted-foreground/60`
- Pas de tooltip (D-15: "discret") — l'explication arrive sur la page
- Pas d'animation ni de badge coloré — uniquement l'icône cadenas sobre

**Prop à ajouter:**
```typescript
interface SidebarProps {
  userPlan?: 'starter' | 'growth' | 'enterprise'  // défaut: 'starter' (fail-safe)
}
```

---

## États d'interaction

### Banner UpgradeGate

| État | Apparence |
|------|-----------|
| Default | Fond amber-50, bordure amber-300, icône + texte amber-800 |
| CTA hover | Fond amber-600 (assombri depuis amber-500) |
| CTA focus | Ring 2px ambre offset 2px (hérité Phase 01) |
| Dark mode | Fond amber-950/20, bordure amber-800, texte amber-200 |

### Widget dashboard — Lien "Gérer l'abonnement"

| État | Apparence |
|------|-----------|
| Default | Button outline, bordure --border, texte foreground |
| Hover | Fond --muted (héritage shadcn) |
| Focus | Ring 2px ambre offset 2px |

### Cadenas nav sidebar

| État | Apparence |
|------|-----------|
| Default | text-muted-foreground/60 — opacité réduite, discret |
| Nav item hover | Le cadenas suit la couleur de l'item (text-white/60) |
| Nav item actif (impossible — items gated ne peuvent être actifs pour starter) | — |

---

## Copywriting Contract

| Élément | Copie | Source |
|---------|-------|--------|
| Banner message — plan growth | "Passez au plan Croissance pour accéder à cette fonctionnalité" | D-09 + Claude's Discretion |
| Banner message — plan enterprise | "Passez au plan Entreprise pour accéder à cette fonctionnalité" | D-09 + Claude's Discretion |
| Banner CTA | "Voir les plans" | D-09 |
| Widget titre section | "Votre abonnement" | D-12 + Claude's Discretion |
| Widget plan label prefix | "Plan" (ex: "Plan Croissance") | Claude's Discretion |
| Widget renouvellement label | "Renouvellement le {date}" | D-12 + Claude's Discretion |
| Widget lien actif/trialing | "Gérer l'abonnement" | D-12 |
| Widget lien past_due/unpaid | "Mettre à jour la facturation" | D-12 + Claude's Discretion |
| Widget lien annulé | "Choisir un plan" | D-14 |
| Widget aucun abonnement titre | "Aucun abonnement actif" | D-14 |
| Widget aucun abonnement corps | "Débloquez les rapports, l'inventaire et le scan QR." | D-14 + Claude's Discretion |
| Widget annulé corps | "Votre accès aux fonctionnalités avancées a été suspendu" | D-14 + Claude's Discretion |
| Widget past_due corps | "Mettre à jour vos informations de paiement" | Claude's Discretion |
| Aria-label cadenas sidebar | "Fonctionnalité verrouillée" | RESEARCH.md |

**Noms des plans (cohérence affichage):**
| Plan DB | Affichage UI |
|---------|-------------|
| `starter` | "Démarrage" |
| `growth` | "Croissance" |
| `enterprise` | "Entreprise" |

**Règles copywriting héritées Phase 01:**
- Tutoiement naturel québécois — jamais de vouvoiement
- Dates en format canadien-français: "19 juin 2026"
- Devise: "$ CAD" (si affichée — hors scope Phase 2)

---

## Accessibilité

| Exigence | Valeur |
|----------|--------|
| Contraste banner | amber-800 (`#92400e`) sur amber-50 (`#fffbeb`) → ratio ~7.5:1 (PASS AA) |
| Contraste CTA banner | blanc `#FFFFFF` sur amber-500 `#f59e0b` → ratio ~2.9:1 — texte bold 14px (PASS AA grandes tailles) |
| Zone floutée | `aria-hidden="true"` — exclue du lecteur d'écran |
| Cadenas sidebar | `aria-label="Fonctionnalité verrouillée"` sur l'icône |
| Cible tactile | CTA banner: 32px hauteur acceptable (inline dans banner, contexte desktop) |
| Focus visible | Ring 2px offset 2px ambre sur tous les boutons/liens interactifs (hérité Phase 01) |

---

## Registry Safety

| Registre | Blocs utilisés | Safety Gate |
|----------|---------------|-------------|
| shadcn official | `badge`, `button`, `card` (déjà installés en Phase 01) | non requis |
| Third-party | aucun | non applicable |

Aucun nouveau composant shadcn à installer. Aucun registre tiers déclaré.
`UpgradeGate` est créé manuellement — composant maison, zéro dépendance externe.

---

## Fichiers à créer / modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/upgrade-gate/upgrade-gate.tsx` | Créer | Composant `<UpgradeGate>` avec banner amber + blur overlay |
| `src/lib/auth.ts` | Modifier | Ajouter `requirePlan()` helper |
| `src/app/(app)/rapports/page.tsx` | Modifier | Appeler `requirePlan()` + wrapper `<UpgradeGate>` |
| `src/app/(app)/inventaire/page.tsx` | Modifier | Appeler `requirePlan()` + wrapper `<UpgradeGate>` |
| `src/app/(app)/actifs/scan/[qrCode]/page.tsx` | Modifier | Appeler `requirePlan()` + wrapper `<UpgradeGate>` |
| `src/app/(app)/dashboard/page.tsx` | Modifier | Ajouter section widget abonnement |
| `src/components/layout/sidebar.tsx` | Modifier | Ajouter prop `userPlan`, cadenas sur items gated |
| `src/components/layout/sidebar-sheet.tsx` | Modifier | Même modification que sidebar.tsx |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approbation:** pending
