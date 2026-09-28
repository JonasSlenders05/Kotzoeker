import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2.5 text-2xl font-bold tracking-[-0.03em] text-ink",
        className,
      )}
    >
      <span
        aria-hidden
        className="relative size-7 rounded-[9px_9px_9px_2px] bg-plum after:absolute after:top-[9px] after:left-[9px] after:size-2.5 after:rounded-full after:bg-ink"
      />
      kotzoeker
    </Link>
  );
}
