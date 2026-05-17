'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateOrganization } from '@/actions/settings'

const SELECT_CLASS = 'w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

const INDUSTRIES = [
  'Fabrication / Manufacturier',
  'Construction',
  'Transport et logistique',
  'Énergie et services publics',
  'Alimentation et boissons',
  'Pharmaceutique',
  'Municipal / Gouvernement',
  'Hôtellerie et restauration',
  'Autre',
]

const SIZES = [
  { value: '1-10', label: '1–10 employés' },
  { value: '11-50', label: '11–50 employés' },
  { value: '51-200', label: '51–200 employés' },
  { value: '201-500', label: '201–500 employés' },
  { value: '500+', label: '500+ employés' },
]

type Props = {
  org: { name: string; industry: string | null; size: string | null }
}

export function OrgSettingsForm({ org }: Props) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: org.name,
    industry: org.industry ?? '',
    size: org.size ?? '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }
    startTransition(async () => {
      try {
        await updateOrganization({ name: form.name, industry: form.industry, size: form.size })
        toast.success('Organisation mise à jour')
      } catch {
        toast.error('Erreur lors de la mise à jour')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Nom de l&apos;organisation *</Label>
        <Input
          id="org-name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Ex : Entreprise Tremblay inc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="org-industry">Secteur d&apos;activité</Label>
          <select
            id="org-industry"
            value={form.industry}
            onChange={e => set('industry', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">— Sélectionner —</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-size">Taille</Label>
          <select
            id="org-size"
            value={form.size}
            onChange={e => set('size', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">— Sélectionner —</option>
            {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement...' : 'Sauvegarder'}
        </Button>
      </div>
    </form>
  )
}
