import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-base font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-[#1d3b2e]",
        secondary: "bg-brand-soft text-brand hover:bg-[#e1ebe4]",
        outline:
          "border border-control bg-surface text-ink hover:bg-brand-soft",
        ghost: "text-ink hover:bg-brand-soft",
        danger: "bg-danger text-white hover:bg-[#8d1f2c]",
      },
      size: {
        default: "min-h-11",
        compact: "min-h-11 px-3",
        icon: "h-11 w-11 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
