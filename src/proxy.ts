import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

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
])

export const proxy = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
