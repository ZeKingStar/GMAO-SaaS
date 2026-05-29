import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/tarifs(.*)",
  "/fonctionnalites(.*)",
  "/a-propos(.*)",
  "/aide(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/v1(.*)",
  "/api/docs(.*)",
  "/api/openapi.json",
  "/api/qr(.*)",
  "/portail(.*)",
  "/api/portal(.*)",
  "/api/cron(.*)",
  "/manifest.webmanifest",
])

export const proxy = clerkMiddleware(async (auth, req) => {
  const host = req.headers.get('host') || ''
  if (host.startsWith('app.') && req.nextUrl.pathname === '/') {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
