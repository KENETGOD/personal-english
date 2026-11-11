"use client";

import Link from "next/link";
import { useState } from "react";
import { Volume2 } from "lucide-react";
import { beginNewWords, learnWord } from "@/actions/vocabulary";
import { Button, buttonVariants } from "@/components/ui/button";
import { speak } from "@/lib/audio/speak";
import type { Word } from "@/lib/domain/new-words";

type Progress = { sessionId: string; attemptId: string; index: number };

function SpeakButton({ text }: { text: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      aria-label={`Escuchar: ${text}`}
      onClick={() => speak(text)}
    >
      <Volume2 aria-hidden="true" />
    </Button>
  );
}

export function NewWordFlow({ words }: { words: Word[] }) {
  // null = intro; "done" = every word learned.
  const [progress, setProgress] = useState<Progress | "done" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function begin() {
    setPending(true);
    const res = await beginNewWords(words[0].id);
    setPending(false);
    if (!res.ok) return setError(res.error.message);
    setError(null);
    setProgress({ ...res.data, index: 0 });
  }

  async function next(current: Progress) {
    setPending(true);
    const res = await learnWord({
      sessionId: current.sessionId,
      attemptId: current.attemptId,
      contentId: words[current.index].id,
      nextContentId: words[current.index + 1]?.id ?? null,
    });
    setPending(false);
    if (!res.ok) return setError(res.error.message);
    setError(null);
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
          {words.length === 1
            ? "1 palabra nueva hoy"
            : `${words.length} palabras nuevas hoy`}
        </p>
        <p className="text-muted-foreground">
          Verás cada palabra en contexto, con su definición y su audio.
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
        <h2 className="text-section">¡Listo por hoy!</h2>
        <p className="text-muted-foreground">
          Tus palabras nuevas ya están en tu repaso espaciado.
        </p>
        <Link href="/home" className={buttonVariants({ variant: "secondary" })}>
          Volver al inicio
        </Link>
      </section>
    );
  }

  const word = words[progress.index];
  const last = progress.index === words.length - 1;
  return (
    <section
      aria-labelledby="word-title"
      className="flex flex-col gap-5 rounded-card border-2 bg-card p-5"
    >
      <p className="text-sm font-bold text-muted-foreground">
        Palabra {progress.index + 1} de {words.length}
      </p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h2 id="word-title" className="text-display">
            {word.term}
          </h2>
          <SpeakButton text={word.term} />
        </div>
        <p className="text-muted-foreground">{word.ipa}</p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold">En contexto</h3>
        <ul className="flex flex-col gap-3">
          {word.examples.map((example) => (
            <li key={example} className="flex items-start gap-3">
              <SpeakButton text={example} />
              <p className="pt-2">{example}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-extrabold">Definición</h3>
        <p>{word.definitionEn}</p>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-extrabold">En español</h3>
        <p>{word.translationEs}</p>
        {word.notesEs && (
          <p className="text-sm text-muted-foreground">{word.notesEs}</p>
        )}
      </div>

      {errorMessage}
      <Button onClick={() => next(progress)} disabled={pending}>
        {last ? "Terminar" : "Siguiente"}
      </Button>
    </section>
  );
}
