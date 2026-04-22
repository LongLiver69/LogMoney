import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes - skip auth check
  const publicRoutes = ["/login"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isApiAuth = pathname.startsWith("/api/auth");

  if (isPublicRoute || isApiAuth) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/expenses", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
