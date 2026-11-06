import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">English Coach</span>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </header>
      {children}
    </>
  );
}
