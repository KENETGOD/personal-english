import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { beginNewWords, learnWord } from "@/actions/vocabulary";
import { NewWordFlow } from "@/components/vocabulary/new-word-flow";
import { speak } from "@/lib/audio/speak";

vi.mock("@/actions/vocabulary", () => ({
  beginNewWords: vi.fn(),
  learnWord: vi.fn(),
}));
vi.mock("@/lib/audio/speak", () => ({ speak: vi.fn() }));

const words = [
  {
    id: "w1",
    term: "figure out",
    ipa: "/fig/",
    definitionEn: "to understand something",
    translationEs: "descifrar",
    examples: ["I can't figure out this bug.", "Let's figure out why."],
    notesEs: "Separable.",
  },
  {
    id: "w2",
    term: "deadline",
    ipa: "/ded/",
    definitionEn: "the latest time to finish",
    translationEs: "fecha límite",
    examples: ["The deadline is Friday."],
  },
];

const ok = <T,>(data: T) => ({ ok: true as const, data });

beforeEach(() => {
  vi.mocked(beginNewWords).mockResolvedValue(
    ok({ sessionId: "s1", attemptId: "a1" }),
  );
  vi.mocked(learnWord).mockResolvedValue(ok({ attemptId: "a2" }));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NewWordFlow", () => {
  it("starts on an intro that states how many words are coming", async () => {
    render(<NewWordFlow words={words} />);
    expect(screen.getByText("2 palabras nuevas hoy")).toBeInTheDocument();
    expect(beginNewWords).not.toHaveBeenCalled();
  });

  it("opens a session on the first word and shows context, definition and translation", async () => {
    render(<NewWordFlow words={words} />);
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));

    expect(beginNewWords).toHaveBeenCalledWith("w1");
    expect(
      await screen.findByRole("heading", { name: "figure out" }),
    ).toBeInTheDocument();
    expect(screen.getByText("I can't figure out this bug.")).toBeVisible();
    expect(screen.getByText("to understand something")).toBeVisible();
    expect(screen.getByText("descifrar")).toBeVisible();
    expect(screen.getByText("Let's figure out why.")).toBeVisible();
  });

  it("plays the example audio", async () => {
    render(<NewWordFlow words={words} />);
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Escuchar: I can't figure out this bug.",
      }),
    );
    expect(speak).toHaveBeenCalledWith("I can't figure out this bug.");
  });

  it("learns a word, moves to the next and finishes the session", async () => {
    render(<NewWordFlow words={words} />);
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Siguiente" }));

    expect(learnWord).toHaveBeenCalledWith({
      sessionId: "s1",
      attemptId: "a1",
      contentId: "w1",
      nextContentId: "w2",
    });
    expect(
      await screen.findByRole("heading", { name: "deadline" }),
    ).toBeInTheDocument();

    vi.mocked(learnWord).mockResolvedValue(ok({ attemptId: null }));
    fireEvent.click(screen.getByRole("button", { name: "Terminar" }));
    expect(learnWord).toHaveBeenLastCalledWith({
      sessionId: "s1",
      attemptId: "a2",
      contentId: "w2",
      nextContentId: null,
    });
    expect(
      await screen.findByRole("heading", { name: "¡Listo por hoy!" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Volver al inicio" }),
    ).toHaveAttribute("href", "/home");
  });

  it("shows an error and stays on the word when saving fails", async () => {
    vi.mocked(learnWord).mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "No se pudo guardar." },
    });
    render(<NewWordFlow words={words} />);
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Siguiente" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo guardar.",
    );
    expect(screen.getByRole("heading", { name: "figure out" })).toBeVisible();
  });
});
