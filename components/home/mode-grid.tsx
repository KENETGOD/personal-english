import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Languages, Mic, PenLine, Shuffle } from "lucide-react";
import { cn } from "cn";

// Static class strings so Tailwind can see them. Modes without an href are not built yet.
const MODES: {
  name: string;
  hint: string;
  icon: LucideIcon;
  tint: string;
  href?: string;
}[] = [
  {
    name: "Vocabulary",
    hint: "Palabras y repaso",
    icon: Languages,
    tint: "bg-mode-vocabulary text-mode-vocabulary-foreground",
    href: "/vocabulary",
  },
  {
    name: "Reading",
    hint: "Textos con preguntas",
    icon: BookOpen,
    tint: "bg-mode-reading text-mode-reading-foreground",
  },
  {
    name: "Writing",
    hint: "Escribe y recibe correcciones",
    icon: PenLine,
    tint: "bg-mode-writing text-mode-writing-foreground",
  },
  {
    name: "Speaking",
    hint: "Habla y mejora tu pronunciación",
    icon: Mic,
    tint: "bg-mode-speaking text-mode-speaking-foreground",
  },
  {
    name: "Mixto",
    hint: "Un poco de todo",
    icon: Shuffle,
    tint: "bg-mode-mix text-mode-mix-foreground",
  },
];

export function ModeGrid() {
  return (
    <section aria-labelledby="modes-title" className="flex flex-col gap-3">
      <h2 id="modes-title" className="text-section">
        Practicar
      </h2>
      <ul className="grid grid-cols-1 gap-3 min-[30rem]:grid-cols-2">
        {MODES.map(({ name, hint, icon: Icon, tint, href }, i) => {
          const content = (
            <>
              <Icon className="size-7 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold">{name}</h3>
                <p className="text-sm">{hint}</p>
              </div>
              {!href && (
                <span className="rounded-full border-2 border-current px-2 py-0.5 text-xs font-bold">
                  Próximamente
                </span>
              )}
            </>
          );
          return (
            <li
              key={name}
              className={cn(
                "rounded-card",
                tint,
                i === MODES.length - 1 && "min-[30rem]:col-span-2",
              )}
            >
              {href ? (
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-card p-4 outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 p-4">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
