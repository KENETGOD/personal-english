import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkAnswer, gradeAndNext } from "@/actions/review";

const rpc = vi.fn();
const single = vi.fn();
const supabase = {
  rpc,
  from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
};
vi.mock("@/lib/auth/require-user", () => ({
  requireUser: async () => ({ supabase }),
}));

const ids = {
  sessionId: "11111111-1111-4111-8111-111111111111",
  attemptId: "22222222-2222-4222-8222-222222222222",
  cardId: "33333333-3333-4333-8333-333333333333",
  next: "44444444-4444-4444-8444-444444444444",
};
const cardRow = {
  id: ids.cardId,
  content_id: "55555555-5555-4555-8555-555555555555",
  due: "2027-03-01T10:00:00.000Z",
  stability: 0,
  difficulty: 0,
  elapsed_days: 0,
  scheduled_days: 0,
  learning_steps: 0,
  reps: 0,
  lapses: 0,
  state: 0,
  last_review: null,
  content_items: {
    payload: {
      term: "Deadline",
      definition_en: "the latest time to finish",
      translation_es: "fecha límite",
    },
  },
};

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ data: "x", error: null });
  single.mockReset().mockResolvedValue({ data: cardRow, error: null });
});

describe("checkAnswer", () => {
  it("compares against the term stored server-side", async () => {
    const res = await checkAnswer({ cardId: ids.cardId, answer: " deadline " });
    expect(res).toEqual({
      ok: true,
      data: { correct: true, expected: "Deadline" },
    });
  });
  it("rejects invalid input", async () => {
    expect((await checkAnswer({ cardId: "nope", answer: "x" })).ok).toBe(false);
  });
});

describe("gradeAndNext", () => {
  const input = {
    sessionId: ids.sessionId,
    attemptId: ids.attemptId,
    cardId: ids.cardId,
    rating: 3,
    answer: "deadline",
    nextCardId: ids.next as string | null,
  };

  it("schedules with FSRS, grades atomically, completes the attempt and starts the next", async () => {
    const res = await gradeAndNext(input);
    expect(res.ok).toBe(true);
    expect(rpc.mock.calls.map((c) => c[0])).toEqual([
      "grade_card",
      "complete_attempt",
      "start_attempt",
    ]);
    const args = rpc.mock.calls[0][1];
    expect(args).toMatchObject({
      p_card_id: ids.cardId,
      p_rating: 3,
      p_answer: "deadline",
    });
    expect(new Date(args.p_due).getTime()).toBeGreaterThan(Date.now());
    expect(rpc.mock.calls[2][1]).toMatchObject({ p_activity: "review" });
  });
  it("closes the session after the last card", async () => {
    await gradeAndNext({ ...input, rating: 1, nextCardId: null });
    expect(rpc.mock.calls.map((c) => c[0])).toEqual([
      "grade_card",
      "complete_attempt",
      "end_session",
    ]);
  });
  it("does not complete the attempt when grading fails", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: "P0001" } });
    const res = await gradeAndNext({ ...input, nextCardId: null });
    expect(res.ok).toBe(false);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
