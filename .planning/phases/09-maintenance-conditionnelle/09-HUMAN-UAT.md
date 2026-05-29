---
status: partial
phase: 09-maintenance-conditionnelle
source: [09-VERIFICATION.md]
started: 2026-05-29T02:50:00Z
updated: 2026-05-29T02:50:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Saisie de relevé compteur depuis /actifs

expected: Toast vert "Relevé enregistré — compteur et plans mis à jour" s'affiche ; AssetMeter.value = nouvelle valeur en DB ; nextMeterValue recalculé sur tous les plans meter_based liés à l'actif
result: [pending]

### 2. Rejet de valeur invalide dans AssetMeterSection

expected: Saisir -5 ou "abc" → Toast rouge "Valeur invalide — entrez un nombre positif" sans aucun appel réseau
result: [pending]

### 3. Déclenchement automatique du cron compteur (end-to-end)

expected: PM meter_based avec nextMeterValue=1000 sur actif avec value=1500 → GET /api/cron/meter-threshold-check avec Bearer CRON_SECRET → triggered=1, BT créé, nextMeterValue=2000. Second appel → triggered=0 (idempotence)
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
