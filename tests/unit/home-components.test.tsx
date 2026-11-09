import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GoalRing } from "@/components/home/goal-ring";
import { ModeGrid } from "@/components/home/mode-grid";
import { StreakHeader } from "@/components/home/streak-header";
import { goalProgress } from "@/lib/domain/goal-progress";

afterEach(cleanup);

describe("home components", () => {
  it("exposes the goal ring as a progressbar with a text equivalent", () => {
    render(
      <GoalRing
        progress={goalProgress({
          activeSeconds: 300,
          goalMinutes: 10,
          status: "none",
        })}
      />,
    );
    const bar = screen.getByRole("progressbar", { name: "Meta diaria" });
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(bar).toHaveAttribute("aria-valuetext", "5 de 10 minutos");
  });

  it("explains a frozen day", () => {
    render(
      <GoalRing
        progress={goalProgress({
          activeSeconds: 0,
          goalMinutes: 10,
          status: "frozen",
        })}
      />,
    );
    expect(screen.getByText(/protector de racha/)).toBeInTheDocument();
  });

  it("pluralizes streak and protectors", () => {
    render(<StreakHeader streak={1} freezes={0} xp={20} />);
    expect(screen.getByText("1 día")).toBeInTheDocument();
    expect(screen.getByText("0 protectores")).toBeInTheDocument();
    expect(screen.getByText("20 XP hoy")).toBeInTheDocument();
  });

  it("lists the five modes without links", () => {
    render(<ModeGrid />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
