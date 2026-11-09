import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing route of the email links (token_hash flow, see supabase/templates).
// Destinations are fixed per link type, so there is no open redirect.
const DESTINATIONS = {
  email: "/home",
  recovery: "/reset-password",
} as const;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (tokenHash && (type === "email" || type === "recovery")) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error)
      return NextResponse.redirect(new URL(DESTINATIONS[type], request.url));
  }
  return NextResponse.redirect(new URL("/login?error=link", request.url));
}
