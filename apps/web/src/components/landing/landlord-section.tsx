import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const AI_TAGS = ["22 m²", "Eigen badkamer", "Fietsenstalling", "Gemeubeld"];

export function LandlordSection() {
  return (
    <section id="kotbazen" className="container-page scroll-mt-8 pb-24">
      <div className="grid items-center gap-16 rounded-[36px] bg-ink px-18 py-20 text-surface lg:grid-cols-2">
        <div>
          <p className="eyebrow text-blush">Voor kotbazen</p>
          <h2 className="mb-6 text-[44px] leading-[1.1] font-semibold tracking-[-0.025em]">
            Een paar foto&apos;s en twee zinnen.{" "}
            <span className="text-blush">Wij maken er een zoekertje van.</span>
          </h2>
          <p className="mb-8 text-[17px] text-[#e6d3df]">
            Upload je foto&apos;s, schrijf kort wat je aanbiedt en onze AI vult
            de rest aan. Jij kiest de bezoekmomenten, studenten boeken zelf.
          </p>
          <Button asChild variant="brand" size="pill">
            <Link href="/registreren">Plaats je kot gratis</Link>
          </Button>
        </div>

        {/* Voorbeeld, puur decoratief */}
        <div
          aria-hidden
          className="flex flex-col gap-4 rounded-3xl bg-surface p-6 text-ink"
        >
          <div className="grid h-30 grid-cols-[2fr_1fr_1fr] gap-2">
            <div className="rounded-xl bg-linear-160 from-petal to-soft-blush" />
            <div className="rounded-xl bg-soft-blush" />
            <div className="grid place-items-center rounded-xl border-[1.5px] border-dashed border-ink-muted text-ink-muted">
              <Plus className="size-5" />
            </div>
          </div>
          <p className="rounded-lg border-[1.5px] border-line px-3.5 py-3 text-sm">
            Gerenoveerde studio, 22m², vlak bij de Coupure. Fietsenstalling in
            de tuin.
          </p>
          <div className="rounded-[14px] bg-petal px-4 py-3.5 text-sm">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-[0.06em] text-plum-deep uppercase">
              <Sparkles className="size-3.5" /> Aangevuld
            </p>
            Lichte studio op wandelafstand van de Coupure, met eigen badkamer en
            kitchenette. Ideaal voor studenten van Campus Schoonmeersen.
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {AI_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
