# Kotzoeker — design voor koten in de code

Deze gids zet de drie ontwerpen uit het design system om naar `apps/web`: **Mijn koten** (`/dashboard`), **kot toevoegen/bewerken** (`/dashboard/koten/nieuw` en `/dashboard/koten/[id]`) en de **publieke kotpagina** (`/koten/[slug]`). Hij bouwt op wat er nu staat: dezelfde DAL, Server Actions, schema's en fotobeheerder, met een nieuwe opmaak en een paar kleine uitbreidingen.

Alle code is getest op een kopie van je repo: `tsc`, `eslint` en de Vitest-tests van `packages/shared` slagen, en de drie pagina's zijn in de browser nagekeken met voorbeelddata.

## Wat er verandert

| Onderdeel | Wat |
| --- | --- |
| Kleuren | Witte achtergrond, neutrale grijze vlakken, roze enkel als accent. Nieuwe kleuren `surface-muted`, `line-strong`, `danger`. |
| `packages/shared` | Nieuwe `publishChecklist()`: wat nog ontbreekt om te publiceren. Gebruikt door het dashboard én het formulier, met dezelfde regels als `publishListing`. |
| `ListingCardDto` | Extra velden voor het dashboard: type, straat, m², totaal per maand, beschikbaarheid, aantal foto's, wat nog ontbreekt. |
| Nieuwe action | `markListingRented`: een gepubliceerd kot als verhuurd markeren. |
| Dashboard | Statusfilter (via `?status=`), rijen met cover en voortgang, acties in een menu. |
| Formulier | Drie kolommen: inhoudstafel, secties, vaste zijbalk met checklist en knoppen. Foto's als eerste sectie. |
| Publieke pagina | Fotoraster met lightbox, feitkaarten, voorzieningen per privé/gedeeld, vaste prijskaart, deelknop. |

Er komen geen nieuwe packages bij: het menu gebruikt `DropdownMenu` uit `radix-ui`, dat al geïnstalleerd is.

Werk in deze volgorde; na elke stap moet `pnpm --filter @kotzoeker/web typecheck` slagen.

---

## 1. Kleuren

### `apps/web/src/app/globals.css`

Vervang het `@theme`-blok (niet het `@theme inline`-blok) door:

```css
@theme {
  --color-plum: #ec91d8;
  --color-plum-light: #ffaaea;
  --color-blush: #ffbeef;
  --color-petal: #ffd3da;
  --color-soft-blush: #e9d3d0;
  --color-ink: #2b1227;
  --color-ink-muted: #615a66;
  --color-plum-deep: #8e2f7c;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-surface-muted: #f5f4f6;
  --color-line: #e6e2e8;
  --color-line-strong: #d9d3dc;
  --color-danger: #a3123c;
  --color-danger-soft: #fff5f7;
}
```

Pas in `:root` deze vier regels aan, zodat de shadcn-componenten (login, onboarding, dialogen) ook neutraal grijs worden in plaats van roze:

```css
  --secondary: var(--color-surface-muted);
  --muted: var(--color-surface-muted);
  --accent: var(--color-surface-muted);
  --destructive: var(--color-danger);
```

## 2. Button

### `apps/web/src/components/ui/button.tsx`

Bij de varianten: `outline-ink` krijgt een grijze hover, en er komt `quiet` bij.

```ts
        "outline-ink":
          "border-[1.5px] border-ink bg-transparent font-semibold text-ink hover:bg-surface-muted",
        quiet: "bg-transparent font-semibold text-ink hover:bg-surface-muted",
```

Bij de groottes, onder `pill`:

```ts
        "pill-sm": "h-9 gap-1.5 rounded-full px-3.5 text-[13px]",
```

## 3. De publicatie-checklist in `packages/shared`

Eén functie die zegt wat nog ontbreekt om te publiceren. Ze gebruikt `ListingPublishable` en telt de foto's mee, net als `publishListing` in de DAL. Omdat ze in `packages/shared` staat, gebruiken de server (dashboard) en de browser (formulier) exact dezelfde regels.

### `packages/shared/src/publish-checklist.ts` (nieuw)

```ts
// packages/shared/src/publish-checklist.ts
import { ListingPublishable } from "./listing";

/** De onderdelen van het formulier; de ids zijn ook de ankers op de bewerkpagina. */
export type ListingSection =
  | "fotos"
  | "basis"
  | "prijs"
  | "adres"
  | "voorwaarden"
  | "voorzieningen";

export type PublishCheck = {
  key: string;
  label: string;
  section: ListingSection;
  ok: boolean;
};

// Elke controle groepeert een of meer velden van ListingPublishable.
const CHECKS: { key: string; label: string; section: ListingSection; fields: string[] }[] = [
  { key: "basis", label: "Titel en type", section: "basis", fields: ["title", "type"] },
  { key: "description", label: "Beschrijving", section: "basis", fields: ["description"] },
  { key: "price", label: "Huur en kosten", section: "prijs", fields: ["rentEuro", "costsEuro", "depositEuro", "costsIncluded"] },
  { key: "address", label: "Adres", section: "adres", fields: ["street", "houseNumber", "box", "postalCode", "city"] },
  { key: "size", label: "Oppervlakte", section: "voorwaarden", fields: ["sizeM2"] },
  { key: "available", label: "Beschikbaar vanaf", section: "voorwaarden", fields: ["availableFrom"] },
  { key: "terms", label: "Huurvoorwaarden", section: "voorwaarden", fields: ["leaseType", "minLeaseMonths", "epcLabel", "hasConformityCertificate"] },
  { key: "amenities", label: "Voorzieningen", section: "voorzieningen", fields: ["amenities"] },
];

/**
 * Wat er nog ontbreekt om te publiceren. Dezelfde regels als publishListing:
 * ListingPublishable plus minstens één foto.
 */
export function publishChecklist(values: unknown, photoCount: number): PublishCheck[] {
  const result = ListingPublishable.safeParse(values);
  const invalid = new Set(result.success ? [] : result.error.issues.map((i) => String(i.path[0])));

  return [
    { key: "photos", label: "Minstens 1 foto", section: "fotos", ok: photoCount > 0 },
    ...CHECKS.map(({ fields, ...check }) => ({
      ...check,
      ok: !fields.some((field) => invalid.has(field)),
    })),
  ];
}
```

### `packages/shared/src/publish-checklist.test.ts` (nieuw)

```ts
// packages/shared/src/publish-checklist.test.ts
import { describe, expect, it } from "vitest";
import { publishChecklist } from "./publish-checklist";

const complete = {
  type: "room",
  title: "Ruim kot vlak bij campus Schoonmeersen",
  description: "Lichte kamer van 16 m² met lavabo, gedeelde keuken en fietsenstalling. Rustige straat.",
  rentEuro: 450,
  costsEuro: 60,
  costsIncluded: false,
  street: "Valentin Vaerwyckweg",
  houseNumber: "1",
  postalCode: "9000",
  city: "Gent",
  availableFrom: "2027-09-01",
  leaseType: "academic_year",
  sizeM2: 16,
  hasConformityCertificate: true,
  amenities: [],
};

const missing = (values: unknown, photos: number) =>
  publishChecklist(values, photos).filter((c) => !c.ok).map((c) => c.key);

describe("publishChecklist", () => {
  it("is volledig voor een kot met alles en een foto", () => {
    expect(missing(complete, 1)).toEqual([]);
  });

  it("mist een foto", () => {
    expect(missing(complete, 0)).toEqual(["photos"]);
  });

  it("toont welke velden ontbreken", () => {
    const draft = { ...complete, description: "Kort", sizeM2: undefined };
    expect(missing(draft, 1)).toEqual(["description", "size"]);
  });
});
```

### `packages/shared/src/index.ts`

Voeg onderaan toe:

```ts
export * from "./publish-checklist";
```

### `packages/shared/src/dto/listing.ts`

Vervang `ListingCardDto` door:

```ts
export type ListingCardDto = {
  id: string;
  title: string;
  status: ListingStatus;
  slug: string | null;
  type: ListingType;
  street: string; // zonder huisnummer: het dashboard toont wat studenten ook zien
  city: string;
  sizeM2: number | null;
  rentCents: number;
  monthlyCents: number; // huur + kosten, tenzij de kosten inbegrepen zijn
  costsIncluded: boolean;
  availableFrom: string | null;
  coverThumbUrl: string | null;
  photoCount: number;
  /** Labels van wat nog ontbreekt om te publiceren. Leeg = klaar. */
  missing: string[];
  updatedAt: string;
};
```

```powershell
pnpm --filter @kotzoeker/shared test   # 20 tests
```

## 4. DAL en Server Action

### `apps/web/src/server/dal/listing.ts`

Voeg `publishChecklist` toe aan de import uit `@kotzoeker/shared`, en vervang `findListingsByLandlord` door de versie hieronder. Ze haalt de volledige rij op (voor de checklist) en telt de foto's met een subquery (`db.$count`), in één query.

```ts
export async function findListingsByLandlord(
  landlordId: string,
): Promise<ListingCardDto[]> {
  const rows = await db
    .select({
      listing: listings,
      coverPath: listingPhotos.storagePath,
      photoCount: db.$count(
        listingPhotos,
        eq(listingPhotos.listingId, listings.id),
      ),
    })
    .from(listings)
    .leftJoin(
      listingPhotos,
      and(
        eq(listingPhotos.listingId, listings.id),
        eq(listingPhotos.isCover, true),
      ),
    )
    .where(eq(listings.landlordId, landlordId))
    .orderBy(desc(listings.updatedAt));

  return rows.map(({ listing: row, coverPath, photoCount }) => {
    // Voorzieningen zijn nooit verplicht, dus een lege lijst volstaat voor de checklist.
    const checklist = publishChecklist(toFormValues(row, []), photoCount);
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      slug: row.slug,
      type: row.type,
      street: row.street,
      city: row.city,
      sizeM2: row.sizeM2,
      rentCents: row.rentCents,
      monthlyCents: row.costsIncluded
        ? row.rentCents
        : row.rentCents + row.costsCents,
      costsIncluded: row.costsIncluded,
      availableFrom: row.availableFrom,
      coverThumbUrl: coverPath ? thumbUrl(coverPath) : null,
      photoCount,
      missing: checklist.filter((c) => !c.ok).map((c) => c.label),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}
```

Voeg onder `publishListing` toe:

```ts
/** Enkel een gepubliceerd kot kan verhuurd worden. false = niet gevonden of niet gepubliceerd. */
export async function markListingRented(
  landlordId: string,
  listingId: string,
): Promise<boolean> {
  const updated = await db
    .update(listings)
    .set({ status: "rented" })
    .where(
      and(ownedBy(landlordId, listingId), eq(listings.status, "published")),
    )
    .returning({ id: listings.id });
  return updated.length > 0;
}
```

### `apps/web/src/app/dashboard/koten/actions.ts`

Voeg onderaan toe:

```ts
export async function markListingRented(
  listingId: unknown,
): Promise<ActionResult> {
  const user = await requireRole("landlord");
  const id = ListingId.safeParse(listingId);
  if (!id.success) return NOT_FOUND;

  if (!(await listingsDal.markListingRented(user.id, id.data))) {
    return { ok: false, message: "Enkel een gepubliceerd kot kan je als verhuurd markeren." };
  }

  revalidateListing(id.data);
  return { ok: true };
}
```

## 5. Gedeelde componenten

### `apps/web/src/components/listings/status-badge.tsx` (nieuw)

Het statuslabel uit het design system: draft wit met rand, gepubliceerd roze, verhuurd inkt, gearchiveerd grijs.

```tsx
// apps/web/src/components/listings/status-badge.tsx
import type { ListingStatus } from "@kotzoeker/shared";
import { STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

const STYLES: Record<ListingStatus, string> = {
  draft: "bg-surface-raised text-ink ring-[1.5px] ring-inset ring-line-strong before:border-[1.5px] before:border-ink-muted before:bg-transparent",
  published: "bg-plum text-ink",
  rented: "bg-ink text-surface",
  archived: "bg-surface-muted text-ink-muted",
};

export function StatusBadge({ status, className }: { status: ListingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6.5 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        "before:size-[7px] before:rounded-full before:bg-current before:content-['']",
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
```

### `apps/web/src/components/listings/page-heading.tsx` (nieuw)

```tsx
// apps/web/src/components/listings/page-heading.tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/** Kruimelpad en titel boven het kotformulier. */
export function PageHeading({ crumb, title, children }: { crumb: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      <p className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link href="/dashboard" className="font-medium text-plum-deep">
          Mijn koten
        </Link>
        <ChevronRight className="size-3.5" />
        {crumb}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-[34px] leading-[1.15] font-semibold tracking-[-0.025em]">{title}</h1>
        {children}
      </div>
    </div>
  );
}
```

### `apps/web/src/components/listings/form-parts.tsx` (nieuw)

De bouwstenen van het formulier: sectiekaart, veld met label/fout/hint, invoer met € of eenheid, en een segmented control (voor huurtype, EPC-label en privé/gedeeld).

```tsx
// apps/web/src/components/listings/form-parts.tsx
// Bouwstenen voor het kotformulier: sectie, veld, segmented control en invoer met € of eenheid.
"use client";

import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/** Extra stijl voor Input en Textarea in het kotformulier (hoger, dikkere rand). */
export const fieldInputClass =
  "h-12 rounded-lg border-[1.5px] border-line bg-surface-raised px-3.5 text-[15px] shadow-none hover:border-line-strong md:text-[15px]";

/** Stijl voor een Switch in de huisstijl: inkt als hij aan staat. */
export const switchClass = "data-checked:bg-ink data-unchecked:bg-line-strong";

export function FormSection(props: {
  id: string;
  title: string;
  aside?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={props.id}
      aria-labelledby={`${props.id}-title`}
      className="scroll-mt-6 rounded-[20px] border-[1.5px] border-line bg-surface-raised p-8"
    >
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 id={`${props.id}-title`} className="text-[22px] font-semibold tracking-[-0.015em]">
          {props.title}
        </h2>
        {props.aside && <p className="text-sm text-ink-muted">{props.aside}</p>}
      </div>
      {props.children}
    </section>
  );
}

export function Field(props: {
  id: string;
  label: string;
  optional?: boolean;
  note?: string;
  error?: string;
  hint?: string;
  /** Rechts naast het label, bv. een teller of knop. */
  side?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", props.className)}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={props.id} className="text-sm font-semibold">
          {props.label}
          {(props.optional || props.note) && (
            <small className="ml-1 font-normal text-ink-muted">
              {props.note ?? "optioneel"}
            </small>
          )}
        </Label>
        {props.side}
      </div>
      {props.children}
      {props.error ? (
        <ErrorText id={`${props.id}-error`}>{props.error}</ErrorText>
      ) : (
        props.hint && <p className="text-[13px] text-ink-muted">{props.hint}</p>
      )}
    </div>
  );
}

export function ErrorText({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-center gap-1.5 text-[13px] font-medium text-danger">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

/** Een invoerveld met een vast teken ervoor (€) of een eenheid erachter (m², maanden). */
export function Affix(props: { prefix?: string; suffix?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative",
        props.prefix && "[&_input]:pl-8",
        props.suffix && "[&_input]:pr-24",
      )}
    >
      {props.prefix && (
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[15px] text-ink-muted">
          {props.prefix}
        </span>
      )}
      {props.children}
      {props.suffix && (
        <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[15px] text-ink-muted">
          {props.suffix}
        </span>
      )}
    </div>
  );
}

type Option<T extends string> = { value: T; label: string };

/**
 * Een rij knoppen waarvan er één gekozen is (radiogroup).
 * `pills`: grijze band met een witte gekozen knop. `chips`: losse knoppen, de gekozen is inkt.
 */
export function Segmented<T extends string>(props: {
  id?: string;
  label: string;
  value: T | undefined;
  options: Option<T>[];
  onChange: (value: T) => void;
  variant?: "pills" | "chips";
  size?: "md" | "sm";
}) {
  const { variant = "pills", size = "md" } = props;

  return (
    <div
      id={props.id}
      role="radiogroup"
      aria-label={props.label}
      className={cn(
        "flex flex-wrap",
        variant === "pills" && "w-fit gap-0.5 rounded-full bg-surface-muted p-1",
        variant === "chips" && "gap-1.5",
      )}
    >
      {props.options.map((option) => {
        const checked = option.value === props.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => props.onChange(option.value)}
            className={cn(
              "font-medium whitespace-nowrap text-ink transition-colors",
              variant === "pills" && [
                "rounded-full",
                size === "md" ? "h-9.5 px-4 text-sm" : "h-7.5 px-3 text-[13px]",
                checked && "bg-surface-raised font-semibold shadow-[0_1px_3px_rgb(43_18_39/0.18)]",
              ],
              variant === "chips" && [
                "h-10 min-w-11 rounded-[10px] border-[1.5px] px-3 text-sm font-semibold",
                checked ? "border-ink bg-ink text-surface" : "border-line bg-surface hover:border-line-strong",
              ],
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
```

## 6. Mijn koten

### `apps/web/src/app/dashboard/page.tsx` (volledig vervangen)

De filter werkt met een query-parameter (`/dashboard?status=draft`), zodat de pagina een Server Component blijft en je een gefilterde link kan delen of verversen.

```tsx
// apps/web/src/app/dashboard/page.tsx
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, DoorOpen, ImageIcon, MapPin, Plus } from "lucide-react";
import type { ListingCardDto, ListingStatus } from "@kotzoeker/shared";
import { requireRole } from "@/lib/auth";
import { formatDate, formatEuro } from "@/lib/format";
import { LISTING_TYPE_LABELS, STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { findListingsByLandlord } from "@/server/dal/listing";
import { Button } from "@/components/ui/button";
import { ListingRowActions } from "@/components/listings/listing-row-actions";
import { StatusBadge } from "@/components/listings/status-badge";

const FILTERS: ListingStatus[] = ["published", "draft", "rented", "archived"];

type Props = { searchParams: Promise<{ status?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const user = await requireRole("landlord");
  const listings = await findListingsByLandlord(user.id);

  // Filteren gebeurt in het geheugen: een kotbaas heeft hoogstens enkele tientallen koten.
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f === status);
  const shown = filter ? listings.filter((l) => l.status === filter) : listings;
  const count = (s: ListingStatus) => listings.filter((l) => l.status === s).length;

  return (
    <main className="container-page flex-1 pt-12 pb-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-8">
        <div>
          <p className="eyebrow mb-2">Dashboard kotbaas</p>
          <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.025em]">Mijn koten</h1>
          <p className="mt-2 text-ink-muted">
            Welkom terug, {user.firstName}. Hier beheer je je koten en zet je ze online.
          </p>
        </div>
        {listings.length > 0 && (
          <Button asChild variant="brand" size="pill">
            <Link href="/dashboard/koten/nieuw">
              <Plus className="size-4.5" /> Kot toevoegen
            </Link>
          </Button>
        )}
      </div>

      {listings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <nav aria-label="Filter op status" className="mb-6 flex flex-wrap gap-2 border-b border-line pb-4">
            <FilterLink href="/dashboard" active={!filter} label="Alle" count={listings.length} />
            {FILTERS.map((f) => (
              <FilterLink
                key={f}
                href={`/dashboard?status=${f}`}
                active={filter === f}
                label={STATUS_LABELS[f]}
                count={count(f)}
              />
            ))}
          </nav>

          {shown.length === 0 ? (
            <p className="py-10 text-center text-ink-muted">Geen koten met deze status.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {shown.map((kot) => (
                <li key={kot.id}>
                  <ListingRow kot={kot} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

function FilterLink(props: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={props.href}
      aria-current={props.active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-medium transition-colors",
        props.active
          ? "border-ink bg-ink text-surface"
          : "border-line bg-surface text-ink hover:border-line-strong",
      )}
    >
      {props.label}
      <span
        className={cn(
          "grid h-5.5 min-w-5.5 place-items-center rounded-full px-1.5 text-xs font-semibold",
          props.active ? "bg-plum text-ink" : "bg-surface-muted",
        )}
      >
        {props.count}
      </span>
    </Link>
  );
}

function ListingRow({ kot }: { kot: ListingCardDto }) {
  const isDraft = kot.status === "draft";

  return (
    <article className="grid items-center gap-7 rounded-[20px] border-[1.5px] border-line bg-surface-raised p-4 transition-colors hover:border-line-strong md:grid-cols-[208px_1fr_auto]">
      <Cover kot={kot} />

      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[19px] font-semibold tracking-[-0.01em]">{kot.title}</h2>
          <StatusBadge status={kot.status} />
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
          <Meta icon={<MapPin />}>{isDraft ? kot.city : `${kot.street}, ${kot.city}`}</Meta>
          <li>
            <strong className="font-semibold text-ink">{formatEuro(kot.monthlyCents)}</strong> / maand
            {kot.costsIncluded && ", alles inbegrepen"}
          </li>
          <Meta icon={<DoorOpen />}>
            {LISTING_TYPE_LABELS[kot.type]}
            {kot.sizeM2 && ` · ${kot.sizeM2} m²`}
          </Meta>
          {kot.status === "published" && (
            <Meta icon={<CalendarDays />}>
              {kot.availableFrom ? `Vrij vanaf ${formatDate(kot.availableFrom)}` : "Nu vrij"}
            </Meta>
          )}
        </ul>

        {isDraft ? (
          <DraftProgress missing={kot.missing} />
        ) : (
          <p className="text-[13px] text-ink-muted">
            {kot.status === "published" && <>Gewijzigd op {formatDate(kot.updatedAt)}</>}
            {kot.status === "rented" && "Niet zichtbaar voor studenten. Zet het terug online als het opnieuw vrijkomt."}
            {kot.status === "archived" && <>Gearchiveerd · laatst gewijzigd op {formatDate(kot.updatedAt)}</>}
          </p>
        )}
      </div>

      <ListingRowActions id={kot.id} status={kot.status} slug={kot.slug} />
    </article>
  );
}

function Cover({ kot }: { kot: ListingCardDto }) {
  if (!kot.coverThumbUrl) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-[14px] border-[1.5px] border-dashed border-line-strong md:w-52">
        <span className="flex flex-col items-center gap-1.5 text-[13px] font-medium text-ink-muted">
          <ImageIcon className="size-7 text-plum-deep" />
          Nog geen foto&apos;s
        </span>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[14px] bg-surface-muted md:w-52">
      <Image
        src={kot.coverThumbUrl}
        alt=""
        fill
        sizes="208px"
        className={cn("object-cover", kot.status === "archived" && "opacity-70 grayscale-[.7]")}
      />
      <span className="absolute right-2 bottom-2 flex h-6 items-center gap-1 rounded-full bg-ink/80 px-2 text-xs font-semibold text-white">
        <ImageIcon className="size-3.5" /> {kot.photoCount}
      </span>
    </div>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5 [&>svg]:size-4 [&>svg]:text-plum-deep">
      {icon}
      {children}
    </li>
  );
}

function DraftProgress({ missing }: { missing: string[] }) {
  const total = 9; // aantal controles in publishChecklist
  const done = total - missing.length;

  if (missing.length === 0) {
    return <p className="text-[13px] font-medium text-ink">Klaar om te publiceren.</p>;
  }

  return (
    <div className="flex max-w-[620px] items-center gap-4 rounded-xl border-[1.5px] border-dashed border-line-strong px-3.5 py-2.5">
      <span className="h-2 w-30 shrink-0 overflow-hidden rounded bg-surface-muted" aria-hidden>
        <span className="block h-full rounded bg-plum-deep" style={{ width: `${(done / total) * 100}%` }} />
      </span>
      <p className="text-[13px]">
        <b className="font-semibold">
          Nog {missing.length} {missing.length === 1 ? "ding" : "dingen"}
        </b>{" "}
        voor je kan publiceren: {missing.join(", ").toLowerCase()}.
      </p>
    </div>
  );
}

function EmptyState() {
  const steps = [
    "Vul de basis in: titel, huur en adres",
    "Voeg foto's toe en sleep je beste foto naar voor",
    "Publiceer, en studenten vinden je kot meteen",
  ];
  return (
    <section className="grid items-center gap-12 rounded-[20px] border-[1.5px] border-line bg-surface-raised p-14 md:grid-cols-[1fr_380px]">
      <div>
        <h2 className="mb-3 text-[28px] font-semibold tracking-[-0.02em]">Zet je eerste kot online</h2>
        <p className="text-ink-muted">
          Het duurt een paar minuten. Je kan tussendoor opslaan als draft en later verder werken.
        </p>
        <ol className="my-6 flex flex-col gap-3">
          {steps.map((step, i) => (
            <li key={step} className="flex items-center gap-3 text-[15px]">
              <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-surface-muted text-[13px] font-bold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <Button asChild variant="brand" size="pill">
          <Link href="/dashboard/koten/nieuw">
            <Plus className="size-4.5" /> Eerste kot toevoegen
          </Link>
        </Button>
      </div>
      <div aria-hidden className="flex flex-col gap-3 rounded-[20px] border-[1.5px] border-dashed border-line-strong p-4">
        <div className="aspect-[4/3] rounded-[14px] bg-surface-muted" />
        <div className="h-3 w-[70%] rounded-md bg-surface-muted" />
        <div className="h-3 w-[45%] rounded-md bg-surface-muted" />
      </div>
    </section>
  );
}
```

### `apps/web/src/components/listings/listing-row-actions.tsx` (volledig vervangen)

De hoofdactie hangt af van de status (Verder invullen, Bewerken + Bekijken, of Opnieuw publiceren); de rest zit in een menu. Archiveren vraagt nog altijd een bevestiging, nu via een gecontroleerde `AlertDialog`, want de trigger zit in het menu.

```tsx
// apps/web/src/components/listings/listing-row-actions.tsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Archive, Check, Ellipsis, Eye, Pencil, Send } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import type { ListingStatus } from "@kotzoeker/shared";
import {
  archiveListing,
  markListingRented,
  publishListing,
} from "@/app/dashboard/koten/actions";
import type { ActionResult } from "@/lib/action-result";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = { id: string; status: ListingStatus; slug: string | null };

export function ListingRowActions({ id, status, slug }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const run = (action: () => Promise<ActionResult>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message);
    });
  };

  const editHref = `/dashboard/koten/${id}`;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {status === "draft" && (
          <Button asChild variant="ink" size="pill-sm">
            <Link href={editHref}>
              <Pencil /> Verder invullen
            </Link>
          </Button>
        )}

        {status === "published" && (
          <>
            <Button asChild variant="outline-ink" size="pill-sm">
              <Link href={editHref}>
                <Pencil /> Bewerken
              </Link>
            </Button>
            {slug && (
              <Button asChild variant="quiet" size="pill-sm">
                <Link href={`/koten/${slug}`}>
                  <Eye /> Bekijken
                </Link>
              </Button>
            )}
          </>
        )}

        {(status === "rented" || status === "archived") && (
          <Button
            variant="outline-ink"
            size="pill-sm"
            disabled={pending}
            onClick={() => run(() => publishListing(id))}
          >
            <Send /> Opnieuw publiceren
          </Button>
        )}

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Meer acties"
              className="grid size-9 place-items-center rounded-full hover:bg-surface-muted"
            >
              <Ellipsis className="size-4.5" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 w-56 rounded-[14px] border-[1.5px] border-line bg-surface-raised p-1.5 shadow-[0_20px_40px_-18px_rgb(43_18_39/0.45)]"
            >
              {status !== "draft" && status !== "published" && (
                <MenuItem asLink href={editHref} icon={<Pencil />}>
                  Bewerken
                </MenuItem>
              )}
              {status === "published" && (
                <MenuItem icon={<Check />} onSelect={() => run(() => markListingRented(id))}>
                  Markeer als verhuurd
                </MenuItem>
              )}
              {status !== "archived" && (
                <MenuItem icon={<Archive />} onSelect={() => setConfirmArchive(true)}>
                  Archiveren
                </MenuItem>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {error && (
        <p role="alert" className="max-w-60 text-right text-[13px] font-medium text-danger">
          {error}
        </p>
      )}

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kot archiveren?</AlertDialogTitle>
            <AlertDialogDescription>
              Het kot verdwijnt van de site en uit de zoekresultaten. Je kan het later opnieuw publiceren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={() => run(() => archiveListing(id))}>Archiveren</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MenuItem(props: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onSelect?: () => void;
  asLink?: boolean;
  href?: string;
}) {
  const className =
    "flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 text-sm font-medium text-ink outline-none data-highlighted:bg-surface-muted [&>svg]:size-4 [&>svg]:text-plum-deep";

  if (props.asLink && props.href) {
    return (
      <DropdownMenu.Item asChild className={className}>
        <Link href={props.href}>
          {props.icon}
          {props.children}
        </Link>
      </DropdownMenu.Item>
    );
  }
  return (
    <DropdownMenu.Item className={className} onSelect={props.onSelect}>
      {props.icon}
      {props.children}
    </DropdownMenu.Item>
  );
}
```

## 7. Kot toevoegen en bewerken

De logica van `ListingForm` (validatie, opslaan, publiceren, foutmeldingen van de server) blijft dezelfde. Wat verandert:

- Het formulier tekent de volledige layout: inhoudstafel links, secties in het midden, `PublishPanel` rechts.
- De fotobeheerder komt als prop `photos` binnen en staat als eerste sectie. Hij blijft een eigen Client Component; `photoCount` en `coverUrl` voeden de checklist en het voorbeeld.
- `useWatch` levert de live waarden voor de checklist, de tellers, het totaal per maand en het voorbeeld.
- Na een eerste poging tot publiceren kleuren onvolledige onderdelen in de inhoudstafel rood, en worden alle ontbrekende velden meteen gemarkeerd.

### `apps/web/src/components/listings/listing-form.tsx` (volledig vervangen)

```tsx
// apps/web/src/components/listings/listing-form.tsx
"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BedSingle, Building2, Check, DoorOpen, Lock, Sparkles, Users, X } from "lucide-react";
import {
  EPC_LABELS,
  LEASE_TYPES,
  LISTING_TYPES,
  ListingDraft,
  ListingPublishable,
  publishChecklist,
  toCents,
  type AmenityOptionDto,
  type ListingDraftInput,
  type ListingFormInput,
  type ListingSection,
  type ListingType,
} from "@kotzoeker/shared";
import { createListing, publishListing, updateListing } from "@/app/dashboard/koten/actions";
import type { ActionResult } from "@/lib/action-result";
import { formatEuro } from "@/lib/format";
import { LEASE_TYPE_LABELS, LISTING_TYPE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AmenitiesField, type AmenityValue } from "./amenities-field";
import { Affix, ErrorText, Field, FormSection, Segmented, fieldInputClass, switchClass } from "./form-parts";
import { PublishPanel } from "./publish-panel";

type Props = {
  amenityOptions: AmenityOptionDto[];
  /** Leeg bij een nieuw kot. */
  listingId?: string;
  isPublished?: boolean;
  defaultValues?: ListingDraftInput;
  /** De fotobeheerder; enkel bij een bestaand kot. Komt als eerste sectie in de middelste kolom. */
  photos?: ReactNode;
  photoCount?: number;
  coverUrl?: string | null;
};

const EMPTY: ListingFormInput = {
  type: "room",
  title: "",
  rentEuro: "",
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  costsIncluded: false,
  hasConformityCertificate: false,
  leaseType: "academic_year",
  amenities: [],
};

const TYPE_CARDS: Record<ListingType, { icon: ReactNode; hint: string }> = {
  room: { icon: <DoorOpen />, hint: "Eigen kamer, gedeelde ruimtes" },
  studio: { icon: <BedSingle />, hint: "Alles in één ruimte" },
  apartment: { icon: <Building2 />, hint: "Aparte slaapkamer" },
  shared_house: { icon: <Users />, hint: "Huis met medebewoners" },
};

const SECTIONS: { id: ListingSection; label: string; optional?: boolean }[] = [
  { id: "fotos", label: "Foto's" },
  { id: "basis", label: "Basis" },
  { id: "prijs", label: "Prijs" },
  { id: "adres", label: "Adres" },
  { id: "voorwaarden", label: "Voorwaarden" },
  { id: "voorzieningen", label: "Voorzieningen", optional: true },
];

// Een leeg veld is "niet ingevuld", geen lege tekst of 0.
const blank = (value: unknown) => (value === "" ? undefined : value);
const toNumber = (value: unknown) => {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function ListingForm({
  amenityOptions,
  listingId,
  isPublished = false,
  defaultValues,
  photos,
  photoCount = 0,
  coverUrl = null,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [triedPublish, setTriedPublish] = useState(false);

  const form = useForm<ListingFormInput, unknown, ListingDraftInput>({
    resolver: zodResolver(ListingDraft),
    defaultValues: defaultValues ?? EMPTY,
  });
  const { register, control, formState } = form;
  const error = (name: keyof ListingFormInput) => formState.errors[name]?.message;
  const invalid = (name: keyof ListingFormInput) => (error(name) ? true : undefined);

  // Live waarden voor de checklist, tellers, het totaal en het voorbeeld.
  const values = useWatch({ control });
  const checks = publishChecklist(values, photoCount);
  const mode = !listingId ? "new" : isPublished ? "published" : "draft";

  const monthlyCents =
    values.rentEuro === "" || values.rentEuro === undefined
      ? null
      : toCents(values.costsIncluded ? toNumber(values.rentEuro) : toNumber(values.rentEuro) + toNumber(values.costsEuro));

  // Fouten in de lijst voorzieningen zitten per rij (bv. amenities.0.sharedWith), niet op de lijst zelf.
  const amenitiesError = (() => {
    const e = formState.errors.amenities;
    if (!e) return undefined;
    if (e.message) return e.message;
    if (Array.isArray(e)) {
      for (const item of e) {
        const text = item?.sharedWith?.message ?? item?.key?.message;
        if (text) return text;
      }
    }
    return "Controleer de voorzieningen.";
  })();

  const onInvalid = () => setMessage({ ok: false, text: "Controleer de gemarkeerde velden." });

  function showFieldErrors(fieldErrors?: Record<string, string[] | undefined>) {
    for (const [name, messages] of Object.entries(fieldErrors ?? {})) {
      if (messages?.[0]) form.setError(name as FieldPath<ListingFormInput>, { message: messages[0] });
    }
  }

  function showResult(result: ActionResult, success: string) {
    if (result.ok) {
      setMessage(success ? { ok: true, text: success } : null);
      setSavedAt(new Intl.DateTimeFormat("nl-BE", { timeStyle: "short" }).format(new Date()));
      return true;
    }
    showFieldErrors(result.fieldErrors);
    setMessage({ ok: false, text: result.message });
    return false;
  }

  /** Dezelfde regels als de server, zodat de kotbaas meteen ziet wat nog ontbreekt. */
  function isPublishable(values: ListingDraftInput) {
    const check = ListingPublishable.safeParse(values);
    if (check.success) return true;
    showFieldErrors(z.flattenError(check.error).fieldErrors);
    setMessage({ ok: false, text: "Vul eerst alle verplichte velden in." });
    return false;
  }

  const save = form.handleSubmit((values) => {
    setMessage(null);
    if (isPublished && !isPublishable(values)) return;
    startTransition(async () => {
      if (!listingId) {
        // Bij succes stuurt de action je door naar de bewerkpagina.
        showResult(await createListing(values), "");
        return;
      }
      if (showResult(await updateListing(listingId, values), "")) form.reset(values);
    });
  }, onInvalid);

  const submitPublish = form.handleSubmit((values) => {
    setMessage(null);
    if (!listingId || !isPublishable(values)) return;
    if (photoCount === 0) {
      setMessage({ ok: false, text: "Voeg minstens één foto toe voor je publiceert." });
      return;
    }
    startTransition(async () => {
      if (!showResult(await updateListing(listingId, values), "")) return;
      showResult(await publishListing(listingId), "Je kot staat online.");
    });
    // Faalt al de draft-validatie, toon dan meteen ook alles wat voor publicatie ontbreekt.
  }, () => isPublishable(form.getValues() as unknown as ListingDraftInput));

  // Vanaf de eerste poging kleuren de onvolledige onderdelen in de inhoudstafel rood.
  const publish = () => {
    setTriedPublish(true);
    void submitPublish();
  };

  const titleLength = values.title?.length ?? 0;
  const descriptionLength = values.description?.trim().length ?? 0;

  return (
    <form
      onSubmit={save}
      noValidate
      className="grid items-start gap-10 lg:grid-cols-[200px_minmax(0,1fr)_340px]"
    >
      {/* Inhoudstafel */}
      <nav aria-label="Onderdelen" className="hidden flex-col gap-0.5 lg:sticky lg:top-6 lg:flex">
        {SECTIONS.filter((s) => s.id !== "fotos" || photos).map((section) => {
          const sectionChecks = checks.filter((c) => c.section === section.id);
          const ok = sectionChecks.every((c) => c.ok);
          const state = ok ? (section.optional ? "optional" : "ok") : triedPublish ? "bad" : "todo";
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
              {section.label}
              <span
                className={cn(
                  "grid size-4.5 place-items-center rounded-full",
                  state === "ok" && "bg-plum text-ink",
                  state === "bad" && "bg-danger text-white",
                  (state === "todo" || state === "optional") && "ring-[1.5px] ring-inset ring-line-strong",
                )}
              >
                {state === "ok" && <Check className="size-2.5" strokeWidth={3.5} />}
                {state === "bad" && <X className="size-2.5" strokeWidth={3.5} />}
              </span>
            </a>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-col gap-6">
        {photos && (
          <FormSection id="fotos" title="Foto's" aside="Minstens 1 om te publiceren">
            {photos}
          </FormSection>
        )}

        <FormSection id="basis" title="Basis">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span id="type-label" className="text-sm font-semibold">Type</span>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <div role="radiogroup" aria-labelledby="type-label" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {LISTING_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={field.value === t}
                        onClick={() => field.onChange(t)}
                        className={cn(
                          "flex flex-col items-start gap-2.5 rounded-[14px] border-[1.5px] p-4 text-left text-[15px] font-medium [&>svg]:size-6 [&>svg]:text-plum-deep",
                          field.value === t
                            ? "border-ink bg-surface-raised ring-1 ring-ink ring-inset"
                            : "border-line bg-surface hover:border-line-strong",
                        )}
                      >
                        {TYPE_CARDS[t].icon}
                        {LISTING_TYPE_LABELS[t]}
                        <small className="text-xs font-normal text-ink-muted">{TYPE_CARDS[t].hint}</small>
                      </button>
                    ))}
                  </div>
                )}
              />
              {error("type") && <ErrorText>{error("type")}</ErrorText>}
            </div>

            <Field
              id="title"
              label="Titel"
              error={error("title")}
              side={<span className="text-[13px] text-ink-muted">{titleLength} / 100</span>}
            >
              <Input
                id="title"
                maxLength={100}
                aria-invalid={invalid("title")}
                className={fieldInputClass}
                {...register("title")}
              />
            </Field>

            <Field
              id="description"
              label="Beschrijving"
              error={error("description")}
              hint={`${descriptionLength} tekens, minstens 50.`}
              side={
                // Fase 2: AI vult de beschrijving aan op basis van foto's en een paar zinnen.
                <button
                  type="button"
                  disabled
                  className="flex h-8 cursor-not-allowed items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-line-strong px-3 text-[13px] font-medium text-ink-muted"
                >
                  <Sparkles className="size-3.5 text-plum-deep" /> Aanvullen met AI · binnenkort
                </button>
              }
            >
              <Textarea
                id="description"
                rows={5}
                aria-invalid={invalid("description")}
                className={cn(fieldInputClass, "h-auto py-3 leading-relaxed")}
                {...register("description", { setValueAs: blank })}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection id="prijs" title="Prijs" aside="Bedragen per maand">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="rentEuro" label="Huur" error={error("rentEuro")}>
              <Affix prefix="€">
                <Input
                  id="rentEuro"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  aria-invalid={invalid("rentEuro")}
                  className={fieldInputClass}
                  {...register("rentEuro")}
                />
              </Affix>
            </Field>
            <Field id="costsEuro" label="Kosten" note="energie, water, internet" error={error("costsEuro")}>
              <Affix prefix="€">
                <Input
                  id="costsEuro"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  aria-invalid={invalid("costsEuro")}
                  className={fieldInputClass}
                  {...register("costsEuro", { setValueAs: blank })}
                />
              </Affix>
            </Field>
            <Field id="depositEuro" label="Waarborg" optional error={error("depositEuro")}>
              <Affix prefix="€">
                <Input
                  id="depositEuro"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  aria-invalid={invalid("depositEuro")}
                  className={fieldInputClass}
                  {...register("depositEuro", { setValueAs: blank })}
                />
              </Affix>
            </Field>
            <label className="flex h-12 items-center gap-3 self-end text-[15px] font-medium">
              <Controller
                control={control}
                name="costsIncluded"
                render={({ field }) => (
                  <Switch checked={field.value ?? false} onCheckedChange={field.onChange} className={switchClass} />
                )}
              />
              Kosten inbegrepen in de huur
            </label>
            <div className="flex items-center justify-between rounded-[14px] bg-surface-muted px-5 py-4 sm:col-span-2">
              <span className="text-sm">Studenten zien als totaal per maand</span>
              <strong className="text-[22px] font-bold tracking-[-0.02em]">
                {monthlyCents === null ? "—" : formatEuro(monthlyCents)}
              </strong>
            </div>
          </div>
        </FormSection>

        <FormSection id="adres" title="Adres">
          <div className="grid gap-5 sm:grid-cols-6">
            <Field id="street" label="Straat" error={error("street")} className="sm:col-span-4">
              <Input id="street" autoComplete="address-line1" aria-invalid={invalid("street")} className={fieldInputClass} {...register("street")} />
            </Field>
            <Field id="houseNumber" label="Nummer" error={error("houseNumber")} className="sm:col-span-1">
              <Input id="houseNumber" aria-invalid={invalid("houseNumber")} className={fieldInputClass} {...register("houseNumber")} />
            </Field>
            <Field id="box" label="Bus" error={error("box")} className="sm:col-span-1">
              <Input id="box" aria-invalid={invalid("box")} className={fieldInputClass} {...register("box", { setValueAs: blank })} />
            </Field>
            <Field id="postalCode" label="Postcode" error={error("postalCode")} className="sm:col-span-2">
              <Input
                id="postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                aria-invalid={invalid("postalCode")}
                className={fieldInputClass}
                {...register("postalCode")}
              />
            </Field>
            <Field id="city" label="Gemeente" error={error("city")} className="sm:col-span-4">
              <Input id="city" autoComplete="address-level2" aria-invalid={invalid("city")} className={fieldInputClass} {...register("city")} />
            </Field>
            <p className="flex items-center gap-2.5 rounded-xl bg-surface-muted px-3.5 py-3 text-sm text-ink-muted sm:col-span-6">
              <Lock className="size-4.5 shrink-0 text-plum-deep" />
              Studenten zien enkel de straat en de gemeente. Je huisnummer en bus blijven privé.
            </p>
          </div>
        </FormSection>

        <FormSection id="voorwaarden" title="Huurvoorwaarden en kenmerken">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="availableFrom" label="Beschikbaar vanaf" error={error("availableFrom")}>
              <Input
                id="availableFrom"
                type="date"
                aria-invalid={invalid("availableFrom")}
                className={fieldInputClass}
                {...register("availableFrom", { setValueAs: blank })}
              />
            </Field>
            <Field id="sizeM2" label="Oppervlakte" error={error("sizeM2")}>
              <Affix suffix="m²">
                <Input
                  id="sizeM2"
                  type="number"
                  inputMode="numeric"
                  aria-invalid={invalid("sizeM2")}
                  className={fieldInputClass}
                  {...register("sizeM2", { setValueAs: blank })}
                />
              </Affix>
            </Field>
            <Field id="leaseType" label="Huurtype" error={error("leaseType")} className="sm:col-span-2">
              <Controller
                control={control}
                name="leaseType"
                render={({ field }) => (
                  <Segmented
                    id="leaseType"
                    label="Huurtype"
                    value={field.value}
                    onChange={field.onChange}
                    options={LEASE_TYPES.map((t) => ({ value: t, label: LEASE_TYPE_LABELS[t] }))}
                  />
                )}
              />
            </Field>
            <Field id="minLeaseMonths" label="Minimale huurduur" optional error={error("minLeaseMonths")}>
              <Affix suffix="maanden">
                <Input
                  id="minLeaseMonths"
                  type="number"
                  inputMode="numeric"
                  aria-invalid={invalid("minLeaseMonths")}
                  className={fieldInputClass}
                  {...register("minLeaseMonths", { setValueAs: blank })}
                />
              </Affix>
            </Field>
            <label className="flex h-12 items-center gap-3 self-end text-[15px] font-medium">
              <Controller
                control={control}
                name="hasConformityCertificate"
                render={({ field }) => (
                  <Switch checked={field.value ?? false} onCheckedChange={field.onChange} className={switchClass} />
                )}
              />
              Conformiteitsattest aanwezig
            </label>
            <Field id="epcLabel" label="EPC-label" optional error={error("epcLabel")} className="sm:col-span-2">
              <Controller
                control={control}
                name="epcLabel"
                render={({ field }) => (
                  // "none" staat voor "niet opgegeven": het veld wordt dan undefined.
                  <Segmented
                    id="epcLabel"
                    label="EPC-label"
                    variant="chips"
                    value={field.value ?? "none"}
                    onChange={(v) => field.onChange(v === "none" ? undefined : v)}
                    options={[
                      ...EPC_LABELS.map((label) => ({ value: label as string, label })),
                      { value: "none", label: "Niet opgegeven" },
                    ]}
                  />
                )}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection id="voorzieningen" title="Voorzieningen" aside="Duid aan wat er is, en of het privé of gedeeld is">
          <Controller
            control={control}
            name="amenities"
            render={({ field }) => (
              <AmenitiesField
                options={amenityOptions}
                value={(field.value ?? []) as AmenityValue[]}
                onChange={field.onChange}
              />
            )}
          />
          {amenitiesError && (
            <div className="mt-4">
              <ErrorText>{amenitiesError}</ErrorText>
            </div>
          )}
        </FormSection>
      </div>

      <PublishPanel
        mode={mode}
        checks={checks}
        pending={pending}
        message={message}
        savedAt={savedAt}
        onPublish={publish}
        preview={{
          title: values.title ?? "",
          monthlyCents,
          street: values.street ?? "",
          city: values.city ?? "",
          coverUrl,
        }}
      />
    </form>
  );
}
```

### `apps/web/src/components/listings/publish-panel.tsx` (nieuw)

```tsx
// apps/web/src/components/listings/publish-panel.tsx
"use client";

import Image from "next/image";
import { Check, CircleAlert, Send, X } from "lucide-react";
import type { PublishCheck } from "@kotzoeker/shared";
import { formatEuro } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  mode: "new" | "draft" | "published";
  checks: PublishCheck[];
  pending: boolean;
  message: { ok: boolean; text: string } | null;
  savedAt: string | null;
  onPublish: () => void;
  preview: { title: string; monthlyCents: number | null; street: string; city: string; coverUrl: string | null };
};

/** De vaste zijbalk: wat nog ontbreekt, de knoppen, en hoe studenten het kot zien. */
export function PublishPanel({ mode, checks, pending, message, savedAt, onPublish, preview }: Props) {
  const done = checks.filter((c) => c.ok).length;
  const missing = checks.length - done;

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
      <section aria-labelledby="publish-title" className="rounded-[20px] border-[1.5px] border-line bg-surface-raised p-6">
        {mode === "new" && (
          <>
            <h2 id="publish-title" className="mb-1 text-lg font-semibold">Eerst opslaan</h2>
            <p className="mb-5 text-sm text-ink-muted">
              Vul titel, huur en adres in en sla op als draft. Daarna voeg je foto&apos;s toe en publiceer je.
            </p>
          </>
        )}

        {mode === "draft" && (
          <>
            <h2 id="publish-title" className="mb-1 text-lg font-semibold">Klaar om te publiceren?</h2>
            <p className="text-sm text-ink-muted">
              {missing === 0
                ? "Alles is ingevuld. Je kot kan online."
                : `Nog ${missing} ${missing === 1 ? "ding" : "dingen"}, dan kan je kot online.`}
            </p>
            <div className="my-4 flex items-center gap-3">
              <span className="h-2 flex-1 overflow-hidden rounded bg-surface-muted" aria-hidden>
                <span
                  className="block h-full rounded bg-plum-deep transition-[width]"
                  style={{ width: `${(done / checks.length) * 100}%` }}
                />
              </span>
              <b className="text-[13px] font-semibold">
                {done} / {checks.length}
              </b>
            </div>
            <ul className="mb-5 flex flex-col gap-2.5">
              {checks.map((check) => (
                <li key={check.key} className={cn("flex items-center gap-2.5 text-sm", !check.ok && "font-medium")}>
                  <span
                    className={cn(
                      "grid size-5.5 shrink-0 place-items-center rounded-full",
                      check.ok ? "bg-plum" : "bg-danger-soft text-danger ring-[1.5px] ring-inset ring-danger",
                    )}
                  >
                    {check.ok ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
                  </span>
                  {check.label}
                  {!check.ok && (
                    <a
                      href={`#${check.section}`}
                      className="ml-auto text-[13px] font-semibold text-plum-deep underline underline-offset-3"
                    >
                      Invullen
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {mode === "published" && (
          <>
            <h2 id="publish-title" className="mb-1 text-lg font-semibold">Je kot staat online</h2>
            <p className="mb-5 text-sm text-ink-muted">
              Wijzigingen zijn meteen zichtbaar na het opslaan. Alle verplichte velden moeten ingevuld blijven.
            </p>
          </>
        )}

        {message?.text && (
          <p
            role={message.ok ? "status" : "alert"}
            className={cn(
              "mb-4 flex gap-2.5 rounded-xl px-3.5 py-3 text-[13px] font-medium",
              message.ok ? "bg-surface-muted text-ink" : "bg-danger-soft text-danger",
            )}
          >
            {message.ok ? <Check className="size-4.5 shrink-0" /> : <CircleAlert className="size-4.5 shrink-0" />}
            {message.text}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {mode === "draft" && (
            <Button type="button" variant="brand" size="pill" onClick={onPublish} disabled={pending}>
              <Send className="size-4.5" /> Publiceren
            </Button>
          )}
          <Button type="submit" variant={mode === "draft" ? "outline-ink" : "brand"} size="pill" disabled={pending}>
            {pending ? "Bezig…" : mode === "published" ? "Wijzigingen opslaan" : "Opslaan als draft"}
          </Button>
        </div>
        {savedAt && <p className="mt-3 text-center text-[13px] text-ink-muted">Opgeslagen om {savedAt}</p>}
      </section>

      {mode !== "new" && (
        <section aria-label="Voorbeeld" className="rounded-[20px] border-[1.5px] border-line bg-surface-raised p-4">
          <p className="eyebrow mb-3 text-[13px]">Zo zien studenten je kot</p>
          <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-surface-muted">
            {preview.coverUrl && <Image src={preview.coverUrl} alt="" fill sizes="308px" className="object-cover" />}
          </div>
          <h3 className="text-[15px] leading-snug font-semibold">{preview.title || "Titel van je kot"}</h3>
          <p className="mt-1 text-[13px] text-ink-muted">
            {preview.monthlyCents !== null && (
              <>
                <strong className="text-ink">{formatEuro(preview.monthlyCents)}</strong> / maand ·{" "}
              </>
            )}
            {[preview.street, preview.city].filter(Boolean).join(", ")}
          </p>
        </section>
      )}
    </aside>
  );
}
```

### `apps/web/src/components/listings/amenities-field.tsx` (volledig vervangen)

```tsx
// apps/web/src/components/listings/amenities-field.tsx
"use client";

import type { AmenityCategory, AmenityOptionDto } from "@kotzoeker/shared";
import { CATEGORY_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Segmented } from "./form-parts";

export type AmenityValue = {
  key: string;
  isShared: boolean;
  sharedWith?: number;
};

type Props = {
  options: AmenityOptionDto[];
  value: AmenityValue[];
  onChange: (value: AmenityValue[]) => void;
};

const CATEGORY_ORDER: AmenityCategory[] = ["sanitary", "kitchen", "comfort", "building"];

export function AmenitiesField({ options, value, onChange }: Props) {
  const chosen = new Map(value.map((a) => [a.key, a]));

  const toggle = (key: string, on: boolean) =>
    onChange(on ? [...value, { key, isShared: false }] : value.filter((a) => a.key !== key));

  const patch = (key: string, changes: Partial<AmenityValue>) =>
    onChange(value.map((a) => (a.key === key ? { ...a, ...changes } : a)));

  return (
    <div className="flex flex-col gap-6">
      {CATEGORY_ORDER.map((category) => {
        const items = options.filter((o) => o.category === category);
        if (items.length === 0) return null;

        return (
          <fieldset key={category}>
            <legend className="mb-2.5 text-[13px] font-semibold tracking-[0.06em] text-ink-muted uppercase">
              {CATEGORY_LABELS[category]}
            </legend>
            <div className="grid items-start gap-2.5 sm:grid-cols-2">
              {items.map((option) => {
                const current = chosen.get(option.key);
                const id = `amenity-${option.key}`;

                return (
                  <div
                    key={option.key}
                    className={cn(
                      "flex flex-col gap-2.5 rounded-[14px] border-[1.5px] px-3.5 py-3 transition-colors",
                      current ? "border-line-strong bg-surface-raised" : "border-line bg-surface",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={id}
                        checked={current !== undefined}
                        onCheckedChange={(checked) => toggle(option.key, checked === true)}
                        className="size-5.5 rounded-[7px] border-[1.5px] border-ink-muted data-checked:border-ink data-checked:bg-ink data-checked:text-surface"
                      />
                      <Label htmlFor={id} className="text-[15px] font-medium">
                        {option.label}
                      </Label>
                    </div>

                    {/* Privé of gedeeld enkel voor voorzieningen die gedeeld kunnen zijn. */}
                    {current && option.shareable && (
                      <div className="flex flex-wrap items-center gap-2.5 pl-8.5">
                        <Segmented
                          label={`${option.label}: privé of gedeeld`}
                          size="sm"
                          value={current.isShared ? "shared" : "private"}
                          options={[
                            { value: "private", label: "Privé" },
                            { value: "shared", label: "Gedeeld" },
                          ]}
                          onChange={(v) =>
                            patch(option.key, {
                              isShared: v === "shared",
                              sharedWith: v === "shared" ? current.sharedWith : undefined,
                            })
                          }
                        />
                        {current.isShared && (
                          <span className="flex items-center gap-2 text-[13px] text-ink-muted">
                            met
                            <input
                              type="number"
                              inputMode="numeric"
                              min={2}
                              max={30}
                              aria-label={`${option.label}: gedeeld met hoeveel personen`}
                              className="h-8.5 w-16 rounded-lg border-[1.5px] border-line px-2.5 text-sm font-medium text-ink"
                              value={current.sharedWith ?? ""}
                              onChange={(e) =>
                                patch(option.key, {
                                  sharedWith: e.target.value === "" ? undefined : Number(e.target.value),
                                })
                              }
                            />
                            personen
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
```

### `apps/web/src/components/listings/photo-manager.tsx` (volledig vervangen)

De upload-logica is ongewijzigd. Nieuw: uploads staan in hetzelfde raster als de foto's, met een overlay voor "bezig" en "mislukt", en `DndContext` krijgt een vast `id` (anders geeft dnd-kit een hydration-waarschuwing).

```tsx
// apps/web/src/components/listings/photo-manager.tsx
"use client";

import { useState, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  MAX_PHOTOS_PER_LISTING,
  type ListingPhotoDto,
} from "@kotzoeker/shared";
import {
  addListingPhoto,
  deleteListingPhoto,
  reorderListingPhotos,
} from "@/app/dashboard/koten/photo-actions";
import { preparePhoto } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ErrorText } from "./form-parts";
import { SortablePhoto } from "./sortable-photo";

type Upload = {
  id: string; // wordt ook het id van de foto en de bestandsnaam
  file: File;
  previewUrl: string;
  status: "waiting" | "busy" | "failed";
  error?: string;
};

const PARALLEL_UPLOADS = 3;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

const REJECTION_MESSAGES: Record<string, string> = {
  "file-invalid-type":
    "Enkel JPG, PNG of WebP. Zet iPhone-foto's (HEIC) eerst om naar JPG.",
  "file-too-large": "Groter dan 15 MB.",
  "too-many-files": `Maximaal ${MAX_PHOTOS_PER_LISTING} foto's per kot.`,
};

/** Voert `task` uit voor alle items, met hoogstens `limit` tegelijk. */
async function runLimited<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await task(items[next++]!);
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
}

type Props = { listingId: string; photos: ListingPhotoDto[] };

export function PhotoManager({ listingId, photos: serverPhotos }: Props) {
  // Lokale kopie, zodat slepen meteen zichtbaar is. Stuurt de server nieuwe foto's, dan nemen we die over.
  const [photos, setPhotos] = useState(serverPhotos);
  const [lastServerPhotos, setLastServerPhotos] = useState(serverPhotos);
  if (serverPhotos !== lastServerPhotos) {
    setLastServerPhotos(serverPhotos);
    setPhotos(serverPhotos);
  }

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remaining = MAX_PHOTOS_PER_LISTING - photos.length - uploads.length;

  const updateUpload = (id: string, changes: Partial<Upload>) =>
    setUploads((list) =>
      list.map((u) => (u.id === id ? { ...u, ...changes } : u)),
    );

  const removeUpload = (upload: Upload) => {
    URL.revokeObjectURL(upload.previewUrl);
    setUploads((list) => list.filter((u) => u.id !== upload.id));
  };

  async function uploadOne(upload: Upload) {
    updateUpload(upload.id, { status: "busy", error: undefined });
    try {
      const { full, thumb } = await preparePhoto(upload.file);
      const bitmap = await createImageBitmap(full);
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();

      // Stap 1: rechtstreeks naar Storage. De Storage-policy controleert of dit jouw kot is.
      const bucket = createClient().storage.from("listing-photos");
      const base = `${listingId}/${upload.id}`;
      const results = await Promise.all([
        bucket.upload(`${base}.webp`, full, { contentType: "image/webp" }),
        bucket.upload(`${base}_thumb.webp`, thumb, {
          contentType: "image/webp",
        }),
      ]);
      if (results.some((r) => r.error)) throw new Error("Uploaden mislukt.");

      // Stap 2: de rij in listing_photos. De server bouwt het pad zelf op.
      const result = await addListingPhoto({
        listingId,
        photoId: upload.id,
        ...size,
      });
      if (!result.ok) throw new Error(result.message);

      removeUpload(upload); // de foto zit nu in `photos` via de server
    } catch (e) {
      updateUpload(upload.id, {
        status: "failed",
        error: e instanceof Error ? e.message : "Uploaden mislukt.",
      });
    }
  }

  function retry(upload: Upload) {
    // Nieuw id: een half gelukte eerste poging kan het oude pad al bezet hebben.
    const fresh: Upload = {
      ...upload,
      id: crypto.randomUUID(),
      status: "waiting",
      error: undefined,
    };
    setUploads((list) => list.map((u) => (u.id === upload.id ? fresh : u)));
    void uploadOne(fresh);
  }

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
      maxSize: MAX_INPUT_BYTES,
      maxFiles: Math.max(remaining, 1), // 0 betekent "onbeperkt" in react-dropzone
      disabled: remaining <= 0,
      onDrop: (accepted) => {
        const added: Upload[] = accepted.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          status: "waiting",
        }));
        setUploads((list) => [...list, ...added]);
        void runLimited(added, PARALLEL_UPLOADS, uploadOne);
      },
    });

  const sensors = useSensors(
    // distance: een gewone klik (op "Verwijderen") start geen sleepbeweging
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const previous = photos;
    const next = arrayMove(
      photos,
      photos.findIndex((p) => p.id === active.id),
      photos.findIndex((p) => p.id === over.id),
    );
    setPhotos(next); // eerst op het scherm, dan naar de server
    setError(null);
    startTransition(async () => {
      const result = await reorderListingPhotos({
        listingId,
        photoIds: next.map((p) => p.id),
      });
      if (!result.ok) {
        setPhotos(previous);
        setError(result.message);
      }
    });
  }

  function handleDelete(photoId: string) {
    if (!window.confirm("Deze foto verwijderen?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteListingPhoto(photoId);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer items-center gap-5 rounded-2xl border-2 border-dashed p-6 transition-colors",
          isDragActive ? "border-plum bg-surface-muted" : "border-line-strong hover:border-plum hover:bg-surface-muted",
          remaining <= 0 && "cursor-not-allowed opacity-50",
        )}
      >
        <input {...getInputProps()} />
        <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-plum">
          <Upload className="size-6" />
        </span>
        <div>
          <p className="font-semibold">{isDragActive ? "Laat los om te uploaden" : "Sleep foto's hierheen"}</p>
          <p className="text-sm text-ink-muted">JPG, PNG of WebP tot 15 MB. We verkleinen ze automatisch.</p>
        </div>
        <span className="ml-auto hidden h-9 shrink-0 items-center rounded-full whitespace-nowrap border-[1.5px] border-ink px-3.5 text-[13px] font-semibold sm:flex">
          Kies foto&apos;s
        </span>
      </div>

      {fileRejections.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1">
          {fileRejections.map(({ file, errors }) => (
            <li key={`${file.name}-${file.lastModified}`}>
              <ErrorText>
                {file.name}: {errors.map((e) => REJECTION_MESSAGES[e.code] ?? e.message).join(" ")}
              </ErrorText>
            </li>
          ))}
        </ul>
      )}

      {(photos.length > 0 || uploads.length > 0) && (
        <DndContext id={`photos-${listingId}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
              {photos.map((photo, index) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  index={index}
                  disabled={pending}
                  onDelete={handleDelete}
                />
              ))}
              {/* Uploads staan achteraan in hetzelfde raster, met hun eigen status. */}
              {uploads.map((upload) => (
                <li
                  key={upload.id}
                  className={cn(
                    "relative aspect-[4/3] overflow-hidden rounded-[14px] bg-surface-muted",
                    upload.status === "failed" && "border-[1.5px] border-danger bg-danger-soft",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- lokale blob-URL, next/image heeft hier geen zin */}
                  <img
                    src={upload.previewUrl}
                    alt=""
                    className={cn(
                      "h-full w-full object-cover",
                      upload.status === "failed" ? "opacity-25" : "opacity-45 saturate-50",
                    )}
                  />
                  {upload.status === "failed" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <p className="text-[13px] font-semibold text-danger">{upload.error}</p>
                      <div className="flex gap-1.5">
                        <Button type="button" variant="ink" size="pill-sm" onClick={() => retry(upload)}>
                          <RefreshCw /> Opnieuw
                        </Button>
                        <Button
                          type="button"
                          variant="quiet"
                          size="pill-sm"
                          className="bg-surface-raised"
                          onClick={() => removeUpload(upload)}
                        >
                          Weglaten
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col justify-end gap-2 p-3">
                      <span className="self-start rounded-lg bg-surface-raised/90 px-2 py-0.5 text-xs font-semibold">
                        {upload.status === "waiting" ? "Wachten…" : "Bezig met uploaden…"}
                      </span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-surface-raised/80" aria-hidden>
                        <span
                          className={cn(
                            "block h-full rounded-full bg-ink",
                            upload.status === "busy" ? "w-2/3 animate-pulse" : "w-0",
                          )}
                        />
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <p className="flex justify-between gap-4 text-[13px] text-ink-muted">
        <span>
          {photos.length > 1
            ? "Sleep om de volgorde te wijzigen. De eerste foto is de cover."
            : "De eerste foto wordt de cover."}
        </span>
        <span className="shrink-0">
          {photos.length + uploads.length} van {MAX_PHOTOS_PER_LISTING}
        </span>
      </p>

      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
```

### `apps/web/src/components/listings/sortable-photo.tsx` (volledig vervangen)

```tsx
// apps/web/src/components/listings/sortable-photo.tsx
"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Star, Trash2 } from "lucide-react";
import type { ListingPhotoDto } from "@kotzoeker/shared";
import { thumbUrl } from "@/lib/photo-urls";
import { cn } from "@/lib/utils";

type Props = {
  photo: ListingPhotoDto;
  index: number;
  disabled: boolean;
  onDelete: (photoId: string) => void;
};

export function SortablePhoto({ photo, index, disabled, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative aspect-[4/3] overflow-hidden rounded-[14px] bg-surface-muted",
        isDragging && "z-10 opacity-80 shadow-[0_20px_40px_-18px_rgb(43_18_39/0.45)]",
      )}
    >
      {/* De hele foto is de sleepgreep. touch-none: anders scrollt de pagina op een gsm. */}
      <div {...attributes} {...listeners} className="absolute inset-0 cursor-grab touch-none">
        <Image
          src={thumbUrl(photo.storagePath)}
          alt={`Foto ${index + 1}`}
          fill
          sizes="(min-width: 640px) 220px, 50vw"
          className="object-cover"
        />
      </div>

      {index === 0 ? (
        <span className="pointer-events-none absolute top-2 left-2 flex h-6.5 items-center gap-1 rounded-full bg-plum px-2.5 text-xs font-semibold text-ink">
          <Star className="size-3 fill-current" /> Cover
        </span>
      ) : (
        <span className="pointer-events-none absolute bottom-2 left-2 grid size-6 place-items-center rounded-lg bg-ink/75 text-xs font-semibold text-white">
          {index + 1}
        </span>
      )}

      <span className="pointer-events-none absolute top-2 right-2 grid size-7.5 place-items-center rounded-[10px] bg-surface-raised/90">
        <GripVertical className="size-4" />
      </span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onDelete(photo.id)}
        aria-label={`Foto ${index + 1} verwijderen`}
        className="absolute right-2 bottom-2 grid size-7.5 place-items-center rounded-[10px] bg-surface-raised/90 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-40"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}
```

### `apps/web/src/app/dashboard/koten/nieuw/page.tsx` (volledig vervangen)

```tsx
// apps/web/src/app/dashboard/koten/nieuw/page.tsx
import { requireRole } from "@/lib/auth";
import { findAmenityOptions } from "@/server/dal/listing";
import { ListingForm } from "@/components/listings/listing-form";
import { PageHeading } from "@/components/listings/page-heading";

export default async function NewListingPage() {
  await requireRole("landlord");
  const amenityOptions = await findAmenityOptions();

  return (
    <main className="container-page flex-1 pt-8 pb-24">
      <PageHeading crumb="Nieuw kot" title="Nieuw kot" />
      <ListingForm amenityOptions={amenityOptions} />
    </main>
  );
}
```

### `apps/web/src/app/dashboard/koten/[id]/page.tsx` (volledig vervangen)

```tsx
// apps/web/src/app/dashboard/koten/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { thumbUrl } from "@/lib/photo-urls";
import { findAmenityOptions, findListingForEdit } from "@/server/dal/listing";
import { Button } from "@/components/ui/button";
import { ListingForm } from "@/components/listings/listing-form";
import { PageHeading } from "@/components/listings/page-heading";
import { PhotoManager } from "@/components/listings/photo-manager";
import { StatusBadge } from "@/components/listings/status-badge";

type Props = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: Props) {
  const user = await requireRole("landlord");
  const { id } = await params;
  // Een ongeldig id zou Postgres een fout laten gooien; behandel het als "bestaat niet".
  if (!z.uuid().safeParse(id).success) notFound();

  const [listing, amenityOptions] = await Promise.all([
    findListingForEdit(user.id, id), // eigenaarscheck zit in de query
    findAmenityOptions(),
  ]);
  if (!listing) notFound();

  const cover = listing.photos[0];

  return (
    <main className="container-page flex-1 pt-8 pb-24">
      <PageHeading crumb="Kot bewerken" title={listing.values.title}>
        <StatusBadge status={listing.status} />
        {listing.status === "published" && listing.slug && (
          <Button asChild variant="quiet" size="pill-sm" className="ml-auto">
            <Link href={`/koten/${listing.slug}`}>
              <Eye /> Bekijk publieke pagina
            </Link>
          </Button>
        )}
      </PageHeading>

      <ListingForm
        listingId={listing.id}
        isPublished={listing.status === "published"}
        defaultValues={listing.values}
        amenityOptions={amenityOptions}
        photoCount={listing.photos.length}
        coverUrl={cover ? thumbUrl(cover.storagePath) : null}
        photos={<PhotoManager listingId={listing.id} photos={listing.photos} />}
      />
    </main>
  );
}
```

## 8. De publieke kotpagina

### `apps/web/src/app/koten/[slug]/page.tsx` (volledig vervangen)

`generateMetadata` bovenaan het bestand blijft zoals het is; dit is het volledige bestand.

```tsx
// apps/web/src/app/koten/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PublicListingDto } from "@kotzoeker/shared";
import { formatDate, formatEuro } from "@/lib/format";
import { LEASE_TYPE_LABELS, LISTING_TYPE_LABELS } from "@/lib/labels";
import { getPublishedListingBySlug } from "@/server/dal/listing";
import {
  CalendarDays,
  Check,
  ChevronRight,
  DoorOpen,
  FileText,
  MapPin,
  MessageCircle,
  Ruler,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoGallery } from "./photo-gallery";
import { ShareButton } from "./share-button";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const kot = await getPublishedListingBySlug(slug);
  if (!kot) return {};

  const title = `${kot.title} – ${formatEuro(kot.rentCents)}/maand in ${kot.city}`;
  const description = kot.description?.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `/koten/${slug}` },
    openGraph: {
      title,
      description,
      url: `/koten/${slug}`,
      type: "website",
      images: kot.coverUrl ? [kot.coverUrl] : [],
    },
  };
}

export default async function KotPage({ params }: Props) {
  const { slug } = await params;
  // Enkel gepubliceerde koten: een draft, verhuurd of gearchiveerd kot geeft een 404.
  const kot = await getPublishedListingBySlug(slug);
  if (!kot) notFound();

  const monthlyCents = kot.costsIncluded ? kot.rentCents : kot.rentCents + kot.costsCents;
  // Niet-deelbare voorzieningen (wifi, bemeubeld) horen bij "voor jou alleen".
  const privateAmenities = kot.amenities.filter((a) => !a.shareable || !a.isShared);
  const sharedAmenities = kot.amenities.filter((a) => a.shareable && a.isShared);
  const available = kot.availableFrom ? formatDate(kot.availableFrom) : null;

  return (
    <main className="container-page flex-1 pt-6 pb-24">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="flex items-center gap-1.5 text-sm text-ink-muted">
          <span className="font-medium text-plum-deep">Koten in {kot.city}</span>
          <ChevronRight className="size-3.5" />
          {kot.title}
        </p>
        <ShareButton title={kot.title} />
      </div>

      <PhotoGallery photos={kot.photos} title={kot.title} />

      <div className="mt-10 grid items-start gap-16 lg:grid-cols-[minmax(0,1fr)_400px]">
        <article>
          <p className="flex items-center gap-1.5 text-[15px] text-ink-muted">
            <MapPin className="size-4.5 text-plum-deep" />
            {kot.street}, {kot.postalCode} {kot.city}
          </p>
          <h1 className="mt-2.5 mb-4.5 text-[44px] leading-[1.08] font-semibold tracking-[-0.03em]">
            {kot.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Tag icon={<DoorOpen />}>{LISTING_TYPE_LABELS[kot.type]}</Tag>
            {kot.sizeM2 && <Tag icon={<Ruler />}>{kot.sizeM2} m²</Tag>}
            {kot.hasConformityCertificate && <Tag icon={<ShieldCheck />}>Conformiteitsattest</Tag>}
          </div>

          <Block title="In het kort">
            <dl className="grid gap-3.5 sm:grid-cols-3">
              <Fact icon={<DoorOpen />} label="Type" value={LISTING_TYPE_LABELS[kot.type]} />
              <Fact icon={<Ruler />} label="Oppervlakte" value={kot.sizeM2 ? `${kot.sizeM2} m²` : "Niet opgegeven"} />
              <Fact icon={<CalendarDays />} label="Beschikbaar vanaf" value={available ?? "Nu"} />
              <Fact
                icon={<FileText />}
                label="Huurtype"
                value={
                  LEASE_TYPE_LABELS[kot.leaseType] +
                  (kot.minLeaseMonths ? `, min. ${kot.minLeaseMonths} maanden` : "")
                }
              />
              <Fact icon={<Zap />} label="EPC-label" value={kot.epcLabel ?? "Niet opgegeven"} />
              <Fact
                icon={<ShieldCheck />}
                label="Conformiteitsattest"
                value={kot.hasConformityCertificate ? "Ja" : "Niet opgegeven"}
              />
            </dl>
          </Block>

          {kot.description && (
            <Block title="Over dit kot">
              <p className="max-w-[720px] text-[17px] leading-[1.7] whitespace-pre-line">{kot.description}</p>
            </Block>
          )}

          {kot.amenities.length > 0 && (
            <Block title="Voorzieningen">
              <div className="grid gap-7 sm:grid-cols-2">
                <AmenityList title="Voor jou alleen" items={privateAmenities} />
                <AmenityList title="Gedeeld" items={sharedAmenities} />
              </div>
            </Block>
          )}

          {/* Fase 4: kaart met lat/lng en reistijd naar de campus. */}
          <Block title="Ligging" last>
            <div className="relative grid h-80 place-items-center overflow-hidden rounded-[20px] border-[1.5px] border-line bg-surface-muted">
              <div className="max-w-90 rounded-2xl bg-surface-raised px-5 py-4 text-center shadow-[0_20px_40px_-18px_rgb(43_18_39/0.45)]">
                <p className="font-semibold">Kaart en reistijd naar je campus</p>
                <p className="text-sm text-ink-muted">
                  Binnenkort zie je hier hoe lang je fietst, stapt of de tram neemt.
                </p>
              </div>
            </div>
          </Block>
        </article>

        <aside
          aria-label="Prijs"
          className="rounded-[20px] border-[1.5px] border-line bg-surface-raised p-7 shadow-[0_24px_50px_-30px_rgb(43_18_39/0.4)] lg:sticky lg:top-6"
        >
          <p className="text-[40px] leading-none font-bold tracking-[-0.03em]">
            {formatEuro(monthlyCents)}{" "}
            <small className="text-base font-medium tracking-normal text-ink-muted">per maand</small>
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            {kot.costsIncluded ? "Alle kosten inbegrepen" : "Huur en kosten samen"}
          </p>
          <dl className="my-6 border-t border-line text-[15px]">
            <PriceLine label="Huur" value={formatEuro(kot.rentCents)} />
            <PriceLine label="Kosten" value={kot.costsIncluded ? "Inbegrepen" : formatEuro(kot.costsCents)} />
            {kot.depositCents !== null && (
              <PriceLine label="Waarborg (eenmalig)" value={formatEuro(kot.depositCents)} />
            )}
          </dl>
          <div className="mb-5 flex items-center gap-3 rounded-[14px] bg-surface-muted px-4 py-3.5 text-sm">
            <CalendarDays className="size-5.5 shrink-0 text-plum-deep" />
            <div>
              <p className="text-[15px] font-semibold">{available ? `Vrij vanaf ${available}` : "Nu vrij"}</p>
              {LEASE_TYPE_LABELS[kot.leaseType]}
            </div>
          </div>
          {/* Fase 6: contact via de chat. */}
          <Button variant="brand" size="pill" className="w-full" disabled>
            <MessageCircle className="size-4.5" /> Contacteer kotbaas
          </Button>
          <p className="mt-2.5 text-center text-[13px] text-ink-muted">Chatten met de kotbaas komt binnenkort</p>
        </aside>
      </div>
    </main>
  );
}

function Block({ title, last, children }: { title: string; last?: boolean; children: React.ReactNode }) {
  return (
    <section className={last ? "pt-10" : "border-b border-line py-10"}>
      <h2 className="mb-5 text-2xl font-semibold tracking-[-0.015em]">{title}</h2>
      {children}
    </section>
  );
}

function Tag({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7.5 items-center gap-1.5 rounded-full bg-surface-muted px-3 text-[13px] font-medium [&>svg]:size-3.5 [&>svg]:text-plum-deep">
      {icon}
      {children}
    </span>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3.5 rounded-2xl border-[1.5px] border-line bg-surface-raised p-4">
      <span className="grid size-10.5 shrink-0 place-items-center rounded-xl bg-surface-muted [&>svg]:size-5 [&>svg]:text-plum-deep">
        {icon}
      </span>
      <div>
        <dt className="text-[13px] text-ink-muted">{label}</dt>
        <dd className="font-semibold">{value}</dd>
      </div>
    </div>
  );
}

function AmenityList({ title, items }: { title: string; items: PublicListingDto["amenities"] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-semibold tracking-[0.06em] text-ink-muted uppercase">{title}</h3>
      <ul>
        {items.map((a) => (
          <li key={a.key} className="flex items-center gap-3 border-b border-dashed border-line py-3 last:border-0">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-plum">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            {a.label}
            {a.isShared && a.sharedWith && (
              <small className="ml-auto text-[13px] text-ink-muted">met {a.sharedWith} personen</small>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PriceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line py-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
```

### `apps/web/src/app/koten/[slug]/photo-gallery.tsx` (volledig vervangen)

In Next 16 is `priority` vervangen door `preload`.

```tsx
// apps/web/src/app/koten/[slug]/photo-gallery.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import type { PublicListingDto } from "@kotzoeker/shared";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Props = { photos: PublicListingDto["photos"]; title: string };

/** Eén grote foto en tot vier kleine; een klik opent de lightbox. */
export function PhotoGallery({ photos, title }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) return <div className="h-[480px] rounded-3xl bg-surface-muted" />;

  const current = openIndex === null ? null : photos[openIndex];
  const step = (delta: number) =>
    setOpenIndex((i) => (i === null ? null : (i + delta + photos.length) % photos.length));

  const visible = photos.slice(0, 5);
  const single = visible.length === 1;

  return (
    <>
      <div
        className={cn(
          "grid h-[480px] gap-2.5 overflow-hidden rounded-3xl",
          single ? "grid-cols-1" : "grid-cols-[2fr_1fr_1fr] grid-rows-2",
        )}
      >
        {visible.map((photo, i) => {
          const isLast = i === visible.length - 1 && photos.length > 1;
          return (
            <button
              key={photo.url}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={isLast ? `Alle ${photos.length} foto's bekijken` : `Foto ${i + 1} van ${photos.length} openen`}
              className={cn(
                "group relative cursor-zoom-in overflow-hidden bg-surface-muted",
                i === 0 && !single && "row-span-2",
              )}
            >
              <Image
                src={i === 0 ? photo.url : photo.thumbUrl}
                alt={photo.altText ?? (i === 0 ? title : "")}
                fill
                preload={i === 0}
                sizes={i === 0 ? "(min-width: 1344px) 640px, 50vw" : "320px"}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {isLast && (
                <span className="absolute right-3.5 bottom-3.5 flex h-10 items-center gap-2 rounded-full bg-surface-raised px-4 text-sm font-semibold shadow-[0_8px_20px_-10px_rgb(43_18_39/0.5)]">
                  <LayoutGrid className="size-4" /> Alle {photos.length} foto&apos;s
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent
          className="max-w-none border-0 bg-transparent p-0 shadow-none sm:max-w-5xl"
          aria-describedby={undefined} // de titel volstaat
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
          }}
        >
          <DialogTitle className="sr-only">
            {title}, foto {(openIndex ?? 0) + 1} van {photos.length}
          </DialogTitle>
          {current && (
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-ink">
              <Image src={current.url} alt={current.altText ?? title} fill sizes="100vw" className="object-contain" />
            </div>
          )}
          {photos.length > 1 && (
            <div className="flex items-center justify-center gap-5 text-sm font-medium text-white">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Vorige foto"
                className="grid size-12 place-items-center rounded-full bg-white/15 hover:bg-white/25"
              >
                <ChevronLeft className="size-5.5" />
              </button>
              {(openIndex ?? 0) + 1} / {photos.length}
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Volgende foto"
                className="grid size-12 place-items-center rounded-full bg-white/15 hover:bg-white/25"
              >
                <ChevronRight className="size-5.5" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### `apps/web/src/app/koten/[slug]/share-button.tsx` (nieuw)

```tsx
// apps/web/src/app/koten/[slug]/share-button.tsx
"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Deelt de pagina via het deelmenu van de gsm, of kopieert de link op een computer. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {}); // annuleren is geen fout
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="quiet" size="pill-sm" onClick={share}>
      {copied ? <Check /> : <Share2 />}
      {copied ? "Link gekopieerd" : "Delen"}
    </Button>
  );
}
```

## 9. Header

### `apps/web/src/components/site-header.tsx`

Een kotbaas ziet "Mijn koten" in plaats van de ankerlinks van de landingspagina, en een avatar met zijn initialen. Vervang de `<nav>` en het begin van het ingelogde blok door:

```tsx
        {user?.role === "landlord" ? (
          <nav aria-label="Kotbaas" className="hidden gap-2 text-[15px] font-medium lg:flex">
            <Link href="/dashboard" className="rounded-full bg-surface-muted px-3.5 py-2 text-ink">
              Mijn koten
            </Link>
          </nav>
        ) : (
          <nav className="hidden gap-8 text-[15px] font-medium text-ink-muted lg:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-full bg-blush text-sm font-semibold"
            >
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </span>
            <span className="text-sm font-medium">{user.firstName}</span>
```

Geef de `<header>` ook een onderrand: `className="border-b border-line bg-surface"`.

"Berichten" en "Bezoeken" uit het ontwerp laat ik weg tot die pagina's bestaan.

---

## Controleren

```powershell
pnpm --filter @kotzoeker/shared test
pnpm --filter @kotzoeker/web typecheck
pnpm --filter @kotzoeker/web lint
pnpm dev
```

| Test | Verwacht |
| --- | --- |
| `/dashboard` met een draft zonder foto's | Stippelkader "Nog geen foto's", voortgangsbalk en "Nog x dingen … minstens 1 foto" |
| Filter "Draft" | URL wordt `/dashboard?status=draft`, enkel drafts; de teller klopt |
| Menu → Markeer als verhuurd (gepubliceerd kot) | Status "Verhuurd", knop "Opnieuw publiceren" |
| Menu → Archiveren | Bevestiging, daarna status "Gearchiveerd" en ontkleurde cover |
| `/dashboard/koten/nieuw` | Zijbalk "Eerst opslaan", geen fotosectie; opslaan brengt je naar de bewerkpagina |
| Beschrijving typen op de bewerkpagina | Teller loopt mee; bij 50 tekens wordt "Beschrijving" groen in de checklist |
| Publiceren met ontbrekende velden | Velden rood gemarkeerd, onderdelen in de inhoudstafel rood, melding in de zijbalk |
| Foto uploaden | Tegel met "Bezig met uploaden…", daarna de echte foto; checklist "Minstens 1 foto" wordt groen |
| Kosten inbegrepen aanzetten | Totaal per maand = enkel de huur, ook in het voorbeeld rechts |
| `/koten/<slug>` | Fotoraster, klik opent de lightbox (pijltjestoetsen werken), prijskaart blijft staan bij scrollen |
| Delen op een computer | "Link gekopieerd" |
| Playwright `kotbaas.spec.ts` | Moet nog slagen: alle labels ("Titel", "Straat", "Publiceren", …) bestaan nog. Enkel "Huur per maand (€)", "Kosten per maand (€)" en "Oppervlakte (m²)" heten nu "Huur", "Kosten" en "Oppervlakte": pas die drie `getByLabel`-regels aan. |
