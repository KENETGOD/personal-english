import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">English Coach</h1>
        <p className="text-muted-foreground">Práctica diaria de inglés.</p>
      </div>
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link href="/login" />}>
          Iniciar sesión
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/signup" />}
        >
          Crear cuenta
        </Button>
      </div>
    </main>
  );
}
