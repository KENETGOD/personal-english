import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email());

// Mirrors supabase/config.toml: min 12, lower + upper + digits. 72 is the bcrypt byte limit.
export const newPasswordSchema = z
  .string()
  .min(12, "La contraseña debe tener al menos 12 caracteres.")
  .max(72, "La contraseña no puede superar 72 caracteres.")
  .regex(/[a-z]/, "Incluye al menos una letra minúscula.")
  .regex(/[A-Z]/, "Incluye al menos una letra mayúscula.")
  .regex(/[0-9]/, "Incluye al menos un número.");

export const signUpSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: newPasswordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden.",
  });

export const totpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Ingresa los 6 dígitos del código.");

export const verifyTotpSchema = z.object({
  factorId: z.uuid(),
  code: totpCodeSchema,
});

export const disableTotpSchema = z.object({
  factorId: z.uuid(),
  password: z.string().min(1).max(72),
});
