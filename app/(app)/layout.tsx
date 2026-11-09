import Link from "next/link";
import { signOut } from "@/actions/auth";
import { AppNav } from "@/components/app/app-nav";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/home"
            className="rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <Logo />
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>
      <AppNav />
      <div className="flex flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 lg:pl-60">
        {children}
      </div>
    </>
  );
}
