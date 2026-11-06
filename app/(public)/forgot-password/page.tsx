import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPage, linkClass } from "@/components/auth/auth-page";

export default function ForgotPasswordPage() {
  return (
    <AuthPage
      title="Recuperar contraseña"
      intro="Escribe tu correo y te enviaremos un enlace para elegir una contraseña nueva."
    >
      <AuthForm
        action={requestPasswordReset}
        submitLabel="Enviar enlace"
        fields={[
          {
            name: "email",
            label: "Correo electrónico",
            type: "email",
            autoComplete: "email",
          },
        ]}
      />
      <Link href="/login" className={linkClass}>
        Volver a iniciar sesión
      </Link>
    </AuthPage>
  );
}
