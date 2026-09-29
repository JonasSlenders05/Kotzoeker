// apps/web/src/app/dashboard/koten/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/labels";
import { findAmenityOptions, findListingForEdit } from "@/server/dal/listing";
import { Badge } from "@/components/ui/badge";
import { ListingForm } from "@/components/listings/listing-form";
import { PhotoManager } from "@/components/listings/photo-manager";

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

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{listing.values.title}</h1>
          <Badge
            variant={listing.status === "published" ? "default" : "secondary"}
          >
            {STATUS_LABELS[listing.status]}
          </Badge>
        </div>
        {listing.status === "published" && listing.slug && (
          <Link href={`/koten/${listing.slug}`} className="text-sm underline">
            Bekijk publieke pagina
          </Link>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Foto&apos;s</h2>
        <PhotoManager listingId={listing.id} photos={listing.photos} />
      </section>

      <ListingForm
        listingId={listing.id}
        isPublished={listing.status === "published"}
        defaultValues={listing.values}
        amenityOptions={amenityOptions}
      />
    </div>
  );
}
