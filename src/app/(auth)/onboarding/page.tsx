"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOrganizationList } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const INDUSTRIES = [
  { value: "manufacturing", label: "Manufacturier / Industriel" },
  { value: "real_estate", label: "Immobilier / Gestion d'immeubles" },
  { value: "municipal", label: "Municipal / Para-public" },
  { value: "hospitality", label: "Hôtellerie / Restauration" },
  { value: "healthcare", label: "Santé / Établissements de soins" },
  { value: "retail", label: "Commerce de détail" },
  { value: "other", label: "Autre" },
]

const SIZES = [
  { value: "1-10", label: "1 à 10 employés" },
  { value: "11-50", label: "11 à 50 employés" },
  { value: "51-200", label: "51 à 200 employés" },
  { value: "200+", label: "200+ employés" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { createOrganization, setActive } = useOrganizationList()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    industry: "",
    size: "",
  })

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error("Le nom de l'organisation est requis")
      return
    }
    if (!createOrganization || !setActive) return

    setLoading(true)
    try {
      const org = await createOrganization({ name: form.name })
      await setActive({ organization: org.id })

      await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: org.id,
          name: form.name,
          industry: form.industry,
          size: form.size,
        }),
      })

      router.push("/dashboard")
    } catch {
      toast.error("Une erreur s'est produite. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-4xl">🔧</div>
          <CardTitle className="text-2xl">Bienvenue dans votre GMAO</CardTitle>
          <CardDescription>
            Configurons votre organisation en quelques étapes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de votre organisation *</Label>
                <Input
                  id="name"
                  placeholder="Ex : Usine Métallurgie Dupont inc."
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Secteur d'activité</Label>
                <div className="grid grid-cols-1 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, industry: ind.value }))}
                      className={`text-left px-4 py-2 rounded-md border text-sm transition-colors ${
                        form.industry === ind.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!form.name.trim()}
              >
                Continuer
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Taille de votre entreprise</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, size: s.value }))}
                      className={`px-4 py-3 rounded-md border text-sm transition-colors ${
                        form.size === s.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Retour
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={loading}
                >
                  {loading ? "Création..." : "Créer mon organisation"}
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Étape {step} sur 2
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
