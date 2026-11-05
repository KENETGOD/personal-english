import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home", () => {
  it("shows the app name", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: "English Coach" }),
    ).toBeInTheDocument();
  });
});
