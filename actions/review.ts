"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { checkCardAnswer } from "@/lib/domain/check-answer";
import { buildReviewCard } from "@/lib/domain/review-cards";
import { scheduleReview } from "@/lib/domain/srs";
import { fail, VALIDATION_MESSAGE, type ActionResult } from "./result";

const SAVE_ERROR = "No se pudo guardar tu avance. Inténtalo de nuevo.";

const beginSchema = z.object({ cardId: z.uuid() });
const checkSchema = z.object({ cardId: z.uuid(), answer: z.string().max(200) });
const gradeSchema = z.object({
  sessionId: z.uuid(),
  attemptId: z.uuid(),
  cardId: z.uuid(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  answer: z.string().max(200),
  nextCardId: z.uuid().nullable(),
});

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

// RLS scopes the read to the caller's own cards.
async function loadCard(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("srs_cards")
    .select(
      "id, content_id, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review, content_items(payload)",
    )
    .eq("id", id)
    .single();
  if (error) console.error("load card failed", error.code);
  return data;
}

/** Opens the vocabulary session and times the first card. */
export async function beginReview(
  cardId: string,
): Promise<ActionResult<{ sessionId: string; attemptId: string }>> {
  const { supabase } = await requireUser();
  const parsed = beginSchema.safeParse({ cardId });
  if (!parsed.success) return fail("VALIDATION_ERROR", VALIDATION_MESSAGE);
  const card = await loadCard(supabase, parsed.data.cardId);
  if (!card?.content_id) return fail("INTERNAL_ERROR", SAVE_ERROR);

  const session = await supabase.rpc("start_session", { p_mode: "vocabulary" });
  if (session.error) {
    console.error("start_session failed", session.error.code);
    return fail("INTERNAL_ERROR", SAVE_ERROR);
  }
  const attempt = await supabase.rpc("start_attempt", {
    p_session_id: session.data,
    p_content_id: card.content_id,
    p_activity: "review",
  });
  if (attempt.error) {
    console.error("start_attempt failed", attempt.error.code);
    return fail("INTERNAL_ERROR", SAVE_ERROR);
  }
  return {
    ok: true,
    data: { sessionId: session.data, attemptId: attempt.data },
  };
}

/** Compares the typed answer with the term, which never leaves the server before the user answers. */
export async function checkAnswer(input: {
  cardId: string;
  answer: string;
}): Promise<ActionResult<{ correct: boolean; expected: string }>> {
  const { supabase } = await requireUser();
  const parsed = checkSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION_ERROR", VALIDATION_MESSAGE);
  const card = await loadCard(supabase, parsed.data.cardId);
  const built = card && buildReviewCard(card, card.content_items?.payload);
  if (!built) return fail("INTERNAL_ERROR", SAVE_ERROR);
  return {
    ok: true,
    data: {
      correct: checkCardAnswer(built.expected, parsed.data.answer),
      expected: built.expected,
    },
  };
}

/**
 * Grades one card: FSRS computes the next state here, grade_card stores it with its log atomically,
 * complete_attempt credits minutes and XP. Then times the next card, or closes the session.
 */
export async function gradeAndNext(input: {
  sessionId: string;
  attemptId: string;
  cardId: string;
  rating: number;
  answer: string;
  nextCardId: string | null;
}): Promise<ActionResult<{ attemptId: string | null }>> {
  const { supabase } = await requireUser();
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION_ERROR", VALIDATION_MESSAGE);
  const { sessionId, attemptId, cardId, rating, answer, nextCardId } =
    parsed.data;

  const card = await loadCard(supabase, cardId);
  if (!card) return fail("INTERNAL_ERROR", SAVE_ERROR);
  const { card: next } = scheduleReview(card, rating, new Date());
  const graded = await supabase.rpc("grade_card", {
    p_card_id: cardId,
    p_rating: rating,
    p_answer: answer,
    p_due: next.due,
    p_stability: next.stability,
    p_difficulty: next.difficulty,
    p_elapsed_days: next.elapsed_days,
    p_scheduled_days: next.scheduled_days,
    p_learning_steps: next.learning_steps,
    p_reps: next.reps,
    p_lapses: next.lapses,
    p_state: next.state,
  });
  if (graded.error) {
    console.error("grade_card failed", graded.error.code);
    return fail("INTERNAL_ERROR", SAVE_ERROR);
  }
  const done = await supabase.rpc("complete_attempt", {
    p_attempt_id: attemptId,
  });
  if (done.error) {
    console.error("complete_attempt failed", done.error.code);
    return fail("INTERNAL_ERROR", SAVE_ERROR);
  }

  if (!nextCardId) {
    const end = await supabase.rpc("end_session", { p_session_id: sessionId });
    if (end.error) console.error("end_session failed", end.error.code);
    return { ok: true, data: { attemptId: null } };
  }
  const following = await loadCard(supabase, nextCardId);
  const started = following?.content_id
    ? await supabase.rpc("start_attempt", {
        p_session_id: sessionId,
        p_content_id: following.content_id,
        p_activity: "review",
      })
    : null;
  if (!started || started.error) {
    console.error("start_attempt failed", started?.error.code);
    return fail("INTERNAL_ERROR", SAVE_ERROR);
  }
  return { ok: true, data: { attemptId: started.data } };
}
