import { describe, expect, it } from "vitest";
import {
  OVERDUE_PAUSE_LIMIT,
  selectNewWords,
  toWord,
} from "@/lib/domain/new-words";

const ids = (xs: { id: string }[]) => xs.map((x) => x.id);
const items = ["a", "b", "c", "d"].map((id) => ({ id }));

describe("selectNewWords", () => {
  it("pauses new words while more than 100 reviews are overdue", () => {
    const args = {
      candidates: items,
      ownedIds: new Set<string>(),
      limit: 10,
      learnedToday: 0,
    };
    expect(OVERDUE_PAUSE_LIMIT).toBe(100);
    expect(selectNewWords({ ...args, overdue: 101 })).toEqual([]);
    expect(selectNewWords({ ...args, overdue: 100 })).toHaveLength(4);
  });

  it("takes the first words up to the daily limit", () => {
    expect(
      ids(
        selectNewWords({
          candidates: items,
          ownedIds: new Set(),
          limit: 2,
          learnedToday: 0,
        }),
      ),
    ).toEqual(["a", "b"]);
  });

  it("skips words that already have a card", () => {
    expect(
      ids(
        selectNewWords({
          candidates: items,
          ownedIds: new Set(["a", "c"]),
          limit: 10,
          learnedToday: 0,
        }),
      ),
    ).toEqual(["b", "d"]);
  });

  it("subtracts what was already learned today", () => {
    expect(
      ids(
        selectNewWords({
          candidates: items,
          ownedIds: new Set(),
          limit: 3,
          learnedToday: 2,
        }),
      ),
    ).toEqual(["a"]);
  });

  it.each([
    [3, 3],
    [3, 5],
    [0, 0],
  ])("returns nothing at limit %i with %i learned", (limit, learnedToday) => {
    expect(
      selectNewWords({
        candidates: items,
        ownedIds: new Set(),
        limit,
        learnedToday,
      }),
    ).toEqual([]);
  });
});

describe("toWord", () => {
  const payload = {
    term: "figure out",
    kind: "phrasal_verb",
    ipa: "/x/",
    definition_en: "to understand",
    translation_es: "descifrar",
    examples: ["One.", "Two."],
    collocations: [],
    cloze: "____",
    notes_es: "Separable.",
  };

  it("maps a vocab payload to the fields the screen shows", () => {
    expect(toWord({ id: "w1", payload })).toEqual({
      id: "w1",
      term: "figure out",
      ipa: "/x/",
      definitionEn: "to understand",
      translationEs: "descifrar",
      examples: ["One.", "Two."],
      notesEs: "Separable.",
    });
  });

  it("returns null for a payload that is not a vocab item", () => {
    expect(toWord({ id: "w1", payload: {} })).toBeNull();
    expect(toWord({ id: "w1", payload: null })).toBeNull();
  });
});
