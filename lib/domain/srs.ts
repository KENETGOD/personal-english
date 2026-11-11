import { createEmptyCard, fsrs, type Card, type Grade } from "ts-fsrs";
import type { Database } from "@/lib/supabase/types";

type SrsCard = Database["public"]["Tables"]["srs_cards"]["Row"];
type ReviewLog = Database["public"]["Tables"]["review_logs"]["Row"];

/** The FSRS scheduling columns of srs_cards (dates as ISO strings, as the DB returns them). */
export type SrsCardRow = Pick<
  SrsCard,
  | "due"
  | "stability"
  | "difficulty"
  | "elapsed_days"
  | "scheduled_days"
  | "learning_steps"
  | "reps"
  | "lapses"
  | "state"
  | "last_review"
>;

/** The FSRS columns of review_logs. */
export type SrsLogRow = Pick<
  ReviewLog,
  "rating" | "state" | "elapsed_days" | "scheduled_days"
>;

/** 1 = Again, 2 = Hard, 3 = Good, 4 = Easy. */
export type SrsRating = 1 | 2 | 3 | 4;

const scheduler = fsrs();
const DAY_MS = 24 * 60 * 60 * 1000;

function toRow(card: Card, elapsedDays: number): SrsCardRow {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: elapsedDays,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.toISOString() ?? null,
  };
}

/** Scheduling columns for a card that has never been reviewed. */
export function newCardRow(now: Date): SrsCardRow {
  return toRow(createEmptyCard(now), 0);
}

/** Applies one review: returns the updated card columns and the review_logs columns. */
export function scheduleReview(
  row: SrsCardRow,
  rating: SrsRating,
  now: Date,
): { card: SrsCardRow; log: SrsLogRow } {
  const card: Card = {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as Card["state"],
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  };
  const elapsedDays = card.last_review
    ? Math.max(
        0,
        Math.floor((now.getTime() - card.last_review.getTime()) / DAY_MS),
      )
    : 0;
  const next = scheduler.next(card, now, rating as Grade).card;
  return {
    card: toRow(next, elapsedDays),
    log: {
      rating,
      state: row.state as Card["state"],
      elapsed_days: elapsedDays,
      scheduled_days: next.scheduled_days,
    },
  };
}
