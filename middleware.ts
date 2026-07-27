import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/edge";
import {
  canAccessRoute,
  getDefaultDashboardPath,
  isPublicPath,
  mustForcePasswordChange,
  PASSWORD_CHANGE_PATH,
} from "@/lib/auth/routes";

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;
  const isLoggedIn = Boolean(session?.user);

  if (isPublicPath(pathname)) {
    if (isLoggedIn && (pathname === "/login" || pathname === "/login/two-factor")) {
      const destination = session!.user.mustChangePassword
        ? PASSWORD_CHANGE_PATH
        : getDefaultDashboardPath(session!.user);

      return NextResponse.redirect(new URL(destination, request.url));
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

  if (mustForcePasswordChange(pathname, session!.user)) {
    return NextResponse.redirect(new URL(PASSWORD_CHANGE_PATH, request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(getDefaultDashboardPath(session!.user), request.url)
    );
  }

  if (
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/audit") ||
      pathname.startsWith("/clients") ||
      pathname.startsWith("/revenues") ||
      pathname.startsWith("/expenses")) &&
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
