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
              <Check
                className="size-4 text-plum-deep"
                strokeWidth={2.5}
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
