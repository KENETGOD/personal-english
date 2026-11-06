"use client";

import { useActionState } from "react";
import { saveSettings } from "@/actions/profile";
import { SettingsSection } from "@/components/settings/section";
import { Button } from "@/components/ui/button";
import { ChoiceChip } from "@/components/ui/choice-chip";
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

export function SettingsForm({ initial, timezones }: Props) {
  const [state, formAction, pending] = useActionState(saveSettings, null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <SettingsSection id="profile-title" title="Perfil">
        <div className="flex flex-col gap-2">
          <Label htmlFor="displayName">Nombre</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={initial.displayName}
            maxLength={60}
            autoComplete="name"
          />
        </div>

        <div className="flex flex-col gap-2">
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
      </SettingsSection>

      <SettingsSection id="practice-title" title="Práctica">
        <fieldset className="flex flex-col" aria-describedby="goal-hint">
          <legend className="mb-2 text-sm font-bold">Meta diaria</legend>
          <div className="grid grid-cols-4 gap-2">
            {DAILY_GOALS.map((m) => (
              <ChoiceChip
                key={m}
                type="radio"
                name="dailyGoal"
                value={m}
                defaultChecked={m === initial.dailyGoal}
              >
                {m} min
              </ChoiceChip>
            ))}
          </div>
          <p id="goal-hint" className="mt-2 text-sm text-muted-foreground">
            {initial.dailyGoal !== initial.activeGoal
              ? `Aplica desde mañana. Meta actual: ${initial.activeGoal} minutos.`
              : "Los cambios aplican desde mañana."}
          </p>
        </fieldset>

        <fieldset className="flex flex-col">
          <legend className="mb-2 text-sm font-bold">
            Acento de referencia
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <ChoiceChip
              type="radio"
              name="accent"
              value="en-US"
              defaultChecked={initial.accent === "en-US"}
            >
              Estadounidense (en-US)
            </ChoiceChip>
            <ChoiceChip
              type="radio"
              name="accent"
              value="en-GB"
              defaultChecked={initial.accent === "en-GB"}
            >
              Británico (en-GB)
            </ChoiceChip>
          </div>
        </fieldset>

        <fieldset className="flex flex-col">
          <legend className="mb-2 text-sm font-bold">
            Velocidad de reproducción
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <ChoiceChip
              type="radio"
              name="playbackRate"
              value="0.75"
              defaultChecked={initial.playbackRate === 0.75}
            >
              0.75×
            </ChoiceChip>
            <ChoiceChip
              type="radio"
              name="playbackRate"
              value="1"
              defaultChecked={initial.playbackRate === 1}
            >
              1×
            </ChoiceChip>
          </div>
        </fieldset>

        <fieldset className="flex flex-col">
          <legend className="mb-2 text-sm font-bold">Temas de interés</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((key) => (
              <ChoiceChip
                key={key}
                type="checkbox"
                name="interests"
                value={key}
                defaultChecked={initial.interests.includes(key)}
              >
                {INTEREST_LABELS[key]}
              </ChoiceChip>
            ))}
          </div>
        </fieldset>
      </SettingsSection>

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
      {state && !state.ok && (
        <p role="alert" className="text-sm font-bold text-destructive">
          {state.error.message}
        </p>
      )}
      {state?.ok && (
        <p
          role="status"
          className="rounded-lg bg-accent p-3 text-sm font-bold text-accent-foreground"
        >
          Cambios guardados.
        </p>
      )}
    </form>
  );
}
