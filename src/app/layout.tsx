import type { Metadata, Viewport } from "next"
import { IBM_Plex_Sans, IBM_Plex_Mono, Newsreader } from "next/font/google"
import { Toaster } from "sonner"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import "./globals.css"

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
})

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
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
  themeColor: "#ECE7D8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Toaster richColors position="top-right" />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
