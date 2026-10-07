import { Injectable } from "@nestjs/common";
import { asc, inArray } from "drizzle-orm";
import { amenities } from "@kotzoeker/db";
import type { AmenityOptionDto, ListingDraftInput } from "@kotzoeker/shared";
import {
  InjectDrizzle,
  type DatabaseProvider,
} from "../drizzle/drizzle.provider";

type AmenityInput = NonNullable<ListingDraftInput["amenities"]>;

@Injectable()
export class AmenityService {
  constructor(@InjectDrizzle() private readonly db: DatabaseProvider) {}

  async getAll(): Promise<AmenityOptionDto[]> {
    const rows = await this.db
      .select()
      .from(amenities)
      .orderBy(asc(amenities.labelNl));
    return rows.map((r) => ({
      key: r.key,
      label: r.labelNl,
      category: r.category,
      shareable: r.shareable,
    }));
  }

  async areValid(chosen: AmenityInput): Promise<boolean> {
    if (chosen.length === 0) return true;
    const rows = await this.db
      .select({ key: amenities.key, shareable: amenities.shareable })
      .from(amenities)
      .where(
        inArray(
          amenities.key,
          chosen.map((a) => a.key),
        ),
      );
    const shareable = new Map(rows.map((r) => [r.key, r.shareable]));
    const unique = new Set(chosen.map((a) => a.key)).size === chosen.length;
    return (
      unique &&
      chosen.every(
        (a) => shareable.has(a.key) && (!a.isShared || shareable.get(a.key)),
      )
    );
  }
}
