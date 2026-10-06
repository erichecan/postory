import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

const PUBLIC_PATHS = ["/", "/login", "/register", "/plans", "/forgot-password", "/reset-password", "/calendar-preview", "/services", "/who-we-help", "/our-work", "/how-it-works", "/about", "/assessment"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/legal/") || pathname.startsWith("/our-work/") || pathname.startsWith("/demo/");

  if (!session && !isPublic) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|assets/|visual/|brand/|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)"],
};
