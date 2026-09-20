import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-border bg-surface p-4 md:p-6",
        className,
      )}
      {...props}
    />
  );
}
