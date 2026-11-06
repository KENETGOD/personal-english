"use client";

import { useActionState } from "react";
import { saveSettings } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAILY_GOALS, INTERESTS } from "@/lib/validation/profile";

const INTEREST_LABELS: Record<(typeof INTERESTS)[number], string> = {
  technology: "Tecnología",
  work: "Trabajo",
  travel: "Viajes",
  daily_life: "Vida diaria",
  culture: "Cultura",
};

type Props = {
  initial: {
    displayName: string;
    timezone: string;
    dailyGoal: number;
    activeGoal: number;
    accent: string;
    playbackRate: number;
    interests: string[];
  };
  timezones: string[];
};

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export function SettingsForm({ initial, timezones }: Props) {
  const [state, formAction, pending] = useActionState(saveSettings, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Nombre</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initial.displayName}
          maxLength={60}
          autoComplete="name"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timezone">Zona horaria</Label>
        <Input
          id="timezone"
          name="timezone"
          list="timezone-options"
          defaultValue={initial.timezone}
          required
          aria-describedby="timezone-hint"
        />
        <datalist id="timezone-options">
          {timezones.map((tz) => (
            <option key={tz} value={tz} />
          ))}
        </datalist>
        <p id="timezone-hint" className="text-sm text-muted-foreground">
          Solo puedes cambiarla una vez cada 7 días.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dailyGoal">Meta diaria</Label>
        <select
          id="dailyGoal"
          name="dailyGoal"
          defaultValue={initial.dailyGoal}
          className={selectClass}
          aria-describedby="goal-hint"
        >
          {DAILY_GOALS.map((m) => (
            <option key={m} value={m}>
              {m} minutos
            </option>
          ))}
        </select>
        <p id="goal-hint" className="text-sm text-muted-foreground">
          {initial.dailyGoal !== initial.activeGoal
            ? `Aplica desde mañana. Meta actual: ${initial.activeGoal} minutos.`
            : "Los cambios aplican desde mañana."}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="accent">Acento de referencia</Label>
        <select
          id="accent"
          name="accent"
          defaultValue={initial.accent}
          className={selectClass}
        >
          <option value="en-US">Inglés estadounidense (en-US)</option>
          <option value="en-GB">Inglés británico (en-GB)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="playbackRate">Velocidad de reproducción</Label>
        <select
          id="playbackRate"
          name="playbackRate"
          defaultValue={initial.playbackRate}
          className={selectClass}
        >
          <option value="0.75">0.75×</option>
          <option value="1">1×</option>
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Temas de interés</legend>
        {INTERESTS.map((key) => (
          <label key={key} className="flex min-h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="interests"
              value={key}
              defaultChecked={initial.interests.includes(key)}
              className="size-4"
            />
            {INTEREST_LABELS[key]}
          </label>
        ))}
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.error.message}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm">
          Cambios guardados.
        </p>
      )}
    </form>
  );
}
