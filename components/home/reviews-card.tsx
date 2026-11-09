import { RefreshCw } from "lucide-react";

/** Spaced repetition arrives in F3, so the count is always zero for now. */
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
      </div>
    </section>
  );
}
