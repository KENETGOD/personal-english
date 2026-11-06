import { connection } from "next/server";
import { MfaPanel } from "@/components/settings/mfa-panel";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireUser } from "@/lib/auth/require-user";
import { INTERESTS } from "@/lib/validation/profile";

export const metadata = { title: "Ajustes · English Coach" };

export default async function SettingsPage() {
  // Session reads use Date.now(), which Next forbids while prerendering.
  await connection();
  const { supabase, user, totpFactorId } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, timezone, daily_goal_minutes, pending_daily_goal, accent, playback_rate, interests",
    )
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Profile not found");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-10 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
      <SettingsForm
        initial={{
          displayName: profile.display_name ?? "",
          timezone: profile.timezone,
          dailyGoal: profile.pending_daily_goal ?? profile.daily_goal_minutes,
          activeGoal: profile.daily_goal_minutes,
          accent: profile.accent,
          playbackRate: Number(profile.playback_rate) === 0.75 ? 0.75 : 1,
          interests: profile.interests.filter(
            (i): i is (typeof INTERESTS)[number] =>
              (INTERESTS as readonly string[]).includes(i),
          ),
        }}
        timezones={Intl.supportedValuesOf("timeZone")}
      />
      <MfaPanel factorId={totpFactorId} />
    </main>
  );
}
