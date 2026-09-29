import type {
    AmenityCategory,
    LeaseType,
    ListingStatus,
    ListingType,
} from "@kotzoeker/shared";

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  room: "Kamer",
  studio: "Studio",
  apartment: "Appartement",
  shared_house: "Gedeeld huis",
};

export const LEASE_TYPE_LABELS: Record<LeaseType, string> = {
  academic_year: "Academiejaar",
  full_year: "Volledig jaar",
  flexible: "Flexibel",
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Draft",
  published: "Gepubliceerd",
  rented: "Verhuurd",
  archived: "Gearchiveerd",
};

export const CATEGORY_LABELS: Record<AmenityCategory, string> = {
  sanitary: "Sanitair",
  kitchen: "Keuken",
  comfort: "Comfort",
  building: "Gebouw",
};
