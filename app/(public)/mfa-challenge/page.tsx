import { verifyLogin } from "@/actions/mfa";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPage } from "@/components/auth/auth-page";

export default function MfaChallengePage() {
  return (
    <AuthPage
      title="Verificación en dos pasos"
      intro="Ingresa el código de 6 dígitos de tu app de autenticación."
    >
      <AuthForm
        action={verifyLogin}
        submitLabel="Verificar"
        fields={[
          {
            name: "code",
            label: "Código de verificación",
            autoComplete: "one-time-code",
            numericCode: true,
          },
        ]}
      />
    </AuthPage>
  );
}
