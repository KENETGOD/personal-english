import Link from "next/link";
import { signIn } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPage, linkClass } from "@/components/auth/auth-page";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <AuthPage title="Iniciar sesión">
      {error === "link" && (
        <p role="alert" className="text-sm text-destructive">
          El enlace no es válido o ya expiró. Solicita uno nuevo.
        </p>
      )}
      <AuthForm
        action={signIn}
        submitLabel="Iniciar sesión"
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
            autoComplete: "current-password",
          },
        ]}
      />
      <div className="flex flex-col gap-2">
        <Link href="/forgot-password" className={linkClass}>
          Olvidé mi contraseña
        </Link>
        <Link href="/signup" className={linkClass}>
          Crear una cuenta
        </Link>
      </div>
    </AuthPage>
  );
}
