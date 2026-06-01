import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/better-auth"

const PUBLIC_PATHS = [
  "/",
  "/tarifs",
  "/fonctionnalites",
  "/a-propos",
  "/aide",
  "/sign-in",
  "/sign-up",
  "/api/auth",
  "/api/webhooks",
  "/api/v1",
  "/api/docs",
  "/api/openapi.json",
  "/api/qr",
  "/portail",
  "/api/portal",
  "/api/cron",
  "/manifest.webmanifest",
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?"))
}

export async function proxy(req: NextRequest) {
  const host = req.headers.get("host") || ""
  if (host.startsWith("app.") && req.nextUrl.pathname === "/") {
    const url = req.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  if (isPublicPath(req.nextUrl.pathname)) return NextResponse.next()

  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

