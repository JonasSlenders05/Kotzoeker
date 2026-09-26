import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  doublePrecision,
  timestamp,
  date,
  primaryKey,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";

// HELPERS
const createdAt = timestamp({ withTimezone: true }).defaultNow().notNull();
const timestamps = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

// ENUMS
export const userRole = pgEnum("user_role", ["student", "landlord", "admin"]);
export const language = pgEnum("language", ["nl", "en", "fr"]);
export const listingType = pgEnum("listing_type", [
  "room",
  "studio",
  "apartment",
  "shared_house",
]);
export const listingStatus = pgEnum("listing_status", [
  "draft",
  "published",
  "rented",
  "archived",
]);
export const leaseType = pgEnum("lease_type", [
  "academic_year",
  "full_year",
  "flexible",
]);
export const travelMode = pgEnum("travel_mode", [
  "bike",
  "walk",
  "public_transport",
]);
export const amenityCategory = pgEnum("amenity_category", [
  "sanitary",
  "kitchen",
  "comfort",
  "building",
]);
export const bookingStatus = pgEnum("booking_status", [
  "requested",
  "confirmed",
  "declined",
  "cancelled",
]);

export type UserRole = (typeof userRole.enumValues)[number];

//USERS
export const profiles = pgTable(
  "profiles",
  {
    id: uuid().primaryKey(),
    role: userRole(),
    email: text().notNull().unique(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    avatarPath: text(), //pad in Storage-bucket "avatars"
    phone: text(),
    preferredLanguage: language().notNull().default("nl"),
    ...timestamps,
  },
  (t) => [index().on(t.role)],
);

// Scholen
export const institutions = pgTable("institutions", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(), // "Hogeschool Gent"
  shortName: text().notNull().unique(), // "HOGENT"
  website: text(),
  logoPath: text(), //pad naar storage bucket "insitutionLogos
  createdAt,
});

export const campuses = pgTable(
  "campuses",
  {
    id: uuid().primaryKey().defaultRandom(),
    institutionId: uuid()
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    name: text().notNull(),
    street: text(),
    postalCode: text(),
    city: text().notNull(),
    lat: doublePrecision().notNull(),
    lng: doublePrecision().notNull(),
    createdAt,
  },
  (t) => [index().on(t.institutionId)],
);

export const studentProfiles = pgTable("student_profiles", {
  profileId: uuid()
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  birthDate: date(),
  institutionId: uuid().references(() => institutions.id, {
    onDelete: "set null",
  }),
  campusId: uuid().references(() => campuses.id, { onDelete: "set null" }),
  studyProgram: text(),
  studyYear: smallint(),
  bio: text(),
  onboardingCompletedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const landlordProfiles = pgTable("landlord_profiles", {
  profileId: uuid()
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  companyName: text(),
  vatNumber: text(), // "BE0123456789"
  bio: text(),
  verifiedAt: timestamp({ withTimezone: true }), // null = niet geverifieerd
  ...timestamps,
});

export const listings = pgTable(
  "listings",
  {
    id: uuid().primaryKey().defaultRandom(),
    landlordId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: listingType().notNull().default("room"),
    status: listingStatus().notNull().default("draft"),
    title: text().notNull(),
    description: text(),
    rentCents: integer().notNull(), // prijzen in centen per maand
    costsCents: integer().notNull().default(0),
    costsIncluded: boolean().notNull().default(false),
    depositCents: integer(),
    sizeM2: smallint("size_m2"), // expliciete naam: casing zou size_m_2 maken
    street: text().notNull(),
    houseNumber: text().notNull(),
    box: text(),
    postalCode: text().notNull(),
    city: text().notNull(),
    lat: doublePrecision(),
    lng: doublePrecision(),
    availableFrom: date(),
    leaseType: leaseType().notNull().default("academic_year"),
    minLeaseMonths: smallint(),
    hasConformityCertificate: boolean().notNull().default(false), // conformiteitsattest
    epcLabel: text(), // "A+" .. "F"
    aiGeneratedAt: timestamp({ withTimezone: true }),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index().on(t.landlordId),
    index().on(t.status, t.city),
    index().on(t.availableFrom),
    check("listings_rent_positive", sql`${t.rentCents} > 0`),
    check("listings_costs_non_negative", sql`${t.costsCents} >= 0`),
  ],
);

export const listingPhotos = pgTable(
  "listing_photos",
  {
    id: uuid().primaryKey().defaultRandom(),
    listingId: uuid()
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    storagePath: text().notNull(),
    position: smallint().notNull().default(0),
    isCover: boolean().notNull().default(false),
    altText: text(),
    width: integer(),
    height: integer(),
    createdAt,
  },
  (t) => [index().on(t.listingId, t.position)],
);

export const amenities = pgTable("amenities", {
  key: text().primaryKey(), // "bathroom", "sink", "toilet", "kitchen", "furnished", "wifi", ...
  labelNl: text().notNull(),
  labelEn: text().notNull(),
  category: amenityCategory().notNull(),
  shareable: boolean().notNull().default(true), // false = kan niet gedeeld zijn (bemeubeld, wifi)
});

export const listingAmenities = pgTable(
  "listing_amenities",
  {
    listingId: uuid()
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    amenityKey: text()
      .notNull()
      .references(() => amenities.key, { onDelete: "cascade" }),
    isShared: boolean().notNull().default(false), //privé of gedeelde voorziening
    sharedWith: smallint(), // delen met x personen
  },
  (t) => [primaryKey({ columns: [t.listingId, t.amenityKey] })],
);

export const studentPreferences = pgTable("student_preferences", {
  studentId: uuid()
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  campusId: uuid().references(() => campuses.id, { onDelete: "set null" }),
  maxRentCents: integer(),
  minSizeM2: smallint("min_size_m2"), // expliciete naam: casing zou min_size_m_2 maken
  moveInDate: date(),
  leaseType: leaseType(),
  listingTypes: listingType().array(), //null = alles ok
  travelMode: travelMode().default("bike").array(),
  maxTravelMinutes: smallint(),
  semanticSearchPrompt: text(),
  ...timestamps,
});

export const preferenceAmenities = pgTable(
  "preference_amenities",
  {
    studentId: uuid()
      .notNull()
      .references(() => studentPreferences.studentId, { onDelete: "cascade" }),
    amenityKey: text()
      .notNull()
      .references(() => amenities.key, { onDelete: "cascade" }),
    mustBePrivate: boolean().notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.studentId, t.amenityKey] })],
);

export const favorites = pgTable(
  "favorites",
  {
    studentId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    listingId: uuid()
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt,
  },
  (t) => [primaryKey({ columns: [t.studentId, t.listingId] })],
);

// CHAT

export const conversations = pgTable(
  "conversations",
  {
    id: uuid().primaryKey().defaultRandom(),
    listingId: uuid()
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    studentId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    landlordId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp({ withTimezone: true }),
    createdAt,
  },
  (t) => [
    uniqueIndex().on(t.listingId, t.studentId), // één thread per student per kot
    index().on(t.studentId, t.lastMessageAt),
    index().on(t.landlordId, t.lastMessageAt),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid().primaryKey().defaultRandom(),
    conversationId: uuid()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text().notNull(),
    readAt: timestamp({ withTimezone: true }),
    createdAt,
  },
  (t) => [
    index().on(t.conversationId, t.createdAt),
    check("messages_body_not_empty", sql`length(trim(${t.body})) > 0`),
  ],
);

// bezoeken
export const visitSlots = pgTable(
  "visit_slots",
  {
    id: uuid().primaryKey().defaultRandom(),
    listingId: uuid()
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    capacity: smallint().notNull().default(1), // >1 = groepsbezoek
    note: text(),
    createdAt,
  },
  (t) => [
    index().on(t.listingId, t.startsAt),
    check("visit_slots_time_order", sql`${t.endsAt} > ${t.startsAt}`),
    check("visit_slots_capacity_positive", sql`${t.capacity} > 0`),
  ],
);

export const visitBookings = pgTable(
  "visit_bookings",
  {
    id: uuid().primaryKey().defaultRandom(),
    slotId: uuid()
      .notNull()
      .references(() => visitSlots.id, { onDelete: "cascade" }),
    studentId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: bookingStatus().notNull().default("requested"),
    message: text(),
    ...timestamps,
  },
  (t) => [uniqueIndex().on(t.slotId, t.studentId), index().on(t.studentId)],
);
