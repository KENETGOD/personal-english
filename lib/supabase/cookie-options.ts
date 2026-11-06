import type { CookieOptions } from "@supabase/ssr";

/** RNF-SEC-01: the session lives in HttpOnly, SameSite=Lax cookies (and Secure in production). */
export function hardenCookie(options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}
