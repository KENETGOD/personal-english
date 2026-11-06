import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function AuthPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center gap-8 px-4 py-10">
      <Link
        href="/"
        className="self-center rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
      >
        <Logo />
      </Link>
      <div className="flex flex-col gap-6 sm:rounded-card sm:border-2 sm:bg-card sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-display">{title}</h1>
          {intro && <p className="text-muted-foreground">{intro}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}

export const linkClass =
  "inline-block py-1 text-sm font-bold text-primary-shade underline-offset-4 hover:underline focus-visible:underline";
