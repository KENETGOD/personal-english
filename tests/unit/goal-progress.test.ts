import { describe, expect, it } from "vitest";
import { goalProgress } from "@/lib/domain/goal-progress";

describe("goalProgress", () => {
  it("starts empty", () => {
    expect(
      goalProgress({ activeSeconds: 0, goalMinutes: 10, status: "none" }),
    ).toEqual({
      state: "pending",
      percent: 0,
      activeMinutes: 0,
      goalMinutes: 10,
      remainingMinutes: 10,
    });
  });

  it("floors minutes and rounds the remainder up", () => {
    const p = goalProgress({
      activeSeconds: 179,
      goalMinutes: 10,
      status: "none",
    });
    expect(p).toMatchObject({ activeMinutes: 2, remainingMinutes: 8 });
    expect(p.percent).toBe(29);
  });

  it("caps at 100 when met", () => {
    const p = goalProgress({
      activeSeconds: 1500,
      goalMinutes: 10,
      status: "met",
    });
    expect(p).toMatchObject({
      state: "met",
      percent: 100,
      remainingMinutes: 0,
    });
  });

  it("keeps real progress on a frozen day", () => {
    const p = goalProgress({
      activeSeconds: 60,
      goalMinutes: 10,
      status: "frozen",
    });
    expect(p).toMatchObject({ state: "frozen", activeMinutes: 1 });
  });

  it("treats unknown status and a zero goal safely", () => {
    expect(
      goalProgress({ activeSeconds: 30, goalMinutes: 0, status: "weird" }),
    ).toMatchObject({ state: "pending", percent: 0, remainingMinutes: 0 });
  });
});
