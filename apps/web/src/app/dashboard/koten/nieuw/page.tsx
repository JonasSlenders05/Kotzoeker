// apps/web/src/app/dashboard/koten/nieuw/page.tsx
import { requireRole } from "@/lib/auth";
import { findAmenityOptions } from "@/server/dal/listing";
import { ListingForm } from "@/components/listings/listing-form";

export default async function NewListingPage() {
  await requireRole("landlord");
  const amenityOptions = await findAmenityOptions();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Nieuw kot</h1>
        <p className="text-muted-foreground">
          Sla eerst op als draft. Daarna voeg je foto&apos;s toe en publiceer
          je.
        </p>
      </div>
      <ListingForm amenityOptions={amenityOptions} />
    </div>
  );
}
