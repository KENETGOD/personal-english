"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { fail, VALIDATION_MESSAGE, type ActionResult } from "./result";

const SAVE_ERROR = "No se pudo guardar tu avance. Inténtalo de nuevo.";

const beginSchema = z.object({ contentId: z.uuid() });
const learnSchema = z.object({
  sessionId: z.uuid(),
  attemptId: z.uuid(),
  contentId: z.uuid(),
  nextContentId: z.uuid().nullable(),
});

/** Opens the vocabulary session and times the first word (the attempt starts when it is shown). */
export async function beginNewWords(
  contentId: string,
): Promise<ActionResult<{ sessionId: string; attemptId: string }>> {
  const { supabase } = await requireUser();
  const parsed = beginSchema.safeParse({ contentId });
  if (!parsed.success) return fail("VALIDATION_ERROR", VALIDATION_MESSAGE);

  const session = await supabase.rpc("start_session", { p_mode: "vocabulary" });
  if (session.error) {
    console.error("start_session failed", session.error.code);
    return fail("INTERNAL_ERROR", SAVE_ERROR);
  }
  const attempt = await supabase.rpc("start_attempt", {
    p_session_id: session.data,
    p_content_id: parsed.data.contentId,
    p_activity: "new_word",
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

/**
 * Finishes one word: creates its SRS card (idempotent) and completes the attempt, which credits
 * minutes and XP server-side. Then times the next word, or closes the session after the last one.
 */
export async function learnWord(input: {
  sessionId: string;
  attemptId: string;
  contentId: string;
  nextContentId: string | null;
}): Promise<ActionResult<{ attemptId: string | null }>> {
  const { supabase } = await requireUser();
  const parsed = learnSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION_ERROR", VALIDATION_MESSAGE);
  const { sessionId, attemptId, contentId, nextContentId } = parsed.data;

  const card = await supabase.rpc("add_vocab_card", {
    p_content_id: contentId,
  });
  if (card.error) {
    console.error("add_vocab_card failed", card.error.code);
    return fail("INTERNAL_ERROR", SAVE_ERROR);
  }
  const done = await supabase.rpc("complete_attempt", {
    p_attempt_id: attemptId,
  });
  if (done.error) {
    console.error("complete_attempt failed", done.error.code);
    return fail("INTERNAL_ERROR", SAVE_ERROR);
  }

  if (!nextContentId) {
    const end = await supabase.rpc("end_session", { p_session_id: sessionId });
    if (end.error) console.error("end_session failed", end.error.code);
    return { ok: true, data: { attemptId: null } };
  }
  const next = await supabase.rpc("start_attempt", {
    p_session_id: sessionId,
    p_content_id: nextContentId,
    p_activity: "new_word",
  });
  if (next.error) {
    console.error("start_attempt failed", next.error.code);
    return fail("INTERNAL_ERROR", SAVE_ERROR);
  }
  return { ok: true, data: { attemptId: next.data } };
}
