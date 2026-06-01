"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/better-auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const schema = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Courriel invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
})

type FormData = z.infer<typeof schema>

export default function SignUpPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const result = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    })
    if (result.error) {
      setServerError(
        result.error.code === "USER_ALREADY_EXISTS"
          ? "Un compte existe déjà avec ce courriel"
          : "Une erreur s'est produite. Veuillez réessayer."
      )
      return
    }
    router.push("/onboarding")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>
            14 jours d&apos;essai gratuit — sans carte de crédit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                type="text"
                placeholder="Marie Tremblay"
                autoComplete="name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Courriel</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@entreprise.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 caractères"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-destructive text-center">{serverError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Création…" : "Créer mon compte"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Déjà un compte?{" "}
            <Link href="/sign-in" className="text-primary hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
