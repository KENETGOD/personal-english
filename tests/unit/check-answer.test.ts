import { describe, expect, it } from "vitest";
import { checkCardAnswer } from "@/lib/domain/check-answer";

describe("checkCardAnswer", () => {
  it("accepts the exact answer", () => {
    expect(checkCardAnswer("figure out", "figure out")).toBe(true);
  });
  it("ignores case and surrounding spaces", () => {
    expect(checkCardAnswer("Deadline", "  deadline ")).toBe(true);
  });
  it("rejects a different answer and an empty one", () => {
    expect(checkCardAnswer("deadline", "dead line")).toBe(false);
    expect(checkCardAnswer("deadline", "")).toBe(false);
  });
});
