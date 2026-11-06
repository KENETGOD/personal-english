"use server";

import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  disableTotpSchema,
  totpCodeSchema,
  verifyTotpSchema,
} from "@/lib/validation/auth";
import {
  fail,
  validationFail,
  type ActionResult,
  type FormState,
} from "./result";

export type EnrollState = ActionResult<{
  factorId: string;
  qrCode: string;
  secret: string;
}> | null;

const field = (fd: FormData, name: string) => fd.get(name) ?? "";
const BAD_CODE = "Código incorrecto o vencido.";

export async function enrollTotp(): Promise<EnrollState> {
  const { supabase } = await requireUser();

  // Drop abandoned enrollments so the user can always start over.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.factor_type === "totp" && f.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
  });
  if (error || !data) {
    console.error("mfa.enroll failed", error?.code);
    return fail(
      "INTERNAL_ERROR",
      "No se pudo iniciar la configuración. Inténtalo de nuevo.",
    );
  }
  return {
    ok: true,
    data: {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    },
  };
}

export async function verifyEnrollment(
  _: FormState,
  fd: FormData,
): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = verifyTotpSchema.safeParse({
    factorId: field(fd, "factorId"),
    code: field(fd, "code"),
  });
  if (!parsed.success) return validationFail(parsed.error);

  const { error } = await supabase.auth.mfa.challengeAndVerify(parsed.data);
  if (error) return fail("VALIDATION_ERROR", BAD_CODE);

  revalidatePath("/settings");
  return { ok: true, data: undefined };
}

/** Second step of login: upgrades an AAL1 session to AAL2. */
export async function verifyLogin(
  _: FormState,
  fd: FormData,
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const factor = user.factors?.find(
    (f) => f.factor_type === "totp" && f.status === "verified",
  );
  const code = totpCodeSchema.safeParse(field(fd, "code"));
  if (!factor || !code.success) return fail("VALIDATION_ERROR", BAD_CODE);

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: code.data,
  });
  if (error) return fail("VALIDATION_ERROR", BAD_CODE);
  redirect("/settings");
}

/** Requires an AAL2 session (requireUser) plus the account password. */
export async function disableTotp(
  _: FormState,
  fd: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const parsed = disableTotpSchema.safeParse({
    factorId: field(fd, "factorId"),
    password: field(fd, "password"),
  });
  if (!parsed.success) return validationFail(parsed.error);

  // Check the password on a throwaway client so the current session is left untouched.
  const checker = createStatelessClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: pwError } = await checker.auth.signInWithPassword({
    email: user.email ?? "",
    password: parsed.data.password,
  });
  if (pwError) return fail("UNAUTHENTICATED", "Contraseña incorrecta.");

  const { error } = await supabase.auth.mfa.unenroll({
    factorId: parsed.data.factorId,
  });
  if (error) {
    console.error("mfa.unenroll failed", error.code);
    return fail(
      "INTERNAL_ERROR",
      "No se pudo desactivar la verificación en dos pasos.",
    );
  }
  revalidatePath("/settings");
  return { ok: true, data: undefined };
}
