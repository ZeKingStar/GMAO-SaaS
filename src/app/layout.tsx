import type { Metadata, Viewport } from "next"
import { Geist, Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { frFR } from "@clerk/localizations"
import { Toaster } from "sonner"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "Korvia — GMAO pour PME québécoises", template: "%s | Korvia" },
  description: "Gérez vos actifs, bons de travail et maintenance préventive en français.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Korvia",
  },
}

export const viewport: Viewport = {
  themeColor: "#0F1C2E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR} afterSignOutUrl="/sign-in">
      <html lang="fr" className={`${geistSans.variable} ${inter.variable} h-full antialiased`}>
        <body className="min-h-full bg-background text-foreground">
          {children}
          <Toaster richColors position="top-right" />
          <ServiceWorkerRegister />
        </body>
      </html>
    </ClerkProvider>
  )
}
