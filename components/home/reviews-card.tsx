import Link from "next/link";
import { RefreshCw } from "lucide-react";

export function ReviewsCard({ count }: { count: number }) {
  return (
    <section
      aria-labelledby="reviews-title"
      className="flex items-center gap-3 rounded-card border-2 bg-card p-4"
    >
      <RefreshCw
        className="size-6 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div>
        <h2 id="reviews-title" className="font-extrabold">
          Repasos pendientes: {count}
        </h2>
        <p className="text-sm text-muted-foreground">
          {count === 0
            ? "No tienes repasos por ahora. Aparecerán cuando aprendas palabras nuevas."
            : "Repasa para fijar lo aprendido."}
        </p>
        {count > 0 && (
          <Link href="/vocabulary" className="text-sm font-bold underline">
            Repasar ahora
          </Link>
        )}
      </div>
    </section>
  );
}
