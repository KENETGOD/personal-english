import Link from "next/link";
import { signUp } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPage, linkClass } from "@/components/auth/auth-page";

export default function SignUpPage() {
  return (
    <AuthPage
      title="Crear cuenta"
      intro="Te enviaremos un correo para verificar tu cuenta antes de entrar."
    >
      <AuthForm
        action={signUp}
        submitLabel="Crear cuenta"
        fields={[
          {
            name: "email",
            label: "Correo electrónico",
            type: "email",
            autoComplete: "email",
          },
          {
            name: "password",
            label: "Contraseña",
            type: "password",
            autoComplete: "new-password",
            hint: "Mínimo 12 caracteres, con mayúsculas, minúsculas y números.",
          },
        ]}
      />
      <Link href="/login" className={linkClass}>
        Ya tengo una cuenta
      </Link>
    </AuthPage>
  );
}
