"use client";

import { useActionState } from "react";
import type { FormState } from "@/actions/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  hint?: string;
  numericCode?: boolean;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
};

export function AuthForm({ action, fields, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {fields.map((f) => (
        <div key={f.name} className="flex flex-col gap-1.5">
          <Label htmlFor={f.name}>{f.label}</Label>
          {f.type === "password" ? (
            <PasswordInput
              id={f.name}
              name={f.name}
              autoComplete={f.autoComplete}
              required
              aria-invalid={state && !state.ok ? true : undefined}
              aria-describedby={f.hint ? `${f.name}-hint` : undefined}
            />
          ) : (
            <Input
              id={f.name}
              name={f.name}
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              required
              aria-invalid={state && !state.ok ? true : undefined}
              aria-describedby={f.hint ? `${f.name}-hint` : undefined}
              {...(f.numericCode
                ? { inputMode: "numeric", pattern: "[0-9]{6}", maxLength: 6 }
                : {})}
            />
          )}
          {f.hint && (
            <p id={`${f.name}-hint`} className="text-sm text-muted-foreground">
              {f.hint}
            </p>
          )}
        </div>
      ))}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : submitLabel}
      </Button>
      {state && !state.ok && (
        <p role="alert" className="text-sm font-bold text-destructive">
          {state.error.message}
        </p>
      )}
      {state?.ok && state.data?.message && (
        <p
          role="status"
          className="rounded-lg bg-accent p-3 text-sm font-bold text-accent-foreground"
        >
          {state.data.message}
        </p>
      )}
    </form>
  );
}
