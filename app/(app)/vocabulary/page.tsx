import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ReviewFlow } from "@/components/vocabulary/review-flow";
import { requireUser } from "@/lib/auth/require-user";
import { buildReviewCard, type ReviewCard } from "@/lib/domain/review-cards";

export const metadata = { title: "Repaso · English Coach" };

// Spec gives no session size; getDueCards defaults to 20 (docs/07 section 2.3).
const SESSION_LIMIT = 20;

export default function ReviewPage() {
  return (
    <main className="mx-auto flex w-full max-w-[40rem] flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="text-display">Repaso</h1>
      <Suspense fallback={<p role="status">Cargando…</p>}>
        <Review />
      </Suspense>
    </main>
  );
}

async function Review() {
  // Due dates compare against Date.now(), which Next forbids while prerendering.
  await connection();
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("srs_cards")
    .select("id, stability, reps, content_items(payload)")
    .eq("card_type", "vocab")
    .eq("suspended", false)
    .lte("due", new Date().toISOString())
    .order("due")
    .limit(SESSION_LIMIT);
  if (error) throw new Error("Could not load reviews");

  const cards = data.flatMap((row) => {
    const built = buildReviewCard(row, row.content_items?.payload);
    return built ? [built.card satisfies ReviewCard] : [];
  });

  if (cards.length > 0) return <ReviewFlow cards={cards} />;
  return (
    <p>
      No tienes repasos por ahora. Aprende{" "}
      <Link href="/vocabulary/new" className="font-bold underline">
        palabras nuevas
      </Link>{" "}
      y volverán aquí cuando toque repasarlas.
    </p>
  );
}
