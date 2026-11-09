export type GoalState = "pending" | "met" | "frozen";

export type GoalProgress = {
  state: GoalState;
  /** 0-100, drives the ring. */
  percent: number;
  activeMinutes: number;
  goalMinutes: number;
  remainingMinutes: number;
};

/** Maps today_progress() output to what the goal ring shows. Unknown statuses count as pending. */
export function goalProgress(input: {
  activeSeconds: number;
  goalMinutes: number;
  status: string;
}): GoalProgress {
  const { activeSeconds, goalMinutes, status } = input;
  const state: GoalState =
    status === "met" || status === "frozen" ? status : "pending";
  const raw = goalMinutes > 0 ? (activeSeconds / 60 / goalMinutes) * 100 : 0;
  const percent =
    state === "met" ? 100 : Math.min(100, Math.floor(Math.max(0, raw)));
  const activeMinutes = Math.floor(activeSeconds / 60);
  return {
    state,
    percent,
    activeMinutes,
    goalMinutes,
    remainingMinutes:
      state === "met"
        ? 0
        : Math.max(0, Math.ceil(goalMinutes - activeSeconds / 60)),
  };
}
