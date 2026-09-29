// apps/web/src/app/koten/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PublicListingDto } from "@kotzoeker/shared";
import { formatDate, formatEuro } from "@/lib/format";
import { LEASE_TYPE_LABELS, LISTING_TYPE_LABELS } from "@/lib/labels";
import { getPublishedListingBySlug } from "@/server/dal/listing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhotoGallery } from "./photo-gallery";

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

  const monthlyCents = kot.costsIncluded
    ? kot.rentCents
    : kot.rentCents + kot.costsCents;

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-6 md:py-10">
      <PhotoGallery photos={kot.photos} title={kot.title} />

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {kot.street}, {kot.postalCode} {kot.city}
        </p>
        <h1 className="text-2xl font-semibold md:text-3xl">{kot.title}</h1>
      </header>

      <section aria-label="Prijs" className="space-y-1 rounded-lg border p-4">
        <p className="text-3xl font-semibold">
          {formatEuro(monthlyCents)}{" "}
          <span className="text-base font-normal text-muted-foreground">
            per maand
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          {kot.costsIncluded
            ? `Huur ${formatEuro(kot.rentCents)}, kosten inbegrepen`
            : `Huur ${formatEuro(kot.rentCents)} + kosten ${formatEuro(kot.costsCents)}`}
          {kot.depositCents !== null &&
            ` · Waarborg ${formatEuro(kot.depositCents)}`}
        </p>
      </section>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Fact label="Type" value={LISTING_TYPE_LABELS[kot.type]} />
        <Fact
          label="Oppervlakte"
          value={kot.sizeM2 ? `${kot.sizeM2} m²` : "Niet opgegeven"}
        />
        <Fact
          label="Beschikbaar vanaf"
          value={kot.availableFrom ? formatDate(kot.availableFrom) : "Nu"}
        />
        <Fact label="Huurtype" value={LEASE_TYPE_LABELS[kot.leaseType]} />
        {kot.minLeaseMonths && (
          <Fact
            label="Minimale huurduur"
            value={`${kot.minLeaseMonths} maanden`}
          />
        )}
        <Fact label="EPC-label" value={kot.epcLabel ?? "Niet opgegeven"} />
        <Fact
          label="Conformiteitsattest"
          value={kot.hasConformityCertificate ? "Ja" : "Niet opgegeven"}
        />
      </dl>

      {kot.amenities.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Voorzieningen</h2>
          <ul className="flex flex-wrap gap-2">
            {kot.amenities.map((a) => (
              <li key={a.key}>
                <Badge variant="secondary">{amenityText(a)}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {kot.description && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Beschrijving</h2>
          <p className="whitespace-pre-line leading-relaxed">
            {kot.description}
          </p>
        </section>
      )}

      {/* Fase 4: kaart met lat/lng. Fase 6: contact via de chat. */}
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Kaart volgt binnenkort
      </div>
      <Button disabled className="w-full sm:w-auto">
        Contacteer kotbaas (binnenkort)
      </Button>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function amenityText(a: PublicListingDto["amenities"][number]) {
  if (!a.shareable) return a.label; // "Bemeubeld", "Wifi": privé of gedeeld zegt daar niets
  if (!a.isShared) return `${a.label} · privé`;
  return a.sharedWith
    ? `${a.label} · gedeeld met ${a.sharedWith}`
    : `${a.label} · gedeeld`;
}
