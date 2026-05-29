# Plan de lancement — Korvia

*Généré le 2026-05-29 — structure solopreneur avec emploi à temps plein*

---

## Où tu en es : portrait honnête

### L'application — Milestone 3 à 94%

| Phase | Contenu | État |
|-------|---------|------|
| 1 — Identité Korvia | Rebrand, logo SVG | ✓ |
| 2 — Feature Gating | Tiers Stripe, UpgradeGate | ✓ |
| 3 — Notifications Email | BT assigné, maintenance due, stock bas | ✓ |
| 4 — API Publique | REST + OpenAPI/Scalar | ✓ |
| 5 — Portail de demandes | URL publique → BT sans compte | ✓ |
| 6 — Données terrain | Codes panne P/C/R, minuterie coûts | ✓ |
| 7 — Analytique fiabilité | MTTR, top pannes, coût/actif, plan vs réel | ✓ |
| 8 — Productivité technicien | Job plans, checklists, escalade urgences | ✓ |
| 9 — Maintenance conditionnelle | Compteurs → BT automatique | **2 plans restants** |

**La réalité :** le produit est fonctionnellement complet pour un lancement. La Phase 09 est du polish, pas du pré-requis.

---

## Positionnement concurrentiel

| | Korvia | Limble CMMS | UpKeep | Fracttal |
|---|---|---|---|---|
| **Langue** | FR québécois | EN seulement | EN seulement | ES/EN |
| **Marché** | PME QC/FR | USA/Global | USA/Global | Latam/Global |
| **Prix d'entrée** | ~39 $ CAD/mois | ~45–85 $ USD/user | ~45 $ USD/user | ~prix enterprise |
| **Devise** | CAD | USD | USD | USD/EUR |
| **Hébergement** | Canada | USA | USA | Espagne |
| **Public cible** | Technicien terrain | IT/facility | Mobile-first | Enterprise |

**Avantage réel :** c'est pas juste la langue — c'est le trifecta **FR + CAD + hébergement Canada**. Pour une PME manufacturière québécoise ou un service municipal, acheter du logiciel américain en USD avec les données aux États-Unis est une friction réelle. Korvia l'élimine les trois d'un coup.

**Risque à surveiller :** pas encore de clients réels qui valident que ces avantages convertissent. C'est exactement le rôle du programme fondateurs.

---

## Plan de déploiement — structure solopreneur

Pas de dépendance quotidienne. Des blocs d'effort concentrés le soir/weekend. Une machine qui tourne seule entre les interventions.

### Sprint 0 — Fermer le produit *(1 weekend, ~6h)*

Exécuter les 2 plans de la Phase 09 + compléter Milestone 3 avec `/gsd-complete-milestone`.

C'est le verrou psychologique : une fois fait, on arrête de coder des features et on passe en mode vente.

### Sprint 1 — Infrastructure de prod *(1 weekend, ~4h)*

| Tâche | Outil | Effort |
|-------|-------|--------|
| Acheter `korvia.ca` + DNS | Namecheap/Cloudflare | 30 min |
| Déployer site marketing (`/site`) | Vercel/Netlify ou VPS existant | 1h |
| Déployer app Next.js sur VPS (prod) | PM2 + Nginx + SSL Certbot | 2h |
| Variables d'env production | Clerk prod, Stripe live, Resend, Neon | 1h |

Le VPS est déjà là (2 vCPU/2 GB). Next.js + PM2 est largement suffisant.

### Sprint 2 — Activer le programme fondateurs *(2 semaines, ~1h/semaine)*

La page `site/fondateurs.html` est prête : 50 places, 6 mois gratuits, prix bloqué à vie, voix sur la roadmap.

**Playbook solopreneur :**

1. **Réseau personnel d'abord** — contacts en maintenance industrielle, municipal, immobilier ? 5 emails personnels valent plus que 500 posts LinkedIn.
2. **Objectif réaliste :** 5 fondateurs actifs en 60 jours, pas 50. 5 vrais usagers qui utilisent l'app chaque semaine, c'est le signal de validation.
3. **Onboarding manuel** — pour les 5 premiers, appel téléphonique + importation de leur inventaire ensemble. 2h par client, mais apprentissage 10x supérieur à un formulaire.

### Sprint 3 — Milestone 4 piloté par le feedback *(3–6 mois)*

Ne pas planifier Milestone 4 maintenant. Après 60 jours avec des fondateurs actifs, on saura ce qui bloque vraiment.

Les 5 features prévues seront validées ou reordonnées selon ce que les clients demandent :

- Multi-langue (FR/EN-CA)
- Export CSV/Excel
- Import assisté IA (backlog 999.1)
- Notifications push PWA
- Mode hors-ligne complet

---

## Cette semaine — 3 actions

1. **Finir Phase 09** → `/gsd-execute-phase` sur les 2 plans restants
2. **Acheter korvia.ca** (ou confirmer que c'est fait)
3. **Identifier 2–3 noms** dans le réseau personnel pour les premiers appels fondateurs
