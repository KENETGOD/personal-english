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
      "display_name, timezone, daily_goal_minutes, pending_daily_goal, accent, playback_rate, interests, new_cards_per_day",
    )
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Profile not found");

  return (
    <main className="mx-auto flex w-full max-w-[40rem] flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="text-display">Ajustes</h1>
      <SettingsForm
        initial={{
          displayName: profile.display_name ?? "",
          timezone: profile.timezone,
          dailyGoal: profile.pending_daily_goal ?? profile.daily_goal_minutes,
          activeGoal: profile.daily_goal_minutes,
          accent: profile.accent,
          playbackRate: Number(profile.playback_rate) === 0.75 ? 0.75 : 1,
          newCardsPerDay: profile.new_cards_per_day,
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
