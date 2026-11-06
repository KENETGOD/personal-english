"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";

function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-4 focus-visible:ring-ring/25 motion-reduce:transition-none"
      >
        <Icon aria-hidden className="size-5" />
      </button>
    </div>
  );
}

export { PasswordInput };
