import { Flame, Snowflake, Zap } from "lucide-react";

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export function StreakHeader({
  streak,
  freezes,
  xp,
}: {
  streak: number;
  freezes: number;
  xp: number;
}) {
  return (
    <section aria-label="Racha" className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Flame
          className="size-12 fill-streak text-streak-shade"
          aria-hidden="true"
        />
        <div>
          <p className="text-display" data-testid="streak-count">
            {plural(streak, "día", "días")}
          </p>
          <p className="text-sm text-muted-foreground">
            {streak === 0 ? "Practica hoy para empezar tu racha." : "de racha"}
          </p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2 text-sm font-bold">
        <li className="flex items-center gap-1.5 rounded-lg border-2 bg-card px-3 py-1.5">
          <Snowflake className="size-4 text-primary-shade" aria-hidden="true" />
          {plural(freezes, "protector", "protectores")}
        </li>
        <li className="flex items-center gap-1.5 rounded-lg border-2 bg-card px-3 py-1.5">
          <Zap className="size-4 text-streak-shade" aria-hidden="true" />
          {xp} XP hoy
        </li>
      </ul>
    </section>
  );
}
