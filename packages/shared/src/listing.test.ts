// packages/shared/src/listing.test.ts
import { describe, expect, it } from "vitest";
import { ListingDraft, ListingPublishable, toCents } from "./listing";

const makeValidListing = (overrides: Record<string, unknown> = {}) => ({
  type: "room",
  title: "Ruim kot vlak bij campus Schoonmeersen",
  description:
    "Lichte kamer van 16 m² met lavabo, gedeelde keuken en fietsenstalling. Rustige straat.",
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
  ...overrides,
});

/** Het pad van de eerste fout, bv. ['rentEuro']. */
const firstErrorPath = (input: unknown) =>
  ListingPublishable.safeParse(input).error?.issues[0]?.path;

describe("ListingPublishable", () => {
  it("aanvaardt een volledig kot", () => {
    expect(ListingPublishable.safeParse(makeValidListing()).success).toBe(true);
  });

  it("weigert een negatieve huur", () => {
    expect(firstErrorPath(makeValidListing({ rentEuro: -10 }))).toEqual([
      "rentEuro",
    ]);
  });

  it("zet getallen uit een formulier om", () => {
    const result = ListingPublishable.safeParse(
      makeValidListing({ rentEuro: "450.50", sizeM2: "16" }),
    );
    expect(result.data?.rentEuro).toBe(450.5);
    expect(result.data?.sizeM2).toBe(16);
  });

  it("geeft een Nederlandse melding als de beschrijving ontbreekt", () => {
    const result = ListingPublishable.safeParse(
      makeValidListing({ description: undefined }),
    );
    expect(result.error?.issues[0]?.message).toBe(
      "Beschrijf je kot in minstens 50 tekens",
    );
  });

  it("weigert een lege titel", () => {
    expect(firstErrorPath(makeValidListing({ title: "   " }))).toEqual([
      "title",
    ]);
  });

  it("weigert postcode 0999", () => {
    expect(firstErrorPath(makeValidListing({ postalCode: "0999" }))).toEqual([
      "postalCode",
    ]);
  });

  it.each(["01/09/2027", "2027-13-01", "morgen"])(
    "weigert de datum %s",
    (availableFrom) => {
      expect(firstErrorPath(makeValidListing({ availableFrom }))).toEqual([
        "availableFrom",
      ]);
    },
  );

  it("weigert een kot kleiner dan 6 m²", () => {
    expect(firstErrorPath(makeValidListing({ sizeM2: 4 }))).toEqual(["sizeM2"]);
  });

  it("aanvaardt een gedeelde voorziening zonder aantal", () => {
    const amenities = [{ key: "toilet", isShared: true }];
    expect(
      ListingPublishable.safeParse(makeValidListing({ amenities })).success,
    ).toBe(true);
  });

  it('weigert "gedeeld met 1 persoon"', () => {
    const amenities = [{ key: "toilet", isShared: true, sharedWith: 1 }];
    expect(firstErrorPath(makeValidListing({ amenities }))).toEqual([
      "amenities",
      0,
      "sharedWith",
    ]);
  });

  it("weigert een onbekend EPC-label", () => {
    expect(firstErrorPath(makeValidListing({ epcLabel: "G" }))).toEqual([
      "epcLabel",
    ]);
  });
});

describe("ListingDraft", () => {
  it("aanvaardt een kot met enkel de verplichte velden", () => {
    const draft = {
      title: "Kot in Gent",
      rentEuro: 400,
      street: "Kerkstraat",
      houseNumber: "5",
      postalCode: "9000",
      city: "Gent",
    };
    expect(ListingDraft.safeParse(draft).success).toBe(true);
  });

  it("weigert een draft zonder adres", () => {
    const result = ListingDraft.safeParse({
      title: "Kot in Gent",
      rentEuro: 400,
    });
    expect(result.success).toBe(false);
  });
});

describe("toCents", () => {
  it("rondt kommagetallen correct af", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
});
