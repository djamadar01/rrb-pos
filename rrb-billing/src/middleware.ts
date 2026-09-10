import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const secret = process.env.NEXTAUTH_SECRET || "super-secret-key-1234567890-rrb-billing";

  // Attempt to read JWT token from request
  let token = await getToken({ req, secret });

  // Fallback check for non-prefix cookie name if behind reverse proxy
  if (!token) {
    token = await getToken({ req, secret, cookieName: "next-auth.session-token" });
  }
  if (!token) {
    token = await getToken({ req, secret, cookieName: "__Secure-next-auth.session-token" });
  }

  // Protect /owner routes: must be authenticated and have role === "OWNER"
  if (path.startsWith("/owner")) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }

    if (token.role !== "OWNER") {
      const url = req.nextUrl.clone();
      url.pathname = "/pos";
      return NextResponse.redirect(url);
    }
  }

  // Protect /pos routes: must be authenticated staff
  if (path.startsWith("/pos")) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/pos/:path*"],
};
