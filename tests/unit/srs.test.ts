import { describe, expect, it } from "vitest";
import {
  newCardRow,
  scheduleReview,
  type SrsCardRow,
  type SrsRating,
} from "@/lib/domain/srs";

const NOW = new Date("2027-03-01T10:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("newCardRow", () => {
  it("is a new card due now with no history", () => {
    expect(newCardRow(NOW)).toEqual({
      due: NOW.toISOString(),
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      learning_steps: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      last_review: null,
    });
  });
});

describe("scheduleReview", () => {
  it("TC-SRS-01: a new card rated Good is due later with reps = 1", () => {
    const { card, log } = scheduleReview(newCardRow(NOW), 3, NOW);
    expect(card.reps).toBe(1);
    expect(new Date(card.due).getTime()).toBeGreaterThan(NOW.getTime());
    expect(card.last_review).toBe(NOW.toISOString());
    expect(card.stability).toBeGreaterThan(0);
    expect(log).toEqual({
      rating: 3,
      state: 0,
      elapsed_days: 0,
      scheduled_days: card.scheduled_days,
    });
  });

  it("logs the state the card was in before the review", () => {
    const first = scheduleReview(newCardRow(NOW), 4, NOW).card;
    const second = scheduleReview(first, 3, new Date(first.due));
    expect(second.log.state).toBe(first.state);
  });

  it("schedules Easy no sooner than Good, and Good no sooner than Hard", () => {
    const dueOf = (rating: SrsRating) =>
      new Date(scheduleReview(newCardRow(NOW), rating, NOW).card.due).getTime();
    expect(dueOf(4)).toBeGreaterThanOrEqual(dueOf(3));
    expect(dueOf(3)).toBeGreaterThanOrEqual(dueOf(2));
    expect(dueOf(2)).toBeGreaterThanOrEqual(dueOf(1));
  });

  it("counts a lapse when a review card is rated Again", () => {
    let card: SrsCardRow = newCardRow(NOW);
    let now = NOW;
    for (let i = 0; i < 6 && card.state !== 2; i++) {
      card = scheduleReview(card, 3, now).card;
      now = new Date(card.due);
    }
    expect(card.state).toBe(2);
    const lapsed = scheduleReview(card, 1, new Date(now.getTime() + DAY));
    expect(lapsed.card.lapses).toBe(1);
    expect(lapsed.card.state).toBe(3);
  });

  it("reports elapsed whole days since the last review", () => {
    const reviewed = scheduleReview(newCardRow(NOW), 4, NOW).card;
    const later = new Date(NOW.getTime() + 5 * DAY);
    expect(scheduleReview(reviewed, 3, later).log.elapsed_days).toBe(5);
  });

  it("does not mutate the input row", () => {
    const row = newCardRow(NOW);
    const copy = { ...row };
    scheduleReview(row, 3, NOW);
    expect(row).toEqual(copy);
  });
});
