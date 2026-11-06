import { resetPassword } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPage } from "@/components/auth/auth-page";

// Reached from the emailed recovery link; resetPassword() checks the session again.
export default function ResetPasswordPage() {
  return (
    <AuthPage title="Nueva contraseña">
      <AuthForm
        action={resetPassword}
        submitLabel="Guardar contraseña"
        fields={[
          {
            name: "password",
            label: "Contraseña nueva",
            type: "password",
            autoComplete: "new-password",
            hint: "Mínimo 12 caracteres, con mayúsculas, minúsculas y números.",
          },
          {
            name: "confirm",
            label: "Confirmar contraseña",
            type: "password",
            autoComplete: "new-password",
          },
        ]}
      />
    </AuthPage>
  );
}
