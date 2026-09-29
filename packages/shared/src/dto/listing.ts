import type { LEASE_TYPES, LISTING_TYPES, ListingDraftInput } from "../listing";

export type ListingStatus = "draft" | "published" | "rented" | "archived";
export type ListingType = (typeof LISTING_TYPES)[number];
export type LeaseType = (typeof LEASE_TYPES)[number];
export type AmenityCategory = "sanitary" | "kitchen" | "comfort" | "building";

export type AmenityOptionDto = {
  key: string;
  label: string;
  category: AmenityCategory;
  shareable: boolean;
};

export type ListingPhotoDto = {
  id: string;
  storagePath: string;
  position: number;
  isCover: boolean;
  width: number | null;
  height: number | null;
};

export type ListingCardDto = {
  id: string;
  title: string;
  status: ListingStatus;
  slug: string | null;
  city: string;
  rentCents: number;
  coverThumbUrl: string | null;
  updatedAt: string;
};

export type ListingEditDto = {
  id: string;
  status: ListingStatus;
  slug: string | null;
  values: ListingDraftInput;
  photos: ListingPhotoDto[];
};

export type PublicListingDto = {
  slug: string;
  title: string;
  description: string | null;
  type: ListingType;
  rentCents: number;
  costsCents: number;
  costsIncluded: boolean;
  depositCents: number | null;
  sizeM2: number | null;
  street: string;
  postalCode: string;
  city: string;
  availableFrom: string | null;
  leaseType: LeaseType;
  minLeaseMonths: number | null;
  epcLabel: string | null;
  hasConformityCertificate: boolean;
  coverUrl: string | null;
  photos: {
    url: string;
    thumbUrl: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  }[];
  amenities: {
    key: string;
    label: string;
    shareable: boolean;
    isShared: boolean;
    sharedWith: number | null;
  }[];
};
