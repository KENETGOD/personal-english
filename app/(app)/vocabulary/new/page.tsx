import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { NewWordFlow } from "@/components/vocabulary/new-word-flow";
import { requireUser } from "@/lib/auth/require-user";
import { countDueCards } from "@/lib/supabase/due-cards";
import {
  OVERDUE_PAUSE_LIMIT,
  selectNewWords,
  toWord,
  type Word,
} from "@/lib/domain/new-words";

export const metadata = { title: "Palabras nuevas · English Coach" };

export default function NewWordsPage() {
  return (
    <main className="mx-auto flex w-full max-w-[40rem] flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="text-display">Palabras nuevas</h1>
      <Suspense fallback={<p role="status">Cargando…</p>}>
        <NewWords />
      </Suspense>
    </main>
  );
}

async function NewWords() {
  // Session reads use Date.now(), which Next forbids while prerendering.
  await connection();
  const { supabase, user } = await requireUser();
  const [profile, learned, items, cards, overdue] = await Promise.all([
    supabase
      .from("profiles")
      .select("new_cards_per_day")
      .eq("id", user.id)
      .single(),
    supabase.rpc("new_words_today"),
    supabase
      .from("content_items")
      .select("id, payload")
      .eq("type", "vocab")
      .order("slug"),
    supabase.from("srs_cards").select("content_id").eq("card_type", "vocab"),
    countDueCards(supabase),
  ]);
  if (profile.error || learned.error || items.error || cards.error) {
    throw new Error("Could not load new words");
  }

  const limit = profile.data.new_cards_per_day;
  const words = selectNewWords({
    candidates: items.data.map(toWord).filter((w): w is Word => w !== null),
    ownedIds: new Set(cards.data.flatMap((c) => c.content_id ?? [])),
    limit,
    learnedToday: learned.data,
    overdue,
  });

  if (words.length > 0) return <NewWordFlow words={words} />;
  if (overdue > OVERDUE_PAUSE_LIMIT) {
    return (
      <p>
        Tienes muchos repasos vencidos ({overdue}). Ponte al día antes de
        aprender palabras nuevas:{" "}
        <Link href="/vocabulary" className="font-bold underline">
          ir a repasar
        </Link>
        .
      </p>
    );
  }
  return limit - learned.data <= 0 ? (
    <p>
      Ya completaste tus palabras nuevas de hoy. Puedes cambiar el límite diario
      en{" "}
      <Link href="/settings" className="font-bold underline">
        Ajustes
      </Link>
      .
    </p>
  ) : (
    <p>No hay palabras nuevas por ahora. Vuelve pronto.</p>
  );
}
