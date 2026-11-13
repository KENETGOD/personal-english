import { describe, expect, it } from "vitest";
import { buildReviewCard, pickVariant } from "@/lib/domain/review-cards";

const payload = {
  term: "figure out",
  definition_en: "to understand something",
  translation_es: "descifrar",
  cloze: "We still need to ____ ____ why it fails.",
  examples: ["I can't figure out this bug."],
};

describe("pickVariant", () => {
  it("alternates cloze and definition while the memory is still weak", () => {
    expect(pickVariant({ stability: 1, reps: 0 }, true)).toBe("cloze");
    expect(pickVariant({ stability: 1, reps: 1 }, true)).toBe("definition");
    expect(pickVariant({ stability: 1, reps: 2 }, true)).toBe("cloze");
  });
  it("falls back to definition when the word has no cloze", () => {
    expect(pickVariant({ stability: 1, reps: 0 }, false)).toBe("definition");
  });
  it("alternates Spanish to English and dictation once the memory is stable", () => {
    expect(pickVariant({ stability: 7, reps: 4 }, true)).toBe("translation");
    expect(pickVariant({ stability: 30, reps: 5 }, true)).toBe("dictation");
  });
});

describe("buildReviewCard", () => {
  const base = { id: "c1", stability: 1, reps: 0 };

  it("builds a cloze prompt and expects the term", () => {
    const r = buildReviewCard(base, payload);
    expect(r?.card).toEqual({
      id: "c1",
      variant: "cloze",
      prompt: payload.cloze,
    });
    expect(r?.expected).toBe("figure out");
  });
  it("builds definition, translation and dictation prompts", () => {
    expect(buildReviewCard({ ...base, reps: 1 }, payload)?.card.prompt).toBe(
      "to understand something",
    );
    expect(
      buildReviewCard({ ...base, stability: 9, reps: 4 }, payload)?.card.prompt,
    ).toBe("descifrar");
    const dictation = buildReviewCard(
      { ...base, stability: 9, reps: 5 },
      payload,
    )?.card;
    expect(dictation?.variant).toBe("dictation");
    expect(dictation?.audioText).toBe("figure out");
  });
  it("never leaks the answer to the client except in dictation audio", () => {
    for (const reps of [0, 1]) {
      const json = JSON.stringify(
        buildReviewCard({ ...base, reps }, payload)?.card,
      );
      expect(json).not.toContain("figure out");
    }
    const t = buildReviewCard({ ...base, stability: 9, reps: 4 }, payload);
    expect(JSON.stringify(t?.card)).not.toContain("figure out");
  });
  it("returns null for an invalid payload", () => {
    expect(buildReviewCard(base, { term: "x" })).toBeNull();
  });
});
