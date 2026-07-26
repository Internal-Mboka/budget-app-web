import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/edge";
import { canAccessRoute, getDefaultDashboardPath, isPublicPath } from "@/lib/auth/routes";

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;
  const isLoggedIn = Boolean(session?.user);

  if (isPublicPath(pathname)) {
    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(
        new URL(getDefaultDashboardPath(session!.user), request.url)
      );
    }

    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);

    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(getDefaultDashboardPath(session!.user), request.url)
    );
  }

  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) &&
    !canAccessRoute(pathname, session!.user.permissions)
  ) {
    return NextResponse.redirect(
      new URL(getDefaultDashboardPath(session!.user), request.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|sw.js|workbox-.*\\.js|photos).*)",
  ],
};
