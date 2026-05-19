import { cn } from "@/lib/utils"

interface KorviaLogoProps {
  variant?: "color" | "white" | "dark"
  size?: number
  showWordmark?: boolean
  className?: string
}

/**
 * Logo Korvia — symbole K géométrique + wordmark "Korvia".
 *
 * Variantes :
 * - "color" : symbole ambre (#E8830C), wordmark adapté au fond
 * - "white" : tout blanc (sur fond sombre)
 * - "dark"  : tout navy (sur fond clair / documents)
 *
 * Conforme UI-SPEC Phase 1 : viewBox 0 0 32 32, fill uniquement,
 * pas de stroke, accessible (role=img + title).
 */
export function KorviaLogo({
  variant = "color",
  size = 32,
  showWordmark = true,
  className,
}: KorviaLogoProps) {
  // Couleur du symbole K selon variante
  const symbolColor =
    variant === "color" ? "#E8830C" :
    variant === "white" ? "#FFFFFF" :
    "#0F1C2E"

  // Couleur du wordmark "Korvia"
  // - color : navy par défaut (lisible sur fond clair) ; sur fond sombre, le parent applique text-foreground
  // - white : blanc
  // - dark  : navy
  const wordmarkColor =
    variant === "white" ? "#FFFFFF" :
    variant === "dark" ? "#0F1C2E" :
    "currentColor"

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-label="Korvia"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden={showWordmark ? "true" : undefined}
      >
        <title>Logo Korvia</title>
        {/* Barre verticale du K — rect plein 30% largeur (6px sur 20px utile) */}
        <rect x="6" y="6" width="6" height="20" fill={symbolColor} />
        {/* Diagonale supérieure du K — pointe effilée haut-droit, 35° */}
        <polygon
          points="12,15 22,6 26,6 14,18"
          fill={symbolColor}
        />
        {/* Diagonale inférieure du K — légèrement plus épaisse pour ancrage visuel, -35° */}
        <polygon
          points="12,15 14,14 26,26 22,26"
          fill={symbolColor}
        />
      </svg>
      {showWordmark && (
        <span
          style={{ color: wordmarkColor }}
          className="font-bold text-lg tracking-[-0.02em] leading-none"
        >
          Korvia
        </span>
      )}
    </span>
  )
}
