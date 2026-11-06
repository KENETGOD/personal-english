"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";
import { fail, validationFail, type FormState } from "./result";

const field = (fd: FormData, name: string) => fd.get(name) ?? "";

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    email: field(fd, "email"),
    password: field(fd, "password"),
  });
  if (!parsed.success) return validationFail(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(parsed.data);
  // Same answer whether or not the email already exists (no account enumeration).
  if (error && error.status !== 422) {
    console.error("signUp failed", error.code);
    return fail(
      "INTERNAL_ERROR",
      "No se pudo completar el registro. Inténtalo de nuevo.",
    );
  }
  return {
    ok: true,
    data: {
      message:
        "Si el correo puede registrarse, te enviamos un enlace de verificación. Revisa tu bandeja de entrada.",
    },
  };
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: field(fd, "email"),
    password: field(fd, "password"),
  });
  const generic = fail("UNAUTHENTICATED", "Correo o contraseña incorrectos.");
  if (!parsed.success) return generic;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Unconfirmed email and bad credentials look identical to the caller.
  if (error) return generic;

  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  redirect(
    data?.nextLevel === "aal2" && data.currentLevel !== "aal2"
      ? "/mfa-challenge"
      : "/settings",
  );
}

export async function requestPasswordReset(
  _: FormState,
  fd: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: field(fd, "email") });
  if (parsed.success) {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
    );
    if (error) console.error("resetPasswordForEmail failed", error.code);
  }
  // Identical response for any outcome (RF-AUTH-03).
  return {
    ok: true,
    data: {
      message:
        "Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.",
    },
  };
}

export async function resetPassword(
  _: FormState,
  fd: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: field(fd, "password"),
    confirm: field(fd, "confirm"),
  });
  if (!parsed.success) return validationFail(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return fail("UNAUTHENTICATED", "El enlace expiró. Solicita uno nuevo.");

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    console.error("updateUser(password) failed", error.code);
    return fail(
      "INTERNAL_ERROR",
      "No se pudo actualizar la contraseña. Solicita un enlace nuevo.",
    );
  }
  redirect("/settings");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
