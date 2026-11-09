import { Check, Snowflake } from "lucide-react";
import type { GoalProgress } from "@/lib/domain/goal-progress";

const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;

function caption(p: GoalProgress): string {
  if (p.state === "met") return "Meta cumplida. ¡Buen trabajo!";
  if (p.state === "frozen") return "Hoy te cubrió un protector de racha.";
  if (p.activeMinutes === 0)
    return `Practica ${p.goalMinutes} min para cumplir tu meta.`;
  return `Te faltan ${p.remainingMinutes} min para tu meta.`;
}

/** Daily goal ring; the progressbar role gives screen readers the same numbers. */
export function GoalRing({ progress: p }: { progress: GoalProgress }) {
  return (
    <section
      aria-labelledby="goal-title"
      className="flex flex-col items-center gap-3 rounded-card border-2 bg-card p-5 text-center"
    >
      <h2 id="goal-title" className="text-section">
        Meta diaria
      </h2>
      <div
        role="progressbar"
        aria-labelledby="goal-title"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={p.percent}
        aria-valuetext={`${p.activeMinutes} de ${p.goalMinutes} minutos`}
        className="relative size-40"
      >
        <svg
          viewBox="0 0 120 120"
          aria-hidden="true"
          className="size-full -rotate-90"
        >
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="12"
            className="stroke-muted"
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - p.percent / 100)}
            className="stroke-primary transition-[stroke-dashoffset] duration-200"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {p.state === "met" ? (
            <Check className="size-8 text-primary-shade" aria-hidden="true" />
          ) : p.state === "frozen" ? (
            <Snowflake
              className="size-8 text-primary-shade"
              aria-hidden="true"
            />
          ) : null}
          <span className="text-display">
            {p.activeMinutes}
            <span className="text-sm font-bold text-muted-foreground">
              {" "}
              / {p.goalMinutes} min
            </span>
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{caption(p)}</p>
    </section>
  );
}
