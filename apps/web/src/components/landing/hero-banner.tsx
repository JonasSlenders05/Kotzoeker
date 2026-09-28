import Image from "next/image";
import { Bike, Footprints, TramFront } from "lucide-react";

const ROUTES = [
  { icon: Bike, label: "Fiets", minutes: 11 },
  { icon: TramFront, label: "Tram 2", minutes: 17 },
  { icon: Footprints, label: "Te voet", minutes: 34 },
];

export function HeroBanner() {
  return (
    <section className="relative h-[540px] overflow-hidden bg-soft-blush">
      <Image
        src="/images/gent-leie.jpg"
        alt="Bakstenen gevels langs de Leie in Gent, weerspiegeld in het water"
        fill
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
        className="object-cover object-[center_42%]"
      />

      <div className="container-page relative h-full">
        {/* Reistijd naar de campus */}
        <div className="absolute bottom-10 left-8 flex min-w-60 flex-col gap-2 rounded-2xl bg-surface-raised p-4 text-sm shadow-[0_20px_40px_-18px_rgb(43_18_39/0.45)]">
          <p className="text-[13px] font-semibold text-ink-muted">
            Naar Campus Schoonmeersen
          </p>
          {ROUTES.map(({ icon: Icon, label, minutes }) => (
            <div key={label} className="flex items-center gap-2.5 font-medium">
              <Icon className="size-5 text-plum-deep" aria-hidden />
              {label}
              <span className="ml-auto font-semibold">{minutes} min</span>
            </div>
          ))}
        </div>

        {/* Matchscore */}
        <div className="absolute right-8 bottom-10 flex w-80 items-center gap-3.5 rounded-2xl bg-surface-raised p-4 shadow-[0_20px_40px_-18px_rgb(43_18_39/0.45)]">
          <MatchRing percent={92} />
          <div>
            <p className="text-[15px] font-semibold">Studio aan de Coupure</p>
            <p className="text-[13px] text-ink-muted">
              € 435 / maand · eigen badkamer
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MatchRing({ percent }: { percent: number }) {
  const radius = 23;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      viewBox="0 0 54 54"
      className="size-13.5 shrink-0"
      aria-label={`${percent}% match`}
    >
      <circle
        cx="27"
        cy="27"
        r={radius}
        fill="none"
        strokeWidth="6"
        className="stroke-petal"
      />
      <circle
        cx="27"
        cy="27"
        r={radius}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - percent / 100)}
        transform="rotate(-90 27 27)"
        className="stroke-plum"
      />
      <text
        x="27"
        y="31"
        textAnchor="middle"
        className="fill-ink text-[13px] font-bold"
      >
        {percent}%
      </text>
    </svg>
  );
}
