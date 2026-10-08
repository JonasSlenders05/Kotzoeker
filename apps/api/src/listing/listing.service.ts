import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from "@nestjs/common";
import { and, desc, asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
    amenities,
    listingAmenities,
    listingPhotos,
    listings,
} from "@kotzoeker/db";
import {
    ListingPublishable,
    type ListingCardDto,
    type ListingDraftInput,
    type ListingEditDto,
    type PublicListingDto,
    type PublicListingSummaryDto,
} from "@kotzoeker/shared";
import { AmenityService } from "../amenity/amenity.service";
import {
    InjectDrizzle,
    type DatabaseProvider,
} from "../drizzle/drizzle.provider";
import { PhotoStorage } from "../storage/photo-storage";
import {
    makeSlug,
    thumbPath,
    toAmenityRows,
    toColumns,
    toFormValues,
    toListingPhotoDto,
    toPublicListingDto,
    type AmenityRow,
} from "./listing.mapper";

export const LISTING_NOT_FOUND = "Dit kot bestaat niet (meer).";

@Injectable()
export class ListingService {
  constructor(
    @InjectDrizzle() private readonly db: DatabaseProvider,
    private readonly amenityService: AmenityService,
    private readonly storage: PhotoStorage,
  ) {}

  private readonly urlFor = (path: string) => this.storage.publicUrl(path);

  private ownedBy(landlorId: string, listingId: string) {
    return and(eq(listings.id, listingId), eq(listings.landlordId, landlorId));
  }

  private findAmenityRows(listingId: string): Promise<AmenityRow[]> {
    return this.db
      .select({
        amenityKey: listingAmenities.amenityKey,
        isShared: listingAmenities.isShared,
        sharedWith: listingAmenities.sharedWith,
      })
      .from(listingAmenities)
      .where(eq(listingAmenities.listingId, listingId));
  }

  private findPhotoRows(listingId: string) {
    return this.db
      .select()
      .from(listingPhotos)
      .where(eq(listingPhotos.listingId, listingId))
      .orderBy(asc(listingPhotos.position));
  }

  private async assertAmenitiesValid(input: ListingDraftInput) {
    if (!(await this.amenityService.areValid(input.amenities ?? []))) {
      throw new BadRequestException({
        message: "Een van de voorzieningen is ongeldig.",
        details: {
          body: { amenities: ["Een van de voorzieingen is ongeldig"] },
        },
      });
    }
  }

  async findAllForLandlord(landlordId: string): Promise<ListingCardDto[]> {
    const rows = await this.db
      .select({
        id: listings.id,
        title: listings.title,
        status: listings.status,
        slug: listings.slug,
        city: listings.city,
        rentCents: listings.rentCents,
        updatedAt: listings.updatedAt,
        coverPath: listingPhotos.storagePath,
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

    return rows.map(({ coverPath, updatedAt, ...rest }) => ({
      ...rest,
      coverThumbUrl: coverPath ? this.urlFor(thumbPath(coverPath)) : null,
      updatedAt: updatedAt.toISOString(),
    }));
  }

  async createListing(
    landlordId: string,
    input: ListingDraftInput,
  ): Promise<{ id: string }> {
    await this.assertAmenitiesValid(input);
    const chosen = input.amenities ?? [];

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(listings)
        .values({ ...toColumns(input), landlordId })
        .returning({ id: listings.id });

      if (chosen.length > 0) {
        await tx
          .insert(listingAmenities)
          .values(toAmenityRows(row!.id, chosen));
      }

      return { id: row!.id };
    });
  }

  async getListingForEdit(
    landlordId: string,
    listingId: string,
  ): Promise<ListingEditDto> {
    const [row] = await this.db
      .select()
      .from(listings)
      .where(this.ownedBy(landlordId, listingId));
    if (!row) throw new NotFoundException(LISTING_NOT_FOUND);

    const [chosen, photos] = await Promise.all([
      this.findAmenityRows(row.id),
      this.findPhotoRows(row.id),
    ]);

    return {
      id: row.id,
      status: row.status,
      slug: row.slug,
      values: toFormValues(row, chosen),
      photos: photos.map((p) => toListingPhotoDto(p, this.urlFor)),
    };
  }

  async updateListing(
    landlordId: string,
    listingId: string,
    input: ListingDraftInput,
  ): Promise<ListingEditDto> {
    const [current] = await this.db
      .select({ status: listings.status })
      .from(listings)
      .where(this.ownedBy(landlordId, listingId));

    if (!current) throw new NotFoundException(LISTING_NOT_FOUND);

    if (current.status === "published") {
      const check = ListingPublishable.safeParse(input);
      if (!check.success) {
        throw new BadRequestException({
          message: "Een gepubliceerd kot moet volledig blijven.",
          details: { body: z.flattenError(check.error).fieldErrors },
        });
      }
    }
    await this.assertAmenitiesValid(input);

    const chosen = input.amenities;
    await this.db.transaction(async (tx) => {
      await tx
        .update(listings)
        .set(toColumns(input))
        .where(this.ownedBy(landlordId, listingId));
      if (chosen) {
        await tx
          .delete(listingAmenities)
          .where(eq(listingAmenities.listingId, listingId));

        if (chosen.length > 0) {
          await tx
            .insert(listingAmenities)
            .values(toAmenityRows(listingId, chosen));
        }
      }
    });
    return this.getListingForEdit(landlordId, listingId);
  }

  async publish(landlordId: string, listingId: string): Promise<void> {
    const [row] = await this.db
      .select()
      .from(listings)
      .where(this.ownedBy(landlordId, listingId));

    if (!row) throw new NotFoundException(LISTING_NOT_FOUND);
    if (row.status === "published") return;

    const check = ListingPublishable.safeParse(
      toFormValues(row, await this.findAmenityRows(listingId)),
    );
    if (!check.success) {
      throw new UnprocessableEntityException({
        message: "Vul eerst alle verplichte velden in.",
        details: { body: z.flattenError(check.error).fieldErrors },
      });
    }

    const photoCount = await this.db.$count(
      listingPhotos,
      eq(listingPhotos.listingId, listingId),
    );
    if (photoCount === 0) {
      throw new UnprocessableEntityException(
        "Voeg minstens één foto toe voor je publiceert",
      );
    }

    await this.db
      .update(listings)
      .set({
        status: "published",
        publishedAt: new Date(),
        slug: row.slug ?? makeSlug(row.title),
      })
      .where(this.ownedBy(landlordId, listingId));
  }

  async archive(landlordId: string, listingId: string): Promise<void> {
    const updated = await this.db
      .update(listings)
      .set({ status: "archived" })
      .where(this.ownedBy(landlordId, listingId))
      .returning({ id: listings.id });
    if (updated.length == 0) throw new NotFoundException(LISTING_NOT_FOUND);
  }

  async findPublishedBySlug(slug: string): Promise<PublicListingDto> {
    const [row] = await this.db
      .select()
      .from(listings)
      .where(and(eq(listings.slug, slug), eq(listings.status, "published")));
    if (!row?.slug) throw new NotFoundException(LISTING_NOT_FOUND);

    const [photos, chosen] = await Promise.all([
      this.findPhotoRows(row.id),
      this.db
        .select({
          amenityKey: listingAmenities.amenityKey,
          isShared: listingAmenities.isShared,
          sharedWith: listingAmenities.sharedWith,
          label: amenities.labelNl,
          shareable: amenities.shareable,
        })
        .from(listingAmenities)
        .innerJoin(amenities, eq(amenities.key, listingAmenities.amenityKey))
        .where(eq(listingAmenities.listingId, row.id))
        .orderBy(asc(amenities.category), asc(amenities.labelNl)),
    ]);

    return toPublicListingDto(
      { ...row, slug: row.slug },
      photos,
      chosen,
      this.urlFor,
    );
  }

  async findPublished(): Promise<PublicListingSummaryDto[]> {
    const rows = await this.db
      .select({
        slug: listings.slug,
        title: listings.title,
        city: listings.city,
        rentCents: listings.rentCents,
        updatedAt: listings.updatedAt,
        coverPath: listingPhotos.storagePath,
      })
      .from(listings)
      .leftJoin(
        listingPhotos,
        and(
          eq(listingPhotos.listingId, listings.id),
          eq(listingPhotos.isCover, true),
        ),
      )
      .where(eq(listings.status, "published"))
      .orderBy(desc(listings.publishedAt));

    return rows.flatMap(({ slug, coverPath, updatedAt, ...rest }) =>
      slug
        ? [
            {
              ...rest,
              slug,
              coverThumbUrl: coverPath
                ? this.urlFor(thumbPath(coverPath))
                : null,
              updatedAt: updatedAt.toISOString(),
            },
          ]
        : [],
    );
  }
}
