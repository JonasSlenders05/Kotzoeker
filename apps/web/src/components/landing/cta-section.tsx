import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="container-page">
      <div className="relative flex items-center justify-between gap-12 overflow-hidden rounded-[36px] bg-plum p-18">
        <span
          aria-hidden
          className="absolute -top-20 right-55 size-55 rounded-full bg-plum-light"
        />
        <span
          aria-hidden
          className="absolute -right-10 -bottom-22 size-65 rounded-full bg-blush"
        />
        <h2 className="relative max-w-[600px] text-5xl leading-[1.05] font-bold tracking-[-0.03em]">
          Je volgende kot is dichter dan je denkt.
        </h2>
        <Button
          asChild
          variant="ink"
          size="pill"
          className="relative h-14 px-7 text-base"
        >
          <Link href="/#top">Begin met zoeken</Link>
        </Button>
      </div>
    </section>
  );
}
