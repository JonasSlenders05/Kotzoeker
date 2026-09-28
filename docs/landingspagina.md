# Kotzoeker — landingspagina in de code

Deze gids zet de landingspagina uit het design system om naar je Next.js-app (`apps/web`). Hij volgt wat er al staat: Next 16 (App Router), Tailwind v4 via `globals.css`, shadcn-componenten in `apps/web/src/components/ui` en `lucide-react` voor iconen.

Volgorde:

1. Merkkleuren en font instellen
2. Button uitbreiden
3. Header vernieuwen
4. Landingssecties bouwen
5. De homepage samenstellen

De bannerfoto staat al klaar in `apps/web/public/images/gent-leie.jpg`.

---

## 1. Merkkleuren en font

### 1a. `apps/web/src/app/globals.css`

Voeg een **nieuw** `@theme`-blok met de Kotzoeker-kleuren toe, net onder de `@custom-variant`-regel. Het bestaande `@theme inline`-blok blijft ongewijzigd staan: dat koppelt de shadcn-variabelen aan klassen zoals `border-border` en `bg-background`. Zonder dat blok faalt de build met *Cannot apply unknown utility class `border-border`*. Tailwind maakt van het nieuwe blok automatisch klassen zoals `bg-plum`, `text-ink` en `border-line`.

```css
@theme {
  --color-plum: #ec91d8;
  --color-plum-light: #ffaaea;
  --color-blush: #ffbeef;
  --color-petal: #ffd3da;
  --color-soft-blush: #e9d3d0;
  --color-ink: #2b1227;
  --color-ink-muted: #6b4a63;
  --color-plum-deep: #8e2f7c;
  --color-surface: #fff8fa;
  --color-surface-raised: #ffffff;
  --color-line: #ecd9e3;
}
```

Laat daarna de shadcn-variabelen in `:root` naar die kleuren wijzen, zodat bestaande componenten (login, onboarding) meteen in de huisstijl staan. Pas enkel deze regels in `:root` aan; `--destructive` en de chart- en sidebar-variabelen blijven staan:

```css
:root {
  --background: var(--color-surface);
  --foreground: var(--color-ink);
  --card: var(--color-surface-raised);
  --card-foreground: var(--color-ink);
  --popover: var(--color-surface-raised);
  --popover-foreground: var(--color-ink);
  --primary: var(--color-plum);
  --primary-foreground: var(--color-ink);
  --secondary: var(--color-petal);
  --secondary-foreground: var(--color-ink);
  --muted: var(--color-petal);
  --muted-foreground: var(--color-ink-muted);
  --accent: var(--color-petal);
  --accent-foreground: var(--color-ink);
  --border: var(--color-line);
  --input: var(--color-line);
  --ring: var(--color-ink);
  --radius: 0.5rem;
  /* chart- en sidebar-variabelen ongewijzigd */
}
```

> Tekst op `plum` is altijd `ink`, nooit wit (wit haalt het contrast niet). Daarom is `--primary-foreground` ink.

Voeg onderaan twee eigen utilities toe. Die gebruik je in bijna elke sectie:

```css
/* Inhoud centreren op desktopbreedte (max. 1344px) met 32px marge */
@utility container-page {
  margin-inline: auto;
  width: 100%;
  max-width: 1344px;
  padding-inline: 2rem;
}

/* Klein label boven een kop */
@utility eyebrow {
  margin-bottom: 1rem;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-plum-deep);
}
```

Het `.dark`-blok raak je voorlopig niet aan: de site heeft nog geen dark mode.

### 1b. `apps/web/src/app/layout.tsx`

Vervang Inter door Poppins en zet de taal en metadata juist. Poppins is geen variabel font, dus je geeft de gewichten expliciet mee.

```tsx
import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kotzoeker — vind je kot in Gent",
  description:
    "Beschrijf in je eigen woorden wat je zoekt en vind een kot in de buurt van je campus.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nl"
      className={cn(
        "h-full antialiased font-sans",
        poppins.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
```

---

## 2. Button uitbreiden

### `apps/web/src/components/ui/button.tsx`

Voeg in `buttonVariants` drie varianten en één grootte toe. De rest van het bestand blijft zoals het is.

```ts
variant: {
  // ...bestaande varianten
  brand: "bg-plum font-semibold text-ink hover:bg-plum-light",
  ink: "bg-ink font-semibold text-surface hover:bg-ink/90",
  "outline-ink":
    "border-[1.5px] border-ink bg-transparent font-semibold text-ink hover:bg-petal",
},
size: {
  // ...bestaande groottes
  pill: "h-12 gap-2 rounded-full px-6 text-[15px]",
},
```

Gebruik: `<Button variant="brand" size="pill">Zoeken</Button>`.

---

## 3. Header

### 3a. `apps/web/src/components/logo.tsx` (nieuw)

Er is nog geen logo, dus het woordmerk is tekst naast een plum-vorm.

```tsx
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
```

### 3b. `apps/web/src/components/site-header.tsx`

Dezelfde logica als nu (ingelogd of niet), met de nieuwe opmaak en de ankerlinks.

```tsx
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const NAV_LINKS = [
  { href: "/#hoe-werkt-het", label: "Hoe werkt het" },
  { href: "/#campus", label: "Campus zoeken" },
  { href: "/#kotbazen", label: "Voor kotbazen" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="bg-surface">
      <div className="container-page flex h-21 items-center justify-between">
        <Logo />

        <nav className="hidden gap-8 text-[15px] font-medium text-ink-muted lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{user.firstName}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline-ink" size="pill">
                Uitloggen
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button asChild variant="outline-ink" size="pill">
              <Link href="/login">Inloggen</Link>
            </Button>
            <Button asChild variant="ink" size="pill">
              <Link href="/registreren">Kot plaatsen</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
```

---

## 4. Landingssecties

Alle secties komen in een eigen map: `apps/web/src/components/landing/`. Alleen de zoekbalk heeft state nodig en is dus een Client Component. De rest zijn Server Components.

### 4a. `apps/web/src/components/landing/data.ts`

Vaste inhoud op één plek. Later kun je de campussen uit de database halen.

```ts
export const CAMPUSES = ["Schoonmeersen", "Sterre", "Bijloke", "Mercator"] as const;
export type Campus = (typeof CAMPUSES)[number];

export const SEARCH_EXAMPLES = [
  "Rustig kot met eigen badkamer, max €450…",
  "Studio dicht bij de Overpoort, met fietsenstalling…",
  "Kot met gedeelde keuken, max 10 min fietsen…",
];
```

### 4b. `apps/web/src/components/landing/hero-banner.tsx`

De foto over de volle breedte, met de twee zwevende kaarten. `fill` + `sizes="100vw"` laat Next.js de juiste grootte serveren. Het is het grootste beeld boven de vouw, dus je laadt het meteen (`loading="eager"`, `fetchPriority="high"`). In Next 16 is `priority` vervangen.

```tsx
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
    <svg viewBox="0 0 54 54" className="size-13.5 shrink-0" aria-label={`${percent}% match`}>
      <circle cx="27" cy="27" r={radius} fill="none" strokeWidth="6" className="stroke-petal" />
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
      <text x="27" y="31" textAnchor="middle" className="fill-ink text-[13px] font-bold">
        {percent}%
      </text>
    </svg>
  );
}
```

### 4c. `apps/web/src/components/landing/search-form.tsx`

Client Component: houdt de gekozen campus bij en wisselt de voorbeeldtekst zolang het veld leeg is. Het formulier doet een gewone GET naar `/zoeken?q=…&campus=…`. Die pagina bestaat nog niet, maar zo ligt de URL-structuur al vast.

```tsx
"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CAMPUSES, SEARCH_EXAMPLES, type Campus } from "./data";

export function SearchForm() {
  const [campus, setCampus] = useState<Campus>(CAMPUSES[0]);
  const [query, setQuery] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    if (query) return; // niet wisselen terwijl iemand typt
    const id = setInterval(
      () => setExampleIndex((i) => (i + 1) % SEARCH_EXAMPLES.length),
      3500,
    );
    return () => clearInterval(id);
  }, [query]);

  return (
    <form
      action="/zoeken"
      className="rounded-[20px] border-[1.5px] border-line bg-surface-raised p-3 shadow-[0_18px_40px_-24px_rgb(43_18_39/0.35)] focus-within:border-ink"
    >
      <input type="hidden" name="campus" value={campus} />

      <div className="flex items-center gap-2">
        <Search className="ml-2.5 size-5.5 text-ink-muted" aria-hidden />
        <input
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Beschrijf je ideale kot"
          placeholder={SEARCH_EXAMPLES[exampleIndex]}
          className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base text-ink outline-none placeholder:text-ink-muted"
        />
        <Button type="submit" variant="brand" size="pill">
          Zoeken
        </Button>
      </div>

      <div
        role="group"
        aria-label="Campus"
        className="mt-2 flex flex-wrap items-center gap-2 border-t border-line px-3 pt-3 pb-1"
      >
        <span className="mr-1 text-[13px] font-medium text-ink-muted">Campus</span>
        {CAMPUSES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={c === campus}
            onClick={() => setCampus(c)}
            className={cn(
              "rounded-full border-[1.5px] px-3.5 py-2 text-[13px] leading-none font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink",
              c === campus
                ? "border-plum bg-plum text-ink"
                : "border-line bg-surface text-ink hover:border-soft-blush",
            )}
          >
            {c}
          </button>
        ))}
      </div>
    </form>
  );
}
```

### 4d. `apps/web/src/components/landing/hero.tsx`

Kop en intro links, zoekbalk rechts. Onder `lg` valt alles in één kolom.

```tsx
import { Check } from "lucide-react";
import { SearchForm } from "./search-form";

const TRUST = ["Gratis voor studenten", "Rechtstreeks chatten met je kotbaas"];

export function Hero() {
  return (
    <section className="container-page grid items-end gap-16 pt-18 pb-24 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <p className="eyebrow">Studeren in Gent</p>
        <h1 className="text-5xl leading-none font-bold tracking-[-0.035em] lg:text-[76px]">
          Vind je kot.
          <br />
          <span className="relative isolate whitespace-nowrap after:absolute after:inset-x-[-4px] after:bottom-1.5 after:-z-10 after:h-6 after:rounded-md after:bg-plum">
            Niet de stress.
          </span>
        </h1>
        <p className="mt-6 max-w-[540px] text-[19px] leading-[1.55] text-ink-muted">
          Vertel in je eigen woorden wat je zoekt. Kotzoeker matcht je met koten
          in de buurt van je campus, en je plant meteen een bezoek.
        </p>
      </div>

      <div>
        <SearchForm />
        <ul className="mt-6 flex gap-6 text-sm text-ink-muted">
          {TRUST.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <Check className="size-4 text-plum-deep" strokeWidth={2.5} aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

### 4e. `apps/web/src/components/landing/how-it-works.tsx`

Drie stappen. Elke kaart krijgt een klein voorbeeld mee, dat je als `children` doorgeeft.

```tsx
import type { ReactNode } from "react";

export function HowItWorks() {
  return (
    <section id="hoe-werkt-het" className="container-page scroll-mt-8 pb-24">
      <div className="mb-12 flex items-end justify-between gap-8">
        <div>
          <p className="eyebrow">Zo werkt het</p>
          <h2 className="max-w-[620px] text-[44px] leading-[1.1] font-semibold tracking-[-0.025em]">
            Van zoeken naar sleutel in drie stappen.
          </h2>
        </div>
        <p className="max-w-90 text-ink-muted">
          Geen eindeloos scrollen door zoekertjes. Jij vertelt wat belangrijk is,
          wij tonen wat past.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Step
          number={1}
          title="Vertel wat je zoekt"
          text="Typ het gewoon zoals je het tegen een vriend zou zeggen. Een paar korte vragen doen de rest."
        >
          <p className="rounded-lg border border-dashed border-soft-blush bg-surface px-3.5 py-3 text-sm">
            &ldquo;Iets gezelligs dicht bij Schoonmeersen, niet boven een café.&rdquo;
          </p>
        </Step>

        <Step
          number={2}
          title="Match en chat"
          text="Je krijgt koten die echt bij je passen en stelt je vragen rechtstreeks aan de kotbaas."
        >
          <div className="flex flex-col gap-2 text-[13px]">
            <p className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-plum px-3 py-2">
              Is fietsenstalling inbegrepen?
            </p>
            <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-petal px-3 py-2">
              Ja, overdekt in de binnentuin.
            </p>
          </div>
        </Step>

        <Step
          number={3}
          title="Plan een bezoek"
          text="Kies een vrij moment dat de kotbaas vooraf openzette. Geen gebel, geen gedoe."
        >
          <div className="grid grid-cols-3 gap-2 text-center text-[13px] font-medium">
            <span className="rounded-lg border-[1.5px] border-line py-2.5">Di 16:00</span>
            <span className="rounded-lg border-[1.5px] border-ink bg-ink py-2.5 text-surface">Wo 13:30</span>
            <span className="rounded-lg border-[1.5px] border-line py-2.5">Do 18:00</span>
          </div>
        </Step>
      </div>
    </section>
  );
}

function Step({
  number,
  title,
  text,
  children,
}: {
  number: number;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-[20px] border-[1.5px] border-line bg-surface-raised p-8 transition-colors hover:border-soft-blush">
      <span className="mb-6 grid size-11 place-items-center rounded-[14px] bg-petal font-bold">
        {number}
      </span>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="mb-6 text-[15px] text-ink-muted">{text}</p>
      {children}
    </article>
  );
}
```

### 4f. `apps/web/src/components/landing/campus-section.tsx`

Tekst links, een voorbeeldkaart rechts. Het kaartje is een statische SVG: later vervang je het door een echte kaart (bv. MapLibre) met de routes.

```tsx
import { Check } from "lucide-react";

const FEATURES = [
  { title: "Routes per vervoersmiddel", text: "Fiets, te voet of openbaar vervoer, met reistijd." },
  { title: "Wat is er in de buurt", text: "Supermarkten, fitness, wasserette en meer binnen je straal." },
];

export function CampusSection() {
  return (
    <section id="campus" className="container-page grid scroll-mt-8 items-center gap-16 pb-24 lg:grid-cols-[1fr_1.1fr]">
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
      <g className="stroke-line" strokeWidth="10" fill="none" strokeLinecap="round">
        <path d="M-10 120 C 140 100, 220 160, 580 130" />
        <path d="M120 -10 C 140 140, 110 260, 150 410" />
        <path d="M-10 300 C 200 280, 360 320, 580 290" />
        <path d="M380 -10 C 360 120, 420 260, 400 410" />
      </g>
      <path d="M-10 220 C 120 200, 260 250, 580 210" className="stroke-petal" strokeWidth="22" fill="none" />
      <circle cx="260" cy="200" r="150" className="fill-plum/10 stroke-plum" strokeWidth="2" strokeDasharray="6 6" />
      <path d="M200 150 C 225 170, 240 185, 260 200" className="stroke-plum-deep" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="1 9" />

      <g className="text-[12px] font-semibold">
        <rect x="222" y="178" width="76" height="44" rx="12" className="fill-ink" />
        <text x="260" y="205" textAnchor="middle" className="fill-surface">Campus</text>

        <circle cx="200" cy="150" r="18" className="fill-plum stroke-surface-raised" strokeWidth="4" />
        <text x="200" y="154" textAnchor="middle" className="fill-ink">€</text>
        <circle cx="330" cy="110" r="14" className="fill-plum stroke-surface-raised" strokeWidth="4" />
        <circle cx="170" cy="280" r="14" className="fill-plum stroke-surface-raised" strokeWidth="4" />

        <circle cx="350" cy="260" r="8" className="fill-plum-deep" />
        <circle cx="300" cy="300" r="8" className="fill-plum-deep" />
        <circle cx="150" cy="200" r="8" className="fill-plum-deep" />

        <rect x="120" y="98" width="160" height="30" rx="15" className="fill-surface-raised stroke-line" />
        <text x="200" y="118" textAnchor="middle" className="fill-ink">€ 435 · 11 min fiets</text>
        <rect x="316" y="276" width="118" height="26" rx="13" className="fill-surface-raised stroke-line" />
        <text x="375" y="293" textAnchor="middle" className="fill-ink font-medium">Supermarkt · 3 min</text>
      </g>
    </svg>
  );
}
```

### 4g. `apps/web/src/components/landing/landlord-section.tsx`

De donkere sectie voor kotbazen, met een voorbeeld van foto's + korte tekst + AI-aanvulling.

```tsx
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
            Upload je foto&apos;s, schrijf kort wat je aanbiedt en onze AI vult de
            rest aan. Jij kiest de bezoekmomenten, studenten boeken zelf.
          </p>
          <Button asChild variant="brand" size="pill">
            <Link href="/registreren">Plaats je kot gratis</Link>
          </Button>
        </div>

        {/* Voorbeeld, puur decoratief */}
        <div aria-hidden className="flex flex-col gap-4 rounded-3xl bg-surface p-6 text-ink">
          <div className="grid h-30 grid-cols-[2fr_1fr_1fr] gap-2">
            <div className="rounded-xl bg-linear-160 from-petal to-soft-blush" />
            <div className="rounded-xl bg-soft-blush" />
            <div className="grid place-items-center rounded-xl border-[1.5px] border-dashed border-ink-muted text-ink-muted">
              <Plus className="size-5" />
            </div>
          </div>
          <p className="rounded-lg border-[1.5px] border-line px-3.5 py-3 text-sm">
            Gerenoveerde studio, 22m², vlak bij de Coupure. Fietsenstalling in de tuin.
          </p>
          <div className="rounded-[14px] bg-petal px-4 py-3.5 text-sm">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-[0.06em] text-plum-deep uppercase">
              <Sparkles className="size-3.5" /> Aangevuld
            </p>
            Lichte studio op wandelafstand van de Coupure, met eigen badkamer en
            kitchenette. Ideaal voor studenten van Campus Schoonmeersen.
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {AI_TAGS.map((tag) => (
                <span key={tag} className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium">
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
```

### 4h. `apps/web/src/components/landing/cta-section.tsx`

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="container-page">
      <div className="relative flex items-center justify-between gap-12 overflow-hidden rounded-[36px] bg-plum p-18">
        <span aria-hidden className="absolute -top-20 right-55 size-55 rounded-full bg-plum-light" />
        <span aria-hidden className="absolute -right-10 -bottom-22 size-65 rounded-full bg-blush" />
        <h2 className="relative max-w-[600px] text-5xl leading-[1.05] font-bold tracking-[-0.03em]">
          Je volgende kot is dichter dan je denkt.
        </h2>
        <Button asChild variant="ink" size="pill" className="relative h-14 px-7 text-base">
          <Link href="/#top">Begin met zoeken</Link>
        </Button>
      </div>
    </section>
  );
}
```

### 4i. `apps/web/src/components/site-footer.tsx` (nieuw)

```tsx
import Link from "next/link";
import { Logo } from "@/components/logo";

const LINKS = [
  { href: "/over-ons", label: "Over ons" },
  { href: "/#kotbazen", label: "Voor kotbazen" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="container-page flex items-center justify-between pt-16 pb-12 text-sm text-ink-muted">
      <Logo className="text-xl" />
      <nav className="flex gap-6">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-ink">
            {l.label}
          </Link>
        ))}
      </nav>
      <span>© {new Date().getFullYear()} Kotzoeker</span>
    </footer>
  );
}
```

---

## 5. Homepage samenstellen

### `apps/web/src/app/page.tsx`

Vervang de volledige standaardpagina van create-next-app:

```tsx
import { HeroBanner } from "@/components/landing/hero-banner";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CampusSection } from "@/components/landing/campus-section";
import { LandlordSection } from "@/components/landing/landlord-section";
import { CtaSection } from "@/components/landing/cta-section";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <main id="top" className="flex-1">
      <HeroBanner />
      <Hero />
      <HowItWorks />
      <CampusSection />
      <LandlordSection />
      <CtaSection />
      <SiteFooter />
    </main>
  );
}
```

De standaardbestanden in `apps/web/public` (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`) mag je daarna verwijderen.

---

## Controleren

```bash
pnpm --filter @kotzoeker/web dev        # http://localhost:3000
pnpm --filter @kotzoeker/web typecheck
pnpm --filter @kotzoeker/web lint
```

Kijk na:

- **Fonts:** de headers staan in Poppins. Zie je nog Inter, check dan of `poppins.variable` op `<html>` staat.
- **Knoppen:** `Inloggen` en `Kot plaatsen` in de header zijn pills.
- **Campus-chips:** klikken wisselt de actieve chip, en de voorbeeldtekst wisselt elke 3,5 seconden zolang het veld leeg is.
- **Zoeken:** `Zoeken` stuurt je naar `/zoeken?q=…&campus=…`. Die pagina geeft nu een 404, dat is normaal.
- **Andere pagina's:** login, onboarding en dashboard nemen de nieuwe kleuren over via de shadcn-variabelen.

## Wat nog statisch is

- De reistijden, matchscore en kaart zijn voorbeeldwaarden. Die koppel je later aan echte data (routes-API, matching).
- Links naar `/over-ons`, `/privacy` en `/contact` hebben nog geen pagina.
