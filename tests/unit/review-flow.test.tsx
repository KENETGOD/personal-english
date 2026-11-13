import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { beginReview, checkAnswer, gradeAndNext } from "@/actions/review";
import { ReviewFlow } from "@/components/vocabulary/review-flow";
import { speak } from "@/lib/audio/speak";

vi.mock("@/actions/review", () => ({
  beginReview: vi.fn(),
  checkAnswer: vi.fn(),
  gradeAndNext: vi.fn(),
}));
vi.mock("@/lib/audio/speak", () => ({ speak: vi.fn() }));

const cards = [
  { id: "c1", variant: "cloze" as const, prompt: "We need to ____ ____ why." },
  {
    id: "c2",
    variant: "dictation" as const,
    prompt: "Escucha y escribe lo que oyes.",
    audioText: "deadline",
  },
];
const ok = <T,>(data: T) => ({ ok: true as const, data });

beforeEach(() => {
  vi.mocked(beginReview).mockResolvedValue(
    ok({ sessionId: "s1", attemptId: "a1" }),
  );
  vi.mocked(checkAnswer).mockResolvedValue(
    ok({ correct: false, expected: "figure out" }),
  );
  vi.mocked(gradeAndNext).mockResolvedValue(ok({ attemptId: "a2" }));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function start() {
  render(<ReviewFlow cards={cards} />);
  fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
  return screen.findByLabelText("Tu respuesta");
}

describe("ReviewFlow", () => {
  it("opens a session on the first card and asks for an answer before revealing", async () => {
    const input = await start();
    expect(beginReview).toHaveBeenCalledWith("c1");
    expect(screen.getByText("We need to ____ ____ why.")).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(screen.queryByText("figure out")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Bien" }),
    ).not.toBeInTheDocument();
  });

  it("reveals the result and the grade buttons after checking", async () => {
    const input = await start();
    fireEvent.change(input, { target: { value: "work out" } });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Incorrecto. Respuesta: figure out",
    );
    expect(checkAnswer).toHaveBeenCalledWith({
      cardId: "c1",
      answer: "work out",
    });
    for (const name of ["Otra vez", "Difícil", "Bien", "Fácil"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("grades the card and moves to the next one, then finishes", async () => {
    const input = await start();
    fireEvent.change(input, { target: { value: "work out" } });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Bien" }));

    expect(gradeAndNext).toHaveBeenCalledWith({
      sessionId: "s1",
      attemptId: "a1",
      cardId: "c1",
      rating: 3,
      answer: "work out",
      nextCardId: "c2",
    });
    expect(await screen.findByLabelText("Tu respuesta")).toHaveValue("");

    // dictation: the prompt plays the word
    fireEvent.click(screen.getByRole("button", { name: "Escuchar de nuevo" }));
    expect(speak).toHaveBeenCalledWith("deadline");

    vi.mocked(gradeAndNext).mockResolvedValue(ok({ attemptId: null }));
    fireEvent.change(screen.getByLabelText("Tu respuesta"), {
      target: { value: "deadline" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Fácil" }));
    expect(
      await screen.findByRole("heading", { name: "¡Repaso completo!" }),
    ).toBeInTheDocument();
  });

  it("shows the server error and stays on the card", async () => {
    vi.mocked(checkAnswer).mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "No se pudo guardar." },
    });
    const input = await start();
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo guardar.",
    );
  });
});
