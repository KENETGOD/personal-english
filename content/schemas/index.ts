// Zod schemas for content items (docs/04 sections 3-4). Shared by the validate and seed scripts.
// Common fields map to content_items columns; every other field goes into `payload`.
import { z } from "zod";

export const CONTENT_TYPES = [
  "vocab",
  "reading",
  "writing_prompt",
  "scenario",
  "shadowing",
  "minimal_pairs",
  "free_talk",
  "grammar_lesson",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

const TOPICS = [
  "work",
  "tech",
  "travel",
  "daily-life",
  "culture",
  "health",
  "money",
  "relationships",
] as const;

const text = z.string().trim().min(1);
const textList = z.array(text);
const grammarCode = z
  .string()
  .regex(/^G(0[1-9]|1\d|2[0-4])$/, "expected G01..G24");
const sentencePair = z.tuple([text, text]);

const commonShape = {
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be kebab-case"),
  version: z.number().int().min(1),
  level: z.enum(["B1", "B2"]),
  topics: z.array(z.enum(TOPICS)),
  grammar_tags: z.array(grammarCode),
  is_active: z.boolean(),
  est_minutes: z.number().positive(),
};

/** Keys that live in content_items columns instead of `payload`. */
export const COMMON_KEYS = Object.keys(commonShape);

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
const uniqueIds = (items: { id: string }[]) =>
  new Set(items.map((i) => i.id)).size === items.length;

const vocab = z.strictObject({
  ...commonShape,
  term: text,
  kind: z.enum(["word", "collocation", "phrasal_verb", "phrase"]),
  ipa: text,
  definition_en: text,
  translation_es: text,
  examples: textList.min(1),
  collocations: textList,
  cloze: text.refine((s) => s.includes("____"), "cloze needs a ____ gap"),
  notes_es: text.optional(),
});

const readingQuestion = z.discriminatedUnion("answer_type", [
  z.strictObject({
    id: text,
    type: z.enum(["gist", "detail", "inference"]),
    prompt: text,
    answer_type: z.literal("open_short"),
    reference_answer: text,
  }),
  z
    .strictObject({
      id: text,
      type: z.enum(["gist", "detail", "inference"]),
      prompt: text,
      answer_type: z.literal("choice"),
      options: textList.min(2),
      correct: z.number().int().min(0),
    })
    .refine((q) => q.correct < q.options.length, "correct is out of range"),
]);

const reading = z
  .strictObject({
    ...commonShape,
    title: text,
    word_count: z.number().int().positive(),
    pre_reading_vocab: textList,
    body: text,
    questions: z
      .array(readingQuestion)
      .min(1)
      .refine(uniqueIds, "question ids must be unique"),
    summary_task: text,
  })
  .refine(
    (r) =>
      Math.abs(r.word_count - wordCount(r.body)) <=
      Math.max(5, r.word_count * 0.1),
    "word_count differs from the body by more than 10%",
  );

const writingPrompt = z.strictObject({
  ...commonShape,
  genre: z.enum([
    "email",
    "opinion",
    "description",
    "narrative",
    "technical_explanation",
    "summary",
  ]),
  prompt: text,
  audience: text,
  purpose: text,
  target_words: z
    .strictObject({
      min: z.number().int().positive(),
      max: z.number().int().positive(),
    })
    .refine((w) => w.min <= w.max, "min must not exceed max"),
  useful_language: textList,
  rubric_focus: z.array(
    z.enum([
      "task",
      "coherence",
      "grammar_range",
      "grammar_accuracy",
      "vocabulary",
    ]),
  ),
});

const scenario = z
  .strictObject({
    ...commonShape,
    title: text,
    user_role: text,
    tutor_role: text,
    goal: text,
    opening_line: text,
    target_language: textList,
    min_turns: z.number().int().positive(),
    max_turns: z.number().int().positive(),
  })
  .refine(
    (s) => s.min_turns <= s.max_turns,
    "min_turns must not exceed max_turns",
  );

const shadowing = z.strictObject({
  ...commonShape,
  focus: z
    .array(
      z.enum([
        "ed_endings",
        "short_long_vowels",
        "final_consonants",
        "word_stress",
        "schwa",
        "initial_s_clusters",
        "th",
        "v_b",
        "h_sound",
        "linking",
        "intonation_questions",
      ]),
    )
    .min(1),
  sentences: z
    .array(
      z
        .strictObject({ id: text, text, focus_words: textList })
        .refine(
          (s) =>
            s.focus_words.every((w) =>
              s.text.toLowerCase().includes(w.toLowerCase()),
            ),
          "focus_words must appear in the sentence",
        ),
    )
    .min(1)
    .refine(uniqueIds, "sentence ids must be unique"),
});

const minimalPairs = z.strictObject({
  ...commonShape,
  contrast: text,
  tip_es: text,
  pairs: z.array(sentencePair).min(1),
  sentences: z.array(sentencePair),
});

const freeTalk = z.strictObject({
  ...commonShape,
  prompt: text,
  guiding_questions: textList,
});

const grammarLesson = z.strictObject({
  ...commonShape,
  code: grammarCode,
  title_es: text,
  explanation_es: text,
  examples: z.array(z.strictObject({ wrong: text, right: text })).min(1),
  practice: z.array(
    z.discriminatedUnion("type", [
      z.strictObject({
        type: z.literal("fix_sentence"),
        prompt: text,
        answer: text,
      }),
      z.strictObject({
        type: z.literal("produce"),
        prompt_es: text,
        answer: text,
      }),
    ]),
  ),
});

export const contentSchemas = {
  vocab,
  reading,
  writing_prompt: writingPrompt,
  scenario,
  shadowing,
  minimal_pairs: minimalPairs,
  free_talk: freeTalk,
  grammar_lesson: grammarLesson,
} satisfies Record<ContentType, z.ZodType>;

/** A validated item split into content_items columns and payload. */
export type ContentRow = {
  slug: string;
  type: ContentType;
  version: number;
  level: "B1" | "B2";
  topics: string[];
  grammar_tags: string[];
  est_minutes: number;
  is_active: boolean;
  payload: Record<string, unknown>;
};

export function toRow(
  type: ContentType,
  item: Record<string, unknown>,
): ContentRow {
  const payload = Object.fromEntries(
    Object.entries(item).filter(([k]) => !COMMON_KEYS.includes(k)),
  );
  return {
    slug: item.slug as string,
    type,
    version: item.version as number,
    level: item.level as "B1" | "B2",
    topics: item.topics as string[],
    grammar_tags: item.grammar_tags as string[],
    est_minutes: item.est_minutes as number,
    is_active: item.is_active as boolean,
    payload,
  };
}
