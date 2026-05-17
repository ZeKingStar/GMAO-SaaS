import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { frFR } from "@clerk/localizations"
import { Toaster } from "sonner"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: { default: "GMAO", template: "%s | GMAO" },
  description: "Logiciel de gestion de maintenance assistée par ordinateur pour PME québécoises",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GMAO",
  },
}

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR} afterSignOutUrl="/sign-in">
      <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
        <body className="min-h-full bg-background text-foreground">
          {children}
          <Toaster richColors position="top-right" />
          <ServiceWorkerRegister />
        </body>
      </html>
    </ClerkProvider>
  )
}
