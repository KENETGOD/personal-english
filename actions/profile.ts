"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { settingsSchema } from "@/lib/validation/profile";
import { fail, validationFail, type FormState } from "./result";

/** Saves the whole settings form: safe columns directly, timezone and goal via guarded functions. */
export async function saveSettings(
  _: FormState,
  fd: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const parsed = settingsSchema.safeParse({
    displayName: fd.get("displayName") ?? "",
    timezone: fd.get("timezone") ?? "",
    dailyGoal: fd.get("dailyGoal") ?? "",
    accent: fd.get("accent") ?? "",
    playbackRate: fd.get("playbackRate") ?? "",
    interests: fd.getAll("interests"),
  });
  if (!parsed.success) return validationFail(parsed.error);
  const s = parsed.data;

  const { data: current } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: s.displayName || null,
      accent: s.accent,
      playback_rate: s.playbackRate,
      interests: s.interests,
    })
    .eq("id", user.id);
  if (error) {
    console.error("profile update failed", error.code);
    return fail("INTERNAL_ERROR", "No se pudieron guardar los cambios.");
  }

  const { error: goalError } = await supabase.rpc("change_daily_goal", {
    p_minutes: s.dailyGoal,
  });
  if (goalError) {
    console.error("change_daily_goal failed", goalError.code);
    return fail("INTERNAL_ERROR", "No se pudo cambiar la meta diaria.");
  }

  if (s.timezone !== current?.timezone) {
    const { error: tzError } = await supabase.rpc("change_timezone", {
      p_timezone: s.timezone,
    });
    if (tzError) {
      return fail(
        "VALIDATION_ERROR",
        tzError.message.includes("timezone_change_too_soon")
          ? "Solo puedes cambiar la zona horaria una vez cada 7 días."
          : "No se pudo cambiar la zona horaria.",
      );
    }
  }

  revalidatePath("/settings");
  return { ok: true, data: undefined };
}
