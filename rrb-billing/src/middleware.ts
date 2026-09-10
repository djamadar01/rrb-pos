import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Protect /owner routes: must be authenticated and have role === "OWNER"
  if (path.startsWith("/owner")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
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
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
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
