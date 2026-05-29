/**
 * Seed script — synthetic data for "Package Pie" organization
 * Run: npx tsx scripts/seed-package-pie.ts
 */
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, WorkOrderStatus, WorkOrderType, WorkOrderPriority } from '../src/generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 3600 * 1000)
}

async function main() {
  // 1. Find Package Pie org
  const org = await db.organization.findFirst({
    where: { name: { contains: 'Package', mode: 'insensitive' } },
    include: { members: true },
  })

  if (!org) {
    console.error('❌ Organisation "Package Pie" introuvable')
    process.exit(1)
  }
  console.log(`✓ Org trouvée: ${org.name} (${org.id}) — plan: ${org.plan}`)

  const members = org.members
  if (members.length === 0) {
    console.error('❌ Aucun membre dans cette organisation')
    process.exit(1)
  }
  console.log(`✓ ${members.length} membre(s): ${members.map(m => m.email).join(', ')}`)

  // Set hourly rates on members for FIAB-03
  for (const m of members) {
    await db.membership.update({
      where: { id: m.id },
      data: { hourlyRate: 65 },
    })
  }
  console.log('✓ Taux horaire 65 $/h configuré sur tous les membres')

  // 2. Asset categories
  const cats = await Promise.all([
    db.assetCategory.upsert({
      where: { id: 'seed-cat-conv' },
      create: { id: 'seed-cat-conv', organizationId: org.id, name: 'Convoyeur', icon: 'conveyor-belt' },
      update: {},
    }),
    db.assetCategory.upsert({
      where: { id: 'seed-cat-robot' },
      create: { id: 'seed-cat-robot', organizationId: org.id, name: 'Robot', icon: 'cpu' },
      update: {},
    }),
    db.assetCategory.upsert({
      where: { id: 'seed-cat-comp' },
      create: { id: 'seed-cat-comp', organizationId: org.id, name: 'Compresseur', icon: 'wind' },
      update: {},
    }),
  ])
  console.log('✓ 3 catégories d\'actifs créées')

  // 3. Assets
  const assets = await Promise.all([
    db.asset.upsert({
      where: { id: 'seed-asset-conv1' },
      create: { id: 'seed-asset-conv1', organizationId: org.id, name: 'Convoyeur ligne A', categoryId: cats[0].id, serialNumber: 'CONV-2021-001' },
      update: {},
    }),
    db.asset.upsert({
      where: { id: 'seed-asset-conv2' },
      create: { id: 'seed-asset-conv2', organizationId: org.id, name: 'Convoyeur ligne B', categoryId: cats[0].id, serialNumber: 'CONV-2021-002' },
      update: {},
    }),
    db.asset.upsert({
      where: { id: 'seed-asset-robot1' },
      create: { id: 'seed-asset-robot1', organizationId: org.id, name: 'Robot de palettisation #1', categoryId: cats[1].id, serialNumber: 'ROB-2022-001' },
      update: {},
    }),
    db.asset.upsert({
      where: { id: 'seed-asset-robot2' },
      create: { id: 'seed-asset-robot2', organizationId: org.id, name: 'Robot de palettisation #2', categoryId: cats[1].id, serialNumber: 'ROB-2022-002' },
      update: {},
    }),
    db.asset.upsert({
      where: { id: 'seed-asset-comp1' },
      create: { id: 'seed-asset-comp1', organizationId: org.id, name: 'Compresseur principal', categoryId: cats[2].id, serialNumber: 'COMP-2020-001' },
      update: {},
    }),
  ])
  console.log('✓ 5 actifs créés')

  // Helper: get next WO number
  async function nextWONumber() {
    const last = await db.workOrder.findFirst({
      where: { organizationId: org.id },
      orderBy: { number: 'desc' },
      select: { number: true },
    })
    return (last?.number ?? 0) + 1
  }

  // 4. Work orders — mix of types, statuses, fault codes for analytics
  type WOSeed = {
    id: string
    asset: (typeof assets)[number]
    title: string
    type: WorkOrderType
    status: WorkOrderStatus
    priority: WorkOrderPriority
    faultCategory?: string
    faultProblem?: string
    faultCause?: string
    faultRemedy?: string
    estimatedHours: number
    daysAgoCreated: number
    daysAgoCompleted?: number
    laborMinutes?: number
    parts?: { name: string; qty: number; cost: number }[]
  }

  const woSeeds: WOSeed[] = [
    // Convoyeur A — récurrent: courroie usée
    {
      id: 'seed-wo-1', asset: assets[0], title: 'Remplacement courroie convoyeur A',
      type: WorkOrderType.corrective, status: WorkOrderStatus.closed, priority: WorkOrderPriority.high,
      faultCategory: 'Mécanique', faultProblem: 'Courroie usée', faultCause: 'Usure normale', faultRemedy: 'Remplacement courroie V-belt',
      estimatedHours: 3, daysAgoCreated: 90, daysAgoCompleted: 89,
      laborMinutes: 195, parts: [{ name: 'Courroie V-belt 1250mm', qty: 2, cost: 38 }],
    },
    {
      id: 'seed-wo-2', asset: assets[0], title: 'Convoyeur A — courroie détendue',
      type: WorkOrderType.corrective, status: WorkOrderStatus.closed, priority: WorkOrderPriority.medium,
      faultCategory: 'Mécanique', faultProblem: 'Courroie usée', faultCause: 'Tension insuffisante', faultRemedy: 'Réglage tension + remplacement',
      estimatedHours: 2, daysAgoCreated: 55, daysAgoCompleted: 54,
      laborMinutes: 140, parts: [{ name: 'Courroie V-belt 1250mm', qty: 1, cost: 38 }],
    },
    {
      id: 'seed-wo-3', asset: assets[0], title: 'Convoyeur A — bruit roulement',
      type: WorkOrderType.corrective, status: WorkOrderStatus.closed, priority: WorkOrderPriority.medium,
      faultCategory: 'Mécanique', faultProblem: 'Roulement défectueux', faultCause: 'Manque de lubrification', faultRemedy: 'Graissage roulement + remplacement',
      estimatedHours: 2, daysAgoCreated: 25, daysAgoCompleted: 24,
      laborMinutes: 120, parts: [{ name: 'Roulement 6205-2RS', qty: 2, cost: 22 }],
    },
    // Convoyeur B
    {
      id: 'seed-wo-4', asset: assets[1], title: 'Convoyeur B — capteur de fin de course HS',
      type: WorkOrderType.corrective, status: WorkOrderStatus.closed, priority: WorkOrderPriority.high,
      faultCategory: 'Électrique', faultProblem: 'Capteur défectueux', faultCause: 'Court-circuit', faultRemedy: 'Remplacement capteur inductif',
      estimatedHours: 1.5, daysAgoCreated: 70, daysAgoCompleted: 70,
      laborMinutes: 90, parts: [{ name: 'Capteur inductif M12', qty: 1, cost: 45 }],
    },
    {
      id: 'seed-wo-5', asset: assets[1], title: 'Convoyeur B — courroie glisse',
      type: WorkOrderType.corrective, status: WorkOrderStatus.closed, priority: WorkOrderPriority.medium,
      faultCategory: 'Mécanique', faultProblem: 'Courroie usée', faultCause: 'Contamination huile', faultRemedy: 'Nettoyage + remplacement courroie',
      estimatedHours: 2.5, daysAgoCreated: 20, daysAgoCompleted: 19,
      laborMinutes: 165, parts: [{ name: 'Courroie V-belt 1250mm', qty: 1, cost: 38 }, { name: 'Dégraissant industriel', qty: 1, cost: 12 }],
    },
    // Robot 1
    {
      id: 'seed-wo-6', asset: assets[2], title: 'Robot #1 — défaut axe J2',
      type: WorkOrderType.corrective, status: WorkOrderStatus.closed, priority: WorkOrderPriority.urgent,
      faultCategory: 'Mécanique', faultProblem: 'Jeu excessif articulation', faultCause: 'Usure réducteur', faultRemedy: 'Remplacement réducteur axe J2',
      estimatedHours: 8, daysAgoCreated: 60, daysAgoCompleted: 57,
      laborMinutes: 540, parts: [{ name: 'Réducteur Nabtesco RV-40E', qty: 1, cost: 1850 }],
    },
    {
      id: 'seed-wo-7', asset: assets[2], title: 'Robot #1 — maintenance préventive annuelle',
      type: WorkOrderType.preventive, status: WorkOrderStatus.closed, priority: WorkOrderPriority.medium,
      faultCategory: undefined, faultProblem: undefined, faultCause: undefined, faultRemedy: undefined,
      estimatedHours: 6, daysAgoCreated: 45, daysAgoCompleted: 43,
      laborMinutes: 370,
    },
    {
      id: 'seed-wo-8', asset: assets[2], title: 'Robot #1 — vibrations anormales',
      type: WorkOrderType.corrective, status: WorkOrderStatus.closed, priority: WorkOrderPriority.high,
      faultCategory: 'Mécanique', faultProblem: 'Jeu excessif articulation', faultCause: 'Boulon desserré', faultRemedy: 'Serrage + vérification alignement',
      estimatedHours: 3, daysAgoCreated: 15, daysAgoCompleted: 15,
      laborMinutes: 180,
    },
    // Robot 2
    {
      id: 'seed-wo-9', asset: assets[3], title: 'Robot #2 — erreur programme position',
      type: WorkOrderType.corrective, status: WorkOrderStatus.closed, priority: WorkOrderPriority.high,
      faultCategory: 'Logiciel', faultProblem: 'Erreur de programme', faultCause: 'Décalage référentiel', faultRemedy: 'Recalibration + mise à jour programme',
      estimatedHours: 4, daysAgoCreated: 80, daysAgoCompleted: 79,
      laborMinutes: 250,
    },
    {
      id: 'seed-wo-10', asset: assets[3], title: 'Robot #2 — axe J4 bruit inhabituel',
      type: WorkOrderType.corrective, status: WorkOrderStatus.in_progress, priority: WorkOrderPriority.medium,
      faultCategory: 'Mécanique', faultProblem: 'Roulement défectueux', faultCause: 'En cours de diagnostic', faultRemedy: undefined,
      estimatedHours: 5, daysAgoCreated: 3,
      laborMinutes: 60,
    },
    // Compresseur
    {
      id: 'seed-wo-11', asset: assets[4], title: 'Compresseur — chute pression',
      type: WorkOrderType.corrective, status: WorkOrderStatus.closed, priority: WorkOrderPriority.urgent,
      faultCategory: 'Pneumatique', faultProblem: 'Fuite air comprimé', faultCause: 'Joint torique percé', faultRemedy: 'Remplacement joint + test pression',
      estimatedHours: 2, daysAgoCreated: 100, daysAgoCompleted: 99,
      laborMinutes: 130, parts: [{ name: 'Kit joints toriques 50pc', qty: 1, cost: 28 }],
    },
    {
      id: 'seed-wo-12', asset: assets[4], title: 'Compresseur — fuite huile carter',
      type: WorkOrderType.corrective, status: WorkOrderStatus.closed, priority: WorkOrderPriority.high,
      faultCategory: 'Pneumatique', faultProblem: 'Fuite huile', faultCause: 'Joint carter usé', faultRemedy: 'Remplacement joint carter',
      estimatedHours: 3, daysAgoCreated: 40, daysAgoCompleted: 39,
      laborMinutes: 200, parts: [{ name: 'Joint carter compresseur', qty: 1, cost: 65 }, { name: 'Huile compresseur 5L', qty: 1, cost: 42 }],
    },
    {
      id: 'seed-wo-13', asset: assets[4], title: 'Compresseur — inspection trimestrielle',
      type: WorkOrderType.inspection, status: WorkOrderStatus.closed, priority: WorkOrderPriority.low,
      estimatedHours: 1.5, daysAgoCreated: 10, daysAgoCompleted: 10,
      laborMinutes: 95,
    },
    // Open WOs
    {
      id: 'seed-wo-14', asset: assets[0], title: 'Convoyeur A — inspection roulements',
      type: WorkOrderType.preventive, status: WorkOrderStatus.open, priority: WorkOrderPriority.low,
      estimatedHours: 1, daysAgoCreated: 2,
    },
    {
      id: 'seed-wo-15', asset: assets[1], title: 'Convoyeur B — détecteur photoélectrique clignotant',
      type: WorkOrderType.corrective, status: WorkOrderStatus.open, priority: WorkOrderPriority.medium,
      faultCategory: 'Électrique', faultProblem: 'Capteur défectueux',
      estimatedHours: 1, daysAgoCreated: 1,
    },
  ]

  // Delete existing seed WOs to avoid duplicates
  await db.workOrder.deleteMany({ where: { id: { in: woSeeds.map(w => w.id) } } })

  const member = members[0]
  let created = 0

  for (const seed of woSeeds) {
    const num = await nextWONumber()
    const createdAt = daysAgo(seed.daysAgoCreated)
    const completedAt = seed.daysAgoCompleted != null ? daysAgo(seed.daysAgoCompleted) : null
    const startedAt = completedAt ? new Date(completedAt.getTime() - (seed.laborMinutes ?? 60) * 60 * 1000) : null

    const wo = await db.workOrder.create({
      data: {
        id: seed.id,
        organizationId: org.id,
        assetId: seed.asset.id,
        number: num,
        title: seed.title,
        type: seed.type,
        status: seed.status,
        priority: seed.priority,
        estimatedHours: seed.estimatedHours,
        faultCategory: seed.faultCategory,
        faultProblem: seed.faultProblem,
        faultCause: seed.faultCause,
        faultRemedy: seed.faultRemedy,
        startedAt,
        completedAt,
        createdAt,
        assignees: { create: [{ membershipId: member.id }] },
      },
    })

    // Time logs for closed/in-progress WOs
    if (seed.laborMinutes && (completedAt || seed.status === WorkOrderStatus.in_progress)) {
      const endTime = completedAt ?? hoursAgo(1)
      const startTime = new Date(endTime.getTime() - seed.laborMinutes * 60 * 1000)
      await db.workOrderTimeLog.create({
        data: {
          workOrderId: wo.id,
          membershipId: member.id,
          startedAt: startTime,
          endedAt: endTime,
          minutes: seed.laborMinutes,
        },
      })
    }

    // Parts
    if (seed.parts) {
      for (const p of seed.parts) {
        await db.workOrderPart.create({
          data: {
            workOrderId: wo.id,
            name: p.name,
            quantity: p.qty,
            unitCost: p.cost,
          },
        })
      }
    }

    created++
  }

  console.log(`✓ ${created} bons de travail créés avec timeLogs et pièces`)

  // Summary
  const woCount = await db.workOrder.count({ where: { organizationId: org.id } })
  const closedCount = await db.workOrder.count({ where: { organizationId: org.id, status: WorkOrderStatus.closed } })
  const timeLogCount = await db.workOrderTimeLog.count({ where: { workOrder: { organizationId: org.id } } })
  const partCount = await db.workOrderPart.count({ where: { workOrder: { organizationId: org.id } } })

  console.log(`\n📊 État final Package Pie:`)
  console.log(`   BTs total: ${woCount} (${closedCount} clôturés)`)
  console.log(`   Sessions temps: ${timeLogCount}`)
  console.log(`   Lignes pièces: ${partCount}`)
  console.log(`   Actifs: ${assets.length}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
