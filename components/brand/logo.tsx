import { cn } from "cn";

/** Speech bubble with a check: practice + progress. Colors come from tokens so it follows the theme. */
export function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M9 3h14a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H16l-6.2 5.2a.8.8 0 0 1-1.3-.6V23.7A6 6 0 0 1 3 18V9a6 6 0 0 1 6-6Z"
        className="fill-primary"
      />
      <path
        d="m10.5 13.2 3.9 3.9 7.1-7.2"
        className="stroke-primary-foreground"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  size = 32,
  as: Tag = "span",
  stacked = false,
  className,
}: {
  size?: number;
  as?: "span" | "h1";
  stacked?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        stacked ? "flex-col gap-4" : "gap-2.5",
        className,
      )}
    >
      <LogoMark size={size} />
      <Tag
        className={cn(
          "font-extrabold tracking-tight",
          stacked ? "text-display" : "text-xl",
        )}
      >
        English <span className="text-primary-shade">Coach</span>
      </Tag>
    </span>
  );
}
