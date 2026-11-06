"use client";

import { useActionState, useState, useTransition } from "react";
import {
  disableTotp,
  enrollTotp,
  verifyEnrollment,
  type EnrollState,
} from "@/actions/mfa";
import { SettingsSection } from "@/components/settings/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function MfaPanel({ factorId }: { factorId: string | null }) {
  return (
    <SettingsSection id="security-title" title="Seguridad">
      <h3 className="font-bold">Verificación en dos pasos</h3>
      {factorId ? <DisableTotp factorId={factorId} /> : <EnrollTotp />}
    </SettingsSection>
  );
}

function EnrollTotp() {
  const [enroll, setEnroll] = useState<EnrollState>(null);
  const [starting, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(verifyEnrollment, null);

  if (!enroll?.ok) {
    return (
      <>
        <p className="text-sm text-muted-foreground">
          Protege tu cuenta con un código de una app de autenticación.
        </p>
        <Button
          type="button"
          variant="secondary"
          disabled={starting}
          onClick={() =>
            startTransition(async () => setEnroll(await enrollTotp()))
          }
        >
          Activar verificación en dos pasos
        </Button>
        {enroll && !enroll.ok && (
          <p role="alert" className="text-sm font-bold text-destructive">
            {enroll.error.message}
          </p>
        )}
      </>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm">
        Escanea el código QR con tu app de autenticación e ingresa el código de
        6 dígitos.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- inline data URI, not optimizable */}
      <img
        src={enroll.data.qrCode}
        alt="Código QR para la app de autenticación"
        width={192}
        height={192}
        className="self-start rounded-lg border-2 bg-white p-2"
      />
      <p className="text-sm text-muted-foreground">
        ¿No puedes escanear? Clave manual:{" "}
        <code className="break-all">{enroll.data.secret}</code>
      </p>
      <input type="hidden" name="factorId" value={enroll.data.factorId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enroll-code">Código de verificación</Label>
        <Input
          id="enroll-code"
          name="code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        Confirmar y activar
      </Button>
      {state && !state.ok && (
        <p role="alert" className="text-sm font-bold text-destructive">
          {state.error.message}
        </p>
      )}
    </form>
  );
}

function DisableTotp({ factorId }: { factorId: string }) {
  const [state, formAction, pending] = useActionState(disableTotp, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm">
        La verificación en dos pasos está activa. Para desactivarla, confirma tu
        contraseña.
      </p>
      <input type="hidden" name="factorId" value={factorId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="disable-password">Contraseña</Label>
        <PasswordInput
          id="disable-password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        Desactivar verificación en dos pasos
      </Button>
      {state && !state.ok && (
        <p role="alert" className="text-sm font-bold text-destructive">
          {state.error.message}
        </p>
      )}
    </form>
  );
}
