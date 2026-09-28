import { Check } from "lucide-react";

const FEATURES = [
  {
    title: "Routes per vervoersmiddel",
    text: "Fiets, te voet of openbaar vervoer, met reistijd.",
  },
  {
    title: "Wat is er in de buurt",
    text: "Supermarkten, fitness, wasserette en meer binnen je straal.",
  },
];

export function CampusSection() {
  return (
    <section
      id="campus"
      className="container-page grid scroll-mt-8 items-center gap-16 pb-24 lg:grid-cols-[1fr_1.1fr]"
    >
      <div>
        <p className="eyebrow">Campus zoeken</p>
        <h2 className="mb-6 text-[44px] leading-[1.1] font-semibold tracking-[-0.025em]">
          Zie meteen hoe ver je les is. En de supermarkt.
        </h2>
        <p className="mb-8 text-[17px] text-ink-muted">
          Kies je campus en zie per kot hoe lang je fietst, stapt of met de tram
          rijdt. In een straal eromheen vind je winkels, sportzalen en alles wat
          je dagelijks nodig hebt.
        </p>
        <ul className="flex flex-col gap-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-petal text-plum-deep">
                <Check className="size-3.5" strokeWidth={3} aria-hidden />
              </span>
              <div>
                <p className="font-semibold">{f.title}</p>
                <p className="text-[15px] text-ink-muted">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-[28px] border-[1.5px] border-line bg-surface-raised p-4">
        <CampusMap />
        <div className="flex gap-4 px-2 pt-4 pb-1 text-[13px] text-ink-muted">
          <Legend className="rounded-full bg-plum" label="Koten" />
          <Legend className="rounded-full bg-plum-deep" label="Voorzieningen" />
          <Legend className="rounded-[3px] bg-ink" label="Campus" />
        </div>
      </div>
    </section>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <i className={`block size-2.5 ${className}`} />
      {label}
    </span>
  );
}

function CampusMap() {
  return (
    <svg
      viewBox="0 0 560 400"
      role="img"
      aria-label="Kaartje met campus, koten en voorzieningen in de buurt"
      className="block h-auto w-full rounded-[18px]"
    >
      <rect width="560" height="400" className="fill-surface" />
      <g
        className="stroke-line"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M-10 120 C 140 100, 220 160, 580 130" />
        <path d="M120 -10 C 140 140, 110 260, 150 410" />
        <path d="M-10 300 C 200 280, 360 320, 580 290" />
        <path d="M380 -10 C 360 120, 420 260, 400 410" />
      </g>
      <path
        d="M-10 220 C 120 200, 260 250, 580 210"
        className="stroke-petal"
        strokeWidth="22"
        fill="none"
      />
      <circle
        cx="260"
        cy="200"
        r="150"
        className="fill-plum/10 stroke-plum"
        strokeWidth="2"
        strokeDasharray="6 6"
      />
      <path
        d="M200 150 C 225 170, 240 185, 260 200"
        className="stroke-plum-deep"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="1 9"
      />

      <g className="text-[12px] font-semibold">
        <rect
          x="222"
          y="178"
          width="76"
          height="44"
          rx="12"
          className="fill-ink"
        />
        <text x="260" y="205" textAnchor="middle" className="fill-surface">
          Campus
        </text>

        <circle
          cx="200"
          cy="150"
          r="18"
          className="fill-plum stroke-surface-raised"
          strokeWidth="4"
        />
        <text x="200" y="154" textAnchor="middle" className="fill-ink">
          €
        </text>
        <circle
          cx="330"
          cy="110"
          r="14"
          className="fill-plum stroke-surface-raised"
          strokeWidth="4"
        />
        <circle
          cx="170"
          cy="280"
          r="14"
          className="fill-plum stroke-surface-raised"
          strokeWidth="4"
        />

        <circle cx="350" cy="260" r="8" className="fill-plum-deep" />
        <circle cx="300" cy="300" r="8" className="fill-plum-deep" />
        <circle cx="150" cy="200" r="8" className="fill-plum-deep" />

        <rect
          x="120"
          y="98"
          width="160"
          height="30"
          rx="15"
          className="fill-surface-raised stroke-line"
        />
        <text x="200" y="118" textAnchor="middle" className="fill-ink">
          € 435 · 11 min fiets
        </text>
        <rect
          x="316"
          y="276"
          width="118"
          height="26"
          rx="13"
          className="fill-surface-raised stroke-line"
        />
        <text
          x="375"
          y="293"
          textAnchor="middle"
          className="fill-ink font-medium"
        >
          Supermarkt · 3 min
        </text>
      </g>
    </svg>
  );
}
