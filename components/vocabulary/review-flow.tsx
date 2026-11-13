"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { beginReview, checkAnswer, gradeAndNext } from "@/actions/review";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { speak } from "@/lib/audio/speak";
import type { ReviewCard } from "@/lib/domain/review-cards";

type Progress = { sessionId: string; attemptId: string; index: number };
type Result = { correct: boolean; expected: string };

const RATINGS = [
  { rating: 1, label: "Otra vez" },
  { rating: 2, label: "Difícil" },
  { rating: 3, label: "Bien" },
  { rating: 4, label: "Fácil" },
] as const;

const TITLES: Record<ReviewCard["variant"], string> = {
  cloze: "Completa la frase",
  definition: "¿Qué palabra es?",
  translation: "Dilo en inglés",
  dictation: "Dictado",
};

export function ReviewFlow({ cards }: { cards: ReviewCard[] }) {
  // null = intro; "done" = queue finished.
  const [progress, setProgress] = useState<Progress | "done" | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const goodRef = useRef<HTMLButtonElement>(null);

  const index = typeof progress === "object" && progress ? progress.index : -1;
  const card = cards[index];

  // Focus management: the answer field for each new card, then the grade buttons once revealed.
  useEffect(() => {
    if (!card) return;
    if (result) goodRef.current?.focus();
    else inputRef.current?.focus();
  }, [card, result]);
  useEffect(() => {
    if (card?.audioText) speak(card.audioText);
  }, [card]);

  async function begin() {
    setPending(true);
    const res = await beginReview(cards[0].id);
    setPending(false);
    if (!res.ok) return setError(res.error.message);
    setError(null);
    setProgress({ ...res.data, index: 0 });
  }

  async function check() {
    setPending(true);
    const res = await checkAnswer({ cardId: card.id, answer });
    setPending(false);
    if (!res.ok) return setError(res.error.message);
    setError(null);
    setResult(res.data);
  }

  async function grade(current: Progress, rating: 1 | 2 | 3 | 4) {
    setPending(true);
    const res = await gradeAndNext({
      sessionId: current.sessionId,
      attemptId: current.attemptId,
      cardId: card.id,
      rating,
      answer,
      nextCardId: cards[current.index + 1]?.id ?? null,
    });
    setPending(false);
    if (!res.ok) return setError(res.error.message);
    setError(null);
    setAnswer("");
    setResult(null);
    setProgress(
      res.data.attemptId
        ? {
            ...current,
            attemptId: res.data.attemptId,
            index: current.index + 1,
          }
        : "done",
    );
  }

  const errorMessage = error && (
    <p role="alert" className="text-sm font-bold text-destructive">
      {error}
    </p>
  );

  if (progress === null) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-lg font-bold">
          {cards.length === 1
            ? "1 repaso pendiente"
            : `${cards.length} repasos pendientes`}
        </p>
        <p className="text-muted-foreground">
          Intenta recordar la palabra antes de ver la respuesta.
        </p>
        <Button onClick={begin} disabled={pending}>
          Empezar
        </Button>
        {errorMessage}
      </section>
    );
  }

  if (progress === "done") {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-section">¡Repaso completo!</h2>
        <p className="text-muted-foreground">
          Volverás a ver cada palabra cuando toque repasarla.
        </p>
        <Link href="/home" className={buttonVariants({ variant: "secondary" })}>
          Volver al inicio
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="card-title"
      className="flex flex-col gap-5 rounded-card border-2 bg-card p-5"
    >
      <p className="text-sm font-bold text-muted-foreground">
        Tarjeta {progress.index + 1} de {cards.length}
      </p>
      <h2 id="card-title" className="font-extrabold">
        {TITLES[card.variant]}
      </h2>
      <div className="flex items-start gap-3">
        {card.audioText && (
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label="Escuchar de nuevo"
            onClick={() => speak(card.audioText!)}
          >
            <Volume2 aria-hidden="true" />
          </Button>
        )}
        <p className="text-lg">{card.prompt}</p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!result && !pending) void check();
        }}
      >
        <Label htmlFor="answer">Tu respuesta</Label>
        <Input
          id="answer"
          ref={inputRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          readOnly={result !== null}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {!result && (
          <Button type="submit" disabled={pending}>
            Comprobar
          </Button>
        )}
      </form>

      {result && (
        <>
          <p
            role="status"
            className={
              result.correct
                ? "font-bold text-primary-shade"
                : "font-bold text-destructive"
            }
          >
            {result.correct ? "Correcto" : "Incorrecto"}. Respuesta:{" "}
            {result.expected}
          </p>
          <div
            role="group"
            aria-label="¿Qué tan bien lo recordabas?"
            className="grid grid-cols-2 gap-3"
          >
            {RATINGS.map(({ rating, label }) => (
              <Button
                key={rating}
                ref={rating === 3 ? goodRef : undefined}
                variant="secondary"
                disabled={pending}
                onClick={() => grade(progress, rating)}
              >
                {label}
              </Button>
            ))}
          </div>
        </>
      )}
      {errorMessage}
    </section>
  );
}
