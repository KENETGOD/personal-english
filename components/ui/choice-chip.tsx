import { cn } from "cn";

/** Segmented-control style choice: a native radio/checkbox (keeps form semantics) painted as a chip. */
export function ChoiceChip({
  type,
  name,
  value,
  defaultChecked,
  className,
  children,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string | number;
  defaultChecked?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("relative block cursor-pointer", className)}>
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="flex min-h-12 items-center justify-center rounded-lg border-2 border-input bg-card px-3 text-center text-sm font-bold text-foreground transition-colors duration-150 peer-checked:border-primary-shade peer-checked:bg-accent peer-checked:text-primary-shade peer-focus-visible:ring-4 peer-focus-visible:ring-ring/40 hover:bg-muted peer-checked:hover:bg-accent">
        {children}
      </span>
    </label>
  );
}
