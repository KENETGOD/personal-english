import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col items-center justify-center gap-10 px-4 py-12 text-center">
      <div className="flex flex-col items-center gap-5">
        <Logo as="h1" size={72} stacked />
        <p className="text-section text-pretty">
          Practica inglés un poco cada día, a tu ritmo.
        </p>
      </div>
      <div className="flex w-full flex-col gap-4">
        <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
          Crear cuenta
        </Button>
        <Button
          size="lg"
          variant="secondary"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Ya tengo cuenta
        </Button>
      </div>
    </main>
  );
}
