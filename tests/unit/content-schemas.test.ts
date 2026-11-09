import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contentSchemas, toRow } from "../../content/schemas/index.ts";
import { loadContent, typeForFile } from "../../scripts/content-lib.ts";

const common = {
  slug: "sample-item",
  version: 1,
  level: "B1",
  topics: ["work"],
  grammar_tags: ["G02"],
  is_active: true,
  est_minutes: 3,
};
const freeTalk = {
  ...common,
  prompt: "Talk about your week.",
  guiding_questions: ["What happened?"],
};

describe("content schemas", () => {
  it("accepts a valid item", () => {
    expect(contentSchemas.free_talk.safeParse(freeTalk).success).toBe(true);
  });

  it.each([
    ["slug is not kebab-case", { slug: "Not Kebab" }],
    ["version is 0", { version: 0 }],
    ["level is C1", { level: "C1" }],
    ["topic is unknown", { topics: ["sports"] }],
    ["grammar tag is out of range", { grammar_tags: ["G25"] }],
    ["est_minutes is 0", { est_minutes: 0 }],
    ["an unknown field is present", { extra: true }],
  ])("rejects an item when %s", (_, patch) => {
    expect(
      contentSchemas.free_talk.safeParse({ ...freeTalk, ...patch }).success,
    ).toBe(false);
  });

  it("rejects a vocabulary cloze without a gap", () => {
    const vocab = {
      ...common,
      term: "deadline",
      kind: "word",
      ipa: "/x/",
      definition_en: "d",
      translation_es: "t",
      examples: ["e"],
      collocations: [],
      cloze: "no gap here",
    };
    expect(
      contentSchemas.vocab.safeParse({ ...vocab, cloze: "a ____ here" })
        .success,
    ).toBe(true);
    expect(contentSchemas.vocab.safeParse(vocab).success).toBe(false);
  });

  it("rejects a shadowing focus word that is not in the sentence", () => {
    const item = {
      ...common,
      focus: ["ed_endings"],
      sentences: [
        { id: "s1", text: "I worked late.", focus_words: ["missed"] },
      ],
    };
    expect(contentSchemas.shadowing.safeParse(item).success).toBe(false);
  });

  it("splits common columns from the payload", () => {
    const row = toRow("free_talk", freeTalk);
    expect(row.slug).toBe("sample-item");
    expect(row.type).toBe("free_talk");
    expect(row.payload).toEqual({
      prompt: freeTalk.prompt,
      guiding_questions: freeTalk.guiding_questions,
    });
  });
});

describe("content loader", () => {
  it("maps files to content types", () => {
    expect(typeForFile("vocabulary/b1-work.json")).toBe("vocab");
    expect(typeForFile("speaking/minimal-pairs.json")).toBe("minimal_pairs");
    expect(typeForFile("speaking/other.json")).toBeUndefined();
  });

  it("reports duplicate slugs across files", () => {
    const root = mkdtempSync(join(tmpdir(), "content-"));
    mkdirSync(join(root, "speaking"));
    writeFileSync(
      join(root, "speaking", "free-talk-topics.json"),
      JSON.stringify([freeTalk, freeTalk]),
    );
    const { errors } = loadContent(root);
    expect(errors.some((e) => e.includes("already used"))).toBe(true);
  });

  it("flags files outside the known locations", () => {
    const root = mkdtempSync(join(tmpdir(), "content-"));
    writeFileSync(join(root, "stray.json"), "[]");
    expect(loadContent(root).errors[0]).toMatch(/known content location/);
  });

  it("the committed content is valid and covers every type", () => {
    const { rows, errors } = loadContent();
    expect(errors).toEqual([]);
    expect(new Set(rows.map((r) => r.type)).size).toBe(8);
  });
});
