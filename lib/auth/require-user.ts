import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Data access gate for private pages and Server Actions. Validates the user with the Auth
 * server (never getSession) and requires AAL2 when the user has a verified TOTP factor.
 */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const totpFactor = user.factors?.find(
    (f) => f.factor_type === "totp" && f.status === "verified",
  );
  if (totpFactor) {
    const { data } = await supabase.auth.getClaims();
    if (data?.claims.aal !== "aal2") redirect("/mfa-challenge");
  }
  return { supabase, user, totpFactorId: totpFactor?.id ?? null };
});
