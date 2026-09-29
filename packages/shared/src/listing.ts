import { z } from "zod";

export const LISTING_TYPES = [
  "room",
  "studio",
  "apartment",
  "shared_house",
] as const;
export const LEASE_TYPES = ["academic_year", "full_year", "flexible"] as const;
export const EPC_LABELS = ["A+", "A", "B", "C", "D", "E", "F"] as const;

export const ListingAmenityInput = z.object({
  key: z.string().min(1),
  isShared: z.boolean(),
  sharedWith: z.coerce
    .number()
    .int()
    .min(2, "Gedeeld met minstens 2 personen")
    .max(30)
    .optional(),
});

const number = (message = "Vul een getal in") =>
  z.coerce.number({ error: message });

export const ListingPublishable = z.object({
  type: z.enum(LISTING_TYPES),
  title: z
    .string()
    .trim()
    .min(5, "Geef je kot een titel van minstens 5 tekens")
    .max(100),
  description: z
    .string({ error: "Beschrijf je kot in minstens 50 tekens" }) // ook als het veld leeg is
    .trim()
    .min(50, "Beschrijf je kot in minstens 50 tekens")
    .max(5000),
  rentEuro: number("Vul de huur in")
    .positive("De huur moet positief zijn")
    .max(5000),
  costsEuro: number().min(0).max(2000),
  costsIncluded: z.boolean(),
  depositEuro: number().min(0).max(10000).optional(),
  sizeM2: number()
    .int("Geef een geheel getal")
    .min(6, "Een kot is minstens 6 m²")
    .max(500),
  street: z.string().trim().min(1, "Vul de straat in"),
  houseNumber: z.string().trim().min(1, "Vul het huisnummer in"),
  box: z.string().trim().max(10).optional(),
  postalCode: z
    .string()
    .regex(/^[1-9][0-9]{3}$/, "Dit is geen Belgische postcode"),
  city: z.string().trim().min(1, "Vul de gemeente in"),
  availableFrom: z.iso.date("Kies een datum"), // 'YYYY-MM-DD', zoals <input type="date"> en Drizzle date() het geven
  leaseType: z.enum(LEASE_TYPES),
  minLeaseMonths: number().int().min(1).max(24).optional(),
  hasConformityCertificate: z.boolean(),
  epcLabel: z.enum(EPC_LABELS).optional(),
  amenities: z.array(ListingAmenityInput),
});

export const ListingDraft = ListingPublishable.partial().required({
  title: true,
  rentEuro: true,
  street: true,
  houseNumber: true,
  postalCode: true,
  city: true,
});

export type ListingFormInput = z.input<typeof ListingDraft>;
export type ListingDraftInput = z.infer<typeof ListingDraft>;
export type ListingPublishableInput = z.infer<typeof ListingPublishable>;

export const toCents = (euro: number) => Math.round(euro * 100);
export const toEuro = (cents: number) => cents / 100;
