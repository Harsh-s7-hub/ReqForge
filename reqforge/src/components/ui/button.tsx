import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "cta-primary",
        variant === "secondary" && "cta-secondary",
        variant === "ghost" &&
          "bg-transparent text-white/80 ring-1 ring-white/15 hover:bg-white/5 hover:text-white",
        className,
      )}
      {...props}
    />
  );
}
