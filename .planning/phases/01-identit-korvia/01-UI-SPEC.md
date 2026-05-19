---
phase: 1
slug: identit-korvia
status: draft
shadcn_initialized: true
preset: base-nova / neutral / cssVariables
created: 2026-05-19
---

# Phase 1 — UI Design Contract: Identité Korvia

> Contrat visuel et d'interaction pour la phase de rebranding Korvia.
> Généré par gsd-ui-researcher. Validé par gsd-ui-checker.

---

## Design System

| Propriété | Valeur |
|-----------|--------|
| Outil | shadcn/ui |
| Preset | base-nova, baseColor neutral, cssVariables activées |
| Librairie de composants | Radix UI (via shadcn) |
| Librairie d'icônes | Lucide React |
| Police | Inter (heading) + Geist Sans (body/code) |
| Composants shadcn existants | avatar, badge, button, card, dialog, dropdown-menu, input, label, separator, sheet, skeleton, tabs, tooltip |

**Direction esthétique:** "Acier québécois" — bleu marine industriel profond avec accent ambre chaud. Évoque précision, fiabilité, terrain. Contraste élevé, typographie musclée, pas de pastel, pas de gradient purple.

---

## Spacing Scale

Valeurs déclarées (multiples de 4 uniquement):

| Token | Valeur | Usage |
|-------|--------|-------|
| xs | 4px | Gaps icônes, padding inline (icon + label) |
| sm | 8px | Espacement éléments compacts (badge padding, nav item gap) |
| md | 16px | Espacement par défaut (padding card, champ formulaire) |
| lg | 24px | Padding de section (px-6 dans les blocs existants) |
| xl | 32px | Gaps de layout (espacement colonnes grille) |
| 2xl | 48px | Ruptures majeures de section |
| 3xl | 64px | Espacement page (py-16 hero, footer) |

Exceptions: cible tactile minimale 44px pour tous les éléments interactifs touch (boutons primaires, nav items mobile). Logo dans sidebar: 32px de hauteur exacte pour alignement vertical avec le texte.

---

## Typography

| Rôle | Taille | Poids | Line Height | Usage concret |
|------|--------|-------|-------------|---------------|
| Display | 48px (3rem) | 700 | 1.15 | H1 landing hero uniquement |
| Heading | 28px (1.75rem) | 700 | 1.2 | H2 de section (Features, Pricing) — weight 400 pour variante sous-titre de section |
| Body | 16px (1rem) | 400 | 1.5 | Corps de texte principal |
| Label | 14px (0.875rem) | 400 | 1.4 | Labels formulaires, nav items, badges, captions, métadonnées, horodatages, texte footer — `text-muted-foreground` pour les variantes discrètes |

**Polices:**
- `--font-heading`: Inter, weight 700 — pour Display, Heading
- `--font-sans`: Geist Sans, weight 400 — pour Body, Label

**Règle:** 4 tailles exactement dans la phase. Aucune taille hors de ce tableau autorisée sans décision explicite. Aucun poids intermédiaire (500 ou 600) — uniquement 400 et 700.

---

## Color

### Palette Korvia — "Acier québécois"

| Rôle | Valeur hex | oklch | Usage |
|------|-----------|-------|-------|
| Dominant (60%) | `#0F1C2E` | `oklch(0.17 0.04 240)` | Background principal, fond hero, navbar landing |
| Secondary (30%) | `#162136` | `oklch(0.20 0.04 240)` | Sidebar, cards, panneau pricing non-actif |
| Surface claire | `#F5F6F8` | `oklch(0.97 0.005 240)` | Pages app authentifiée (fond clair, mode light) |
| Accent (10%) | `#E8830C` | `oklch(0.64 0.15 55)` | Voir liste réservée ci-dessous |
| Destructive | `#DC2626` | `oklch(0.58 0.22 25)` | Actions destructives uniquement |
| Texte sur fond sombre | `#F0F4F8` | `oklch(0.95 0.01 240)` | Foreground sur Dominant/Secondary |
| Texte muted sur fond sombre | `#8BA3C0` | `oklch(0.65 0.04 240)` | Muted foreground sur fond sombre |

**Ratio 60/30/10:**
- 60% navy `#0F1C2E` — landing page, hero, footer, sections background
- 30% `#162136` — sidebar app, cards pricing secondaires, panels
- 10% ambre `#E8830C` — éléments d'action et de signal listés ci-dessous

**Accent ambre réservé exclusivement à:**
1. Bouton CTA primaire (fond ambre, texte blanc) sur fond sombre
2. Badge "Populaire" sur le plan Croissance
3. Icône active dans la nav sidebar (état actif uniquement)
4. Indicateur de focus du logo SVG (contour hover)
5. CheckCircle2 dans social proof / feature list sur fond sombre
6. Anneau de focus keyboard (ring color)
7. Badge "Nouveau" / announcement pill dans hero

**L'ambre NE S'APPLIQUE PAS à:** texte de paragraphe, bordures génériques, hover state secondaire, état désactivé.

### Tokens CSS à remplacer dans globals.css

```css
/* Mode sombre (fond Korvia) — landing page */
--background: oklch(0.17 0.04 240);        /* #0F1C2E navy */
--foreground: oklch(0.95 0.01 240);        /* #F0F4F8 */
--primary: oklch(0.64 0.15 55);            /* #E8830C ambre */
--primary-foreground: oklch(0.98 0 0);     /* blanc */
--secondary: oklch(0.20 0.04 240);         /* #162136 */
--secondary-foreground: oklch(0.95 0.01 240);
--muted: oklch(0.22 0.04 240);
--muted-foreground: oklch(0.65 0.04 240);  /* #8BA3C0 */
--accent: oklch(0.64 0.15 55);             /* ambre = accent */
--accent-foreground: oklch(0.98 0 0);
--border: oklch(1 0 0 / 10%);
--card: oklch(0.20 0.04 240);
--card-foreground: oklch(0.95 0.01 240);
--sidebar: oklch(0.20 0.04 240);
--sidebar-primary: oklch(0.64 0.15 55);
--sidebar-primary-foreground: oklch(0.98 0 0);
--sidebar-accent: oklch(0.25 0.04 240);
--sidebar-accent-foreground: oklch(0.95 0.01 240);
```

**Note:** La landing page utilisera le thème sombre (dark navy). L'app authentifiée utilisera un thème clair avec navy comme sidebar background et surface claire `#F5F6F8` pour le contenu.

---

## Logo SVG — Spécification

### Concept: Monogramme "K" industriel

Le logo Korvia est composé de deux éléments:
1. **Symbole:** Lettre "K" géométrique dans un conteneur carré/losange
2. **Wordmark:** "Korvia" en Inter 700, tracking légèrement serré (-0.02em)

### Contraintes techniques

| Attribut | Valeur |
|----------|--------|
| Format | SVG (viewBox="0 0 32 32" pour symbole seul) |
| Taille minimale | 24px (favicon, email header) |
| Taille navbar | 32px hauteur |
| Stroke | Pas de stroke — fill uniquement pour rendu favicon net |
| Variante couleur | Symbole ambre `#E8830C` sur fond navy `#0F1C2E` |
| Variante mono-blanc | Symbole blanc `#FFFFFF` sur fond transparent (pour emails dark, footer) |
| Variante mono-sombre | Symbole navy `#0F1C2E` sur fond transparent (pour docs PDF, contexte clair) |

### Structure du symbole K

Le "K" est stylisé avec une barre verticale pleine et deux diagonales asymétriques:
- Barre verticale: rect plein, 30% de la largeur
- Diagonale supérieure: inclinée 35°, pointe effilée vers le haut-droit
- Diagonale inférieure: inclinée -35°, légèrement plus épaisse pour ancrer visuellement

Inspiré du secteur industriel: lignes nettes, angles précis, aucune courbe décorative.

### Favicon

- 32×32px: symbole K seul, fond ambre `#E8830C`, lettre blanc `#FFFFFF`
- 16×16px: symbole K simplifié (traits épaissis), fond ambre
- SVG favicon: `src/app/favicon.svg` (référencé dans layout.tsx metadata)

---

## Composants de phase

### Logo Component

```
<KorviaLogo variant="color" | "white" | "dark" size={24|32|48} showWordmark={boolean} />
```

- `variant="color"`: ambre + wordmark navy (usage sur fond clair)
- `variant="white"`: tout blanc (usage sur fond sombre)
- `variant="dark"`: tout navy (usage sur fond blanc/document)
- `showWordmark`: affiche "Korvia" à droite du symbole

### Navbar Landing (non authentifié)

Layout sticky, fond `#0F1C2E` (pas de bg-background/95 blur opaque, fond plein navy).
- Logo: variante white (symbole blanc + wordmark blanc)
- CTA "Commencer gratuitement": fond ambre, texte blanc, hover `#C97009`
- "Se connecter": texte `#8BA3C0`, hover blanc

### Sidebar App (authentifié)

- Fond: `#162136` (--sidebar)
- Logo: variante color (symbole ambre + wordmark blanc)
- Nav item actif: fond `rgba(232,131,12,0.12)`, texte ambre, icône ambre
- Nav item inactif: texte `#8BA3C0`, hover texte blanc, hover fond `rgba(255,255,255,0.05)`
- Bordure séparatrice: `rgba(255,255,255,0.08)`

### Hero Section

- Fond: gradient subtil `from-[#0F1C2E] to-[#0D1824]` (pas de dégradé coloré)
- Badge pill: fond `rgba(232,131,12,0.15)`, texte ambre, bordure `rgba(232,131,12,0.3)`
- H1: texte `#F0F4F8`, span accent en ambre
- CTA primaire: fond ambre, texte blanc, border-radius 8px, height 44px
- CTA secondaire: bordure `rgba(255,255,255,0.2)`, texte blanc, hover fond `rgba(255,255,255,0.08)`

---

## Copywriting Contract

| Élément | Copie |
|---------|-------|
| CTA primaire (landing) | "Commencer gratuitement" |
| CTA secondaire (landing) | "Voir une démo" |
| CTA nav (landing) | "Démarrer" |
| Lien connexion (landing) | "Se connecter" |
| Badge hero | "Nouveau · Gestion de maintenance moderne" |
| H1 hero | "La GMAO moderne pour les PME québécoises" |
| Sous-titre hero | "Gérez vos actifs, planifiez la maintenance et coordonnez vos équipes — en français, conçu pour le marché québécois." |
| Social proof 1 | "Essai gratuit 14 jours" |
| Social proof 2 | "Sans carte de crédit" |
| Social proof 3 | "Support en français" |
| H2 features | "Tout ce dont vous avez besoin" |
| H2 pricing | "Tarification simple et transparente" |
| Sous-titre pricing | "Facturation par organisation, pas par utilisateur. Changez de plan à tout moment." |
| CTA section finale | "Prêt à moderniser votre maintenance?" |
| Sous-titre section finale | "Rejoignez les entreprises québécoises qui ont choisi Korvia." |
| Footer | "© 2026 Korvia — Fait au Québec 🍁" |
| Wordmark sidebar | "Korvia" |
| Titre fenêtre (metadata title) | "Korvia — GMAO pour PME québécoises" |
| Description meta | "Gérez vos actifs, bons de travail et maintenance préventive en français." |
| État vide (bons de travail) | Titre: "Aucun bon de travail" / Corps: "Créez votre premier bon de travail pour commencer à suivre vos interventions." / Action: "Créer un bon de travail" |
| État vide (actifs) | Titre: "Aucun actif enregistré" / Corps: "Ajoutez vos premiers équipements pour générer des QR codes et suivre leur historique." / Action: "Ajouter un actif" |
| Erreur générique | "Une erreur est survenue. Rechargez la page ou contactez le support si le problème persiste." |
| Erreur réseau | "Connexion interrompue. Vérifiez votre connexion internet et réessayez." |
| Confirmation suppression | Titre: "Supprimer définitivement?" / Corps: "Cette action est irréversible. L'élément sera supprimé de façon permanente." / Bouton: "Supprimer" (rouge) / Annuler: "Annuler" |

**Règle copywriting:**
- Toujours "Korvia" — jamais "GMAO", "GMAO SaaS" ou "notre outil"
- Vouvoiement jamais utilisé — tutoiement naturel québécois
- Dates en format canadien français: "19 mai 2026"
- Devise: "$ CAD" (pas "USD", pas "€")

---

## Interactions et états

### Bouton primaire (ambre)

| État | Apparence |
|------|-----------|
| Default | Fond `#E8830C`, texte blanc, radius 8px |
| Hover | Fond `#C97009` (assombri 15%) |
| Focus | Ring 2px ambre offset 2px (accessibilité clavier) |
| Active | Fond `#A85E08` (assombri 30%), scale 0.98 |
| Disabled | Opacité 40%, cursor not-allowed |
| Loading | Spinner blanc centré, texte masqué |

### Bouton secondaire (outline)

| État | Apparence |
|------|-----------|
| Default | Bordure `rgba(255,255,255,0.2)`, texte blanc, fond transparent |
| Hover | Fond `rgba(255,255,255,0.08)` |
| Focus | Ring 2px blanc offset 2px |

### Nav sidebar

| État | Apparence |
|------|-----------|
| Default | Texte `#8BA3C0`, icône même couleur |
| Hover | Texte blanc `#F0F4F8`, fond `rgba(255,255,255,0.05)` |
| Actif | Texte ambre, icône ambre, fond `rgba(232,131,12,0.12)` |
| Focus | Ring 2px ambre inset |

### Logo hover (landing navbar)

Opacité 0.85 sur hover, transition 150ms ease. Pas d'animation de transformation.

### Transition globale

`transition-colors duration-150 ease-in-out` — pas d'animation de layout. Transitions sur color/background-color/opacity/ring uniquement.

---

## Accessibilité

| Exigence | Valeur |
|----------|--------|
| Contraste minimum | WCAG AA — 4.5:1 pour texte body, 3:1 pour grands textes |
| Vérification ambre sur navy | `#E8830C` sur `#0F1C2E` → ratio ~6.2:1 (PASS AA) |
| Vérification blanc sur ambre | `#FFFFFF` sur `#E8830C` → ratio ~3.1:1 (PASS AA grandes tailles, boutons) |
| Cible tactile | 44px minimum (WCAG 2.5.5 AAA recommandé) |
| Focus visible | Ring 2px offset 2px obligatoire sur tous les interactifs |
| Texte alternatif logo | `alt="Korvia"` sur toute image logo, `aria-label="Korvia"` sur lien navbar |
| SVG accessible | `role="img"` + `<title>Logo Korvia</title>` dans le SVG |

---

## Registry Safety

| Registre | Blocs utilisés | Safety Gate |
|----------|---------------|-------------|
| shadcn official | button, card, badge, dialog, input, label, separator, avatar, skeleton, tooltip, tabs, sheet, dropdown-menu | non requis |
| Third-party | aucun | non applicable |

Aucun registre tiers déclaré pour cette phase. Le composant logo sera créé manuellement en SVG natif sans dépendance externe.

---

## Fichiers à créer / modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/globals.css` | Modifier | Remplacer les tokens CSS par la palette Korvia |
| `src/components/brand/korvia-logo.tsx` | Créer | Composant logo SVG avec variantes |
| `src/app/favicon.svg` | Créer | Favicon SVG symbole K ambre |
| `src/app/layout.tsx` | Modifier | Metadata title/description Korvia, favicon |
| `src/app/page.tsx` | Modifier | Rebrand landing — remplacer "GMAO" par "Korvia", appliquer nouveaux tokens |
| `src/components/layout/sidebar.tsx` | Modifier | Logo Korvia, "GMAO" → "Korvia", tokens sidebar mis à jour |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approbation:** pending
