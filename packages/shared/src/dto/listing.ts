export type ListingStatus = "draft" | "published" | "rented" | "archived";

export type ListingCardDto = {
  id: string;
  title: string;
  status: ListingStatus;
  city: string;
  rentCents: number;
  coverThumbUrl: string | null;
  updatedAt: string;
};

export type PublicListingDto = {
  slug: string;
  title: string;
  description: string | null;
  type: "room" | "studio" | "apartment" | "shared_house";
  rentCents: number;
  costsCents: number;
  costsIncluded: boolean;
  depositCents: number | null;
  sizeM2: number | null;
  street: string;
  postalCode: string;
  city: string;
  availableFrom: string | null;
  leaseType: "academic_year" | "full_year" | "flexible";
  epcLabel: string | null;
  hasConformityCertificate: boolean;
  coverUrl: string | null;
  photos: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  }[];
  amenities: {
    key: string;
    label: string;
    isShared: boolean;
    sharedWith: number | null;
  }[];
};
