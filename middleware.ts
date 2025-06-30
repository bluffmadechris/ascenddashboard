import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const currentUser = request.cookies.get("user")?.value

  // If the user is not logged in and trying to access a protected route
  if (!currentUser && request.nextUrl.pathname.startsWith("/(dashboard)")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is logged in, check for restricted access
  if (currentUser) {
    const user = JSON.parse(currentUser)

    // If employee role trying to access general clients page, redirect to their specific client
    if (user.role === "employee" && request.nextUrl.pathname === "/clients") {
      const allowedClient = user.clientAccess.find((access: any) => access.canView)
      if (allowedClient) {
        return NextResponse.redirect(new URL(`/clients/${allowedClient.clientId}`, request.url))
      }
    }

    // If employee role trying to access contracts or onboarding, redirect to dashboard
    if (
      user.role === "employee" &&
      (request.nextUrl.pathname === "/contracts" || request.nextUrl.pathname === "/onboarding")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // If employee trying to access a client they don't have access to
    if (user.role === "employee" && request.nextUrl.pathname.startsWith("/clients/")) {
      const clientId = request.nextUrl.pathname.split("/")[2]
      const hasAccess = user.clientAccess.some((access: any) => access.clientId === clientId && access.canView)

      if (!hasAccess) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}
