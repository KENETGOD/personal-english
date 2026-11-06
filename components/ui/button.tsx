import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  // Pressable: solid face + 4px bottom edge (--edge) that collapses while pressed.
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-transparent text-base font-bold transition-[translate,box-shadow,background-color,color] duration-150 outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_0_var(--primary-shade)] hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_var(--primary-shade)]",
        secondary:
          "border-border bg-card text-foreground shadow-[0_4px_0_color-mix(in_oklch,var(--border),var(--foreground)_15%)] hover:bg-muted active:translate-y-[3px] active:shadow-[0_1px_0_color-mix(in_oklch,var(--border),var(--foreground)_15%)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_4px_0_var(--destructive-shade)] hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_var(--destructive-shade)]",
        ghost: "text-foreground hover:bg-muted",
        link: "text-primary-shade underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-12 w-full gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        sm: "h-10 gap-1.5 px-4 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-14 w-full gap-2 px-6 text-lg",
        icon: "size-12",
        "icon-sm": "size-10",
      },
    },
    compoundVariants: [
      { variant: ["ghost", "link"], className: "shadow-none" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
