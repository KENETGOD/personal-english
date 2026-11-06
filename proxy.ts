import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/security/csp";
import { isPrivatePath } from "@/lib/security/routes";
import { hardenCookie } from "@/lib/supabase/cookie-options";

// Convenience layer only: refreshes the session, redirects anonymous users, sets the CSP.
// Access control is enforced again in requireUser() and by RLS (docs/08 section 4.2).
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === "development",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  });
  // Report-Only for the first week (docs/08 section 4.5); Next reads the nonce from either header.
  const CSP_HEADER = "Content-Security-Policy-Report-Only";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(CSP_HEADER, csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, cacheHeaders) {
          for (const { name, value } of cookiesToSet)
            request.cookies.set(name, value);
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, hardenCookie(options));
          }
          for (const [key, value] of Object.entries(cacheHeaders)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Validates the JWT and refreshes it when needed.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && isPrivatePath(request.nextUrl.pathname)) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    // Keep refreshed/cleared auth cookies on the redirect.
    for (const cookie of response.cookies.getAll())
      redirect.cookies.set(cookie);
    redirect.headers.set(CSP_HEADER, csp);
    return redirect;
  }

  response.headers.set(CSP_HEADER, csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
