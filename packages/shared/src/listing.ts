import { z } from "zod";

export const LISTING_TYPES = [
  "room",
  "studio",
  "apartment",
  "shared_house",
] as const;
export const LEASE_TYPES = ["academic_year", "full_year", "flexible"] as const;
export const EPC_VALUES = ["A+", "A", "B", "C", "D", "E", "F"] as const;

export const ListingAmenityInput = z.object({
  key: z.string().min(1),
  isShared: z.boolean(),
  sharedWith: z.coerce.number().int().min(2).max(30).optional(),
});

export const ListingPublishable = z.object({
  type: z.enum(LISTING_TYPES),
  title: z
    .string()
    .trim()
    .min(5, "Geef je kot een titel (min. 5 karakters)")
    .max(100),
  description: z
    .string()
    .trim()
    .min(50, "Beschrijf je kot in minstens 50 tekens")
    .max(5000),
  rentEuro: z.coerce.number().positive("De huur moet positief zijn").max(5000),
  costsEuro: z.coerce.number().min(0).max(2000),
  costsIncluded: z.boolean(),
  street: z.string().trim().min(1, "Vul de straat in"),
  houseNumber: z.string().trim().min(1, "Vul het huisnummer in"),
  box: z.string().trim().max(10).optional(),
  postalCode: z
    .string()
    .regex(/^[1-9][0-9]{3}$/, "Dit is geen Belgische postcode"),
  city: z.string().trim().min(1, "Vul de gemeente in"),
  availableFrom: z.iso.date(), // 'YYYY-MM-DD', zoals een <input type="date"> en Drizzle date() het geven
  leaseType: z.enum(LEASE_TYPES),
  amenities: z.array(ListingAmenityInput),
  depositEuro: z.coerce
    .number()
    .min(0, "Vul je huurwaarborg in voor dit kot")
    .max(9999),
  sizeM2: z.coerce.number().min(1, "Hoe groot is het kot in M²").max(999),
  minLeaseMonths: z.coerce
    .number()
    .min(1, "Wat is het minimum aantal huurmaanden"),
  hasComformityCertificate: z.boolean().default(false),
  epcLabel: z.enum(EPC_VALUES),
});

export const ListingDraft = ListingPublishable.partial().required({
  title: true,
  rentEuro: true,
  street: true,
  houseNumber: true,
  postalCode: true,
  city: true,
});

export type ListingDraftInput = z.infer<typeof ListingDraft>;
export type ListingPublishableInput = z.infer<typeof ListingPublishable>;

export const toCents = (euro: number) => Math.round(euro * 100);
export const toEuro = (cents: number) => cents / 100;
