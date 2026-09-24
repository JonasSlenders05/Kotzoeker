CREATE TYPE "public"."amenity_category" AS ENUM('sanitary', 'kitchen', 'comfort', 'building');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('requested', 'confirmed', 'declined', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('nl', 'en', 'fr');--> statement-breakpoint
CREATE TYPE "public"."lease_type" AS ENUM('academic_year', 'full_year', 'flexible');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'published', 'rented', 'archived');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('room', 'studio', 'apartment', 'shared_house');--> statement-breakpoint
CREATE TYPE "public"."travel_mode" AS ENUM('bike', 'walk', 'public_transport');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'landlord', 'admin');--> statement-breakpoint
CREATE TABLE "amenities" (
	"key" text PRIMARY KEY NOT NULL,
	"label_nl" text NOT NULL,
	"label_en" text NOT NULL,
	"category" "amenity_category" NOT NULL,
	"shareable" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"name" text NOT NULL,
	"street" text,
	"postal_code" text,
	"city" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"landlord_id" uuid NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"student_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_student_id_listing_id_pk" PRIMARY KEY("student_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"website" text,
	"logo_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "institutions_shortName_unique" UNIQUE("short_name")
);
--> statement-breakpoint
CREATE TABLE "landlord_profiles" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"company_name" text,
	"vat_number" text,
	"bio" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_amenities" (
	"listing_id" uuid NOT NULL,
	"amenity_key" text NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"shared_with" smallint,
	CONSTRAINT "listing_amenities_listing_id_amenity_key_pk" PRIMARY KEY("listing_id","amenity_key")
);
--> statement-breakpoint
CREATE TABLE "listing_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"alt_text" text,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_id" uuid NOT NULL,
	"type" "listing_type" DEFAULT 'room' NOT NULL,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"rent_cents" integer NOT NULL,
	"costs_cents" integer DEFAULT 0 NOT NULL,
	"costs_included" boolean DEFAULT false NOT NULL,
	"deposit_cents" integer,
	"size_m2" smallint,
	"street" text NOT NULL,
	"house_number" text NOT NULL,
	"box" text,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"available_from" date,
	"lease_type" "lease_type" DEFAULT 'academic_year' NOT NULL,
	"min_lease_months" smallint,
	"has_conformity_certificate" boolean DEFAULT false NOT NULL,
	"epc_label" text,
	"ai_generated_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listings_rent_positive" CHECK ("listings"."rent_cents" > 0),
	CONSTRAINT "listings_costs_non_negative" CHECK ("listings"."costs_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_body_not_empty" CHECK (length(trim("messages"."body")) > 0)
);
--> statement-breakpoint
CREATE TABLE "preference_amenities" (
	"student_id" uuid NOT NULL,
	"amenity_key" text NOT NULL,
	"must_be_private" boolean DEFAULT false NOT NULL,
	CONSTRAINT "preference_amenities_student_id_amenity_key_pk" PRIMARY KEY("student_id","amenity_key")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"avatar_path" text,
	"phone" text,
	"preferred_language" "language" DEFAULT 'nl' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "student_preferences" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"campus_id" uuid,
	"max_rent_cents" integer,
	"min_size_m2" smallint,
	"move_in_date" date,
	"lease_type" "lease_type",
	"listing_types" "listing_type"[],
	"travel_mode" "travel_mode"[],
	"max_travel_minutes" smallint,
	"semantic_search_prompt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"birth_date" date,
	"institution_id" uuid,
	"campus_id" uuid,
	"study_program" text,
	"study_year" smallint,
	"bio" text,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visit_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "booking_status" DEFAULT 'requested' NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visit_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"capacity" smallint DEFAULT 1 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visit_slots_time_order" CHECK ("visit_slots"."ends_at" > "visit_slots"."starts_at"),
	CONSTRAINT "visit_slots_capacity_positive" CHECK ("visit_slots"."capacity" > 0)
);
--> statement-breakpoint
ALTER TABLE "campuses" ADD CONSTRAINT "campuses_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_landlord_id_profiles_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landlord_profiles" ADD CONSTRAINT "landlord_profiles_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_amenities" ADD CONSTRAINT "listing_amenities_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_amenities" ADD CONSTRAINT "listing_amenities_amenity_key_amenities_key_fk" FOREIGN KEY ("amenity_key") REFERENCES "public"."amenities"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_landlord_id_profiles_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preference_amenities" ADD CONSTRAINT "preference_amenities_student_id_student_preferences_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_preferences"("student_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preference_amenities" ADD CONSTRAINT "preference_amenities_amenity_key_amenities_key_fk" FOREIGN KEY ("amenity_key") REFERENCES "public"."amenities"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_preferences" ADD CONSTRAINT "student_preferences_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_preferences" ADD CONSTRAINT "student_preferences_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_bookings" ADD CONSTRAINT "visit_bookings_slot_id_visit_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."visit_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_bookings" ADD CONSTRAINT "visit_bookings_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_slots" ADD CONSTRAINT "visit_slots_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campuses_institution_id_index" ON "campuses" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_listing_id_student_id_index" ON "conversations" USING btree ("listing_id","student_id");--> statement-breakpoint
CREATE INDEX "conversations_student_id_last_message_at_index" ON "conversations" USING btree ("student_id","last_message_at");--> statement-breakpoint
CREATE INDEX "conversations_landlord_id_last_message_at_index" ON "conversations" USING btree ("landlord_id","last_message_at");--> statement-breakpoint
CREATE INDEX "listing_photos_listing_id_position_index" ON "listing_photos" USING btree ("listing_id","position");--> statement-breakpoint
CREATE INDEX "listings_landlord_id_index" ON "listings" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "listings_status_city_index" ON "listings" USING btree ("status","city");--> statement-breakpoint
CREATE INDEX "listings_available_from_index" ON "listings" USING btree ("available_from");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_created_at_index" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "profiles_role_index" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "visit_bookings_slot_id_student_id_index" ON "visit_bookings" USING btree ("slot_id","student_id");--> statement-breakpoint
CREATE INDEX "visit_bookings_student_id_index" ON "visit_bookings" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "visit_slots_listing_id_starts_at_index" ON "visit_slots" USING btree ("listing_id","starts_at");