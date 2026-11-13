import { z } from "zod";

/** What the new-word screen shows (docs/02 section 3.1). */
export type Word = {
  id: string;
  term: string;
  ipa: string;
  definitionEn: string;
  translationEs: string;
  examples: string[];
  notesEs?: string;
};

// Not strict: the payload also carries fields used by review cards (cloze, collocations).
const payloadSchema = z.object({
  term: z.string().min(1),
  ipa: z.string().min(1),
  definition_en: z.string().min(1),
  translation_es: z.string().min(1),
  examples: z.array(z.string().min(1)).min(1),
  notes_es: z.string().min(1).optional(),
});

/** Maps a content_items vocab row to a Word; null when the payload is not a valid vocab item. */
export function toWord(row: { id: string; payload: unknown }): Word | null {
  const p = payloadSchema.safeParse(row.payload);
  if (!p.success) return null;
  const { term, ipa, definition_en, translation_es, examples, notes_es } =
    p.data;
  return {
    id: row.id,
    term,
    ipa,
    definitionEn: definition_en,
    translationEs: translation_es,
    examples,
    ...(notes_es && { notesEs: notes_es }),
  };
}

/** New words are paused while more reviews than this are overdue (docs/02 section 3.1). */
export const OVERDUE_PAUSE_LIMIT = 100;

/** Words to offer now: those without a card yet, up to what is left of today's limit (RF-VOC-04). */
export function selectNewWords<T extends { id: string }>({
  candidates,
  ownedIds,
  limit,
  learnedToday,
  overdue = 0,
}: {
  candidates: T[];
  ownedIds: ReadonlySet<string>;
  limit: number;
  learnedToday: number;
  overdue?: number;
}): T[] {
  if (overdue > OVERDUE_PAUSE_LIMIT) return [];
  const remaining = Math.max(0, limit - learnedToday);
  return candidates.filter((c) => !ownedIds.has(c.id)).slice(0, remaining);
}
