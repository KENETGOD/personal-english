import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GoalRing } from "@/components/home/goal-ring";
import { ModeGrid } from "@/components/home/mode-grid";
import { ReviewsCard } from "@/components/home/reviews-card";
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

  it("lists the five modes and links only the built ones", () => {
    render(<ModeGrid />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Vocabulary/ })).toHaveAttribute(
      "href",
      "/vocabulary",
    );
    expect(screen.getAllByText("Próximamente")).toHaveLength(4);
  });

  it("links the due reviews to the review screen only when there are some", () => {
    const { rerender } = render(<ReviewsCard count={3} />);
    expect(screen.getByText("Repasos pendientes: 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Repasar ahora" })).toHaveAttribute(
      "href",
      "/vocabulary",
    );
    rerender(<ReviewsCard count={0} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
