"use client";

import type { LucideIcon } from "lucide-react";
import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

// Only routes that exist today. F2 adds "Inicio" here.
const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/settings", label: "Ajustes", icon: Settings },
];

/** One nav: bottom tab bar below lg, left sidebar from lg. */
export function AppNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 bg-card pb-[env(safe-area-inset-bottom)] lg:inset-y-0 lg:top-[calc(3.5rem+env(safe-area-inset-top))] lg:right-auto lg:bottom-0 lg:w-60 lg:border-t-0 lg:border-r-2 lg:p-3 lg:pb-3"
    >
      <ul className="flex lg:flex-col lg:gap-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-150 outline-none focus-visible:ring-4 focus-visible:ring-ring/40 lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-lg lg:border-2 lg:border-transparent lg:px-4 lg:text-base",
                  active
                    ? "font-extrabold text-primary-shade lg:border-primary-shade/30 lg:bg-accent"
                    : "font-bold text-muted-foreground hover:text-foreground lg:hover:bg-muted",
                )}
              >
                <Icon className="size-6" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
