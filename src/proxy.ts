import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";
import { isLoopbackHost, isVideoLabLocalAccessEnabled } from "@/lib/auth/video-lab-local-access";

const PUBLIC_PATHS = ["/", "/login", "/register", "/plans", "/forgot-password", "/reset-password", "/calendar-preview", "/services", "/who-we-help", "/our-work", "/how-it-works", "/about", "/assessment"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname === "/nails/login" ||
    pathname === "/nails/demo" ||
    pathname === "/demo" ||
    pathname.startsWith("/legal/") ||
    pathname.startsWith("/our-work/") ||
    pathname.startsWith("/demo/") ||
    pathname === "/partners" ||
    pathname === "/partners/demo" ||
    pathname.startsWith("/partners/trial") ||
    pathname === "/restaurant/request" ||
    /^\/restaurant\/request\/[a-f0-9]{48}$/.test(pathname);

  const localVideoLab = pathname === "/admin/video-lab"
    && isVideoLabLocalAccessEnabled()
    && isLoopbackHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));

  if (!session && !isPublic && !localVideoLab) {
    const url = new URL(pathname === "/nails" || pathname.startsWith("/nails/") ? "/nails/login" : "/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|assets/|visual/|brand/|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)"],
};
