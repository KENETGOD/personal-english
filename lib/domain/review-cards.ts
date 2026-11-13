import { z } from "zod";

export type CardVariant = "cloze" | "definition" | "translation" | "dictation";

/** What the client receives: never the expected answer (RF-VOC-02, active recall). Dictation audio is the word by design. */
export type ReviewCard = {
  id: string;
  variant: CardVariant;
  prompt: string;
  audioText?: string;
};

// Stability (days) from which a card counts as stable and moves on to production (docs/02 section 3.1).
const STABLE_DAYS = 7;

/**
 * Deterministic rotation from the card's own state (docs/02 section 3.1): weak cards alternate
 * cloze and definition; stable ones alternate Spanish to English and dictation.
 */
export function pickVariant(
  card: { stability: number; reps: number },
  hasCloze: boolean,
): CardVariant {
  const even = card.reps % 2 === 0;
  if (card.stability < STABLE_DAYS)
    return even && hasCloze ? "cloze" : "definition";
  return even ? "translation" : "dictation";
}

const payloadSchema = z.object({
  term: z.string().min(1),
  definition_en: z.string().min(1),
  translation_es: z.string().min(1),
  cloze: z.string().min(1).optional(),
});

/** Builds the card to show plus the expected answer (kept server-side); null for an invalid vocab payload. */
export function buildReviewCard(
  card: { id: string; stability: number; reps: number },
  payload: unknown,
): { card: ReviewCard; expected: string } | null {
  const p = payloadSchema.safeParse(payload);
  if (!p.success) return null;
  const { term, definition_en, translation_es, cloze } = p.data;
  const variant = pickVariant(card, Boolean(cloze));
  const base = { id: card.id, variant };
  const shown = {
    cloze: { prompt: cloze ?? definition_en },
    definition: { prompt: definition_en },
    translation: { prompt: translation_es },
    dictation: {
      prompt: "Escucha y escribe lo que oyes.",
      audioText: term,
    },
  }[variant];
  return { card: { ...base, ...shown }, expected: term };
}
