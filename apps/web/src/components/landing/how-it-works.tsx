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
          Geen eindeloos scrollen door zoekertjes. Jij vertelt wat belangrijk
          is, wij tonen wat past.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Step
          number={1}
          title="Vertel wat je zoekt"
          text="Typ het gewoon zoals je het tegen een vriend zou zeggen. Een paar korte vragen doen de rest."
        >
          <p className="rounded-lg border border-dashed border-soft-blush bg-surface px-3.5 py-3 text-sm">
            &ldquo;Iets gezelligs dicht bij Schoonmeersen, niet boven een
            café.&rdquo;
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
            <span className="rounded-lg border-[1.5px] border-line py-2.5">
              Di 16:00
            </span>
            <span className="rounded-lg border-[1.5px] border-ink bg-ink py-2.5 text-surface">
              Wo 13:30
            </span>
            <span className="rounded-lg border-[1.5px] border-line py-2.5">
              Do 18:00
            </span>
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
