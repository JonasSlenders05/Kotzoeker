// apps/web/src/app/dashboard/page.tsx
import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { formatDate, formatEuro } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/labels";
import { findListingsByLandlord } from "@/server/dal/listing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingRowActions } from "@/components/listings/listing-row-actions";

export default async function DashboardPage() {
  const user = await requireRole("landlord");
  const listings = await findListingsByLandlord(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Mijn koten</h1>
          <p className="text-muted-foreground">Welkom, {user.firstName}</p>
        </div>
        {listings.length > 0 && (
          <Button asChild>
            <Link href="/dashboard/koten/nieuw">Kot toevoegen</Link>
          </Button>
        )}
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p>Je hebt nog geen koten.</p>
            <Button asChild>
              <Link href="/dashboard/koten/nieuw">Eerste kot toevoegen</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {listings.map((kot) => (
            <li key={kot.id}>
              <Card>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                  <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md bg-muted sm:w-40">
                    {kot.coverThumbUrl && (
                      <Image
                        src={kot.coverThumbUrl}
                        alt=""
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium">{kot.title}</h2>
                      <Badge
                        variant={
                          kot.status === "published" ? "default" : "secondary"
                        }
                      >
                        {STATUS_LABELS[kot.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {kot.city} · {formatEuro(kot.rentCents)} per maand ·
                      gewijzigd op {formatDate(kot.updatedAt)}
                    </p>
                    <ListingRowActions
                      id={kot.id}
                      status={kot.status}
                      slug={kot.slug}
                    />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
