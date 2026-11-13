import { connection } from "next/server";
import { GoalRing } from "@/components/home/goal-ring";
import { ModeGrid } from "@/components/home/mode-grid";
import { ReviewsCard } from "@/components/home/reviews-card";
import { StreakHeader } from "@/components/home/streak-header";
import { requireUser } from "@/lib/auth/require-user";
import { goalProgress } from "@/lib/domain/goal-progress";
import { countDueCards } from "@/lib/supabase/due-cards";

export const metadata = { title: "Inicio · English Coach" };

export default async function HomePage() {
  // Session reads use Date.now(), which Next forbids while prerendering.
  await connection();
  const { supabase } = await requireUser();
  // settle_streak first: it applies pending freezes/breaks that today_progress then reflects.
  const streak = await supabase.rpc("settle_streak");
  const today = await supabase.rpc("today_progress").single();
  const due = await countDueCards(supabase);
  if (streak.error || today.error) throw new Error("Could not load progress");

  const progress = goalProgress({
    activeSeconds: today.data.active_seconds,
    goalMinutes: today.data.goal_minutes,
    status: today.data.status,
  });

  return (
    <main className="mx-auto flex w-full max-w-[40rem] flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="sr-only">Inicio</h1>
      <StreakHeader
        streak={streak.data.current_streak}
        freezes={streak.data.freezes_available}
        xp={today.data.xp}
      />
      <GoalRing progress={progress} />
      <ModeGrid />
      <ReviewsCard count={due} />
    </main>
  );
}
