import { z } from "zod";

export const MAX_PHOTOS_PER_LISTING = 20;
/** Maximale grootte van één bestand dat de API aanvaardt (de browser comprimeert naar ±500 KB). */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** De tekstvelden die bij een foto-upload (multipart) meekomen. */
export const PhotoUploadSchema = z.object({
  width: z.coerce.number().int().min(1).max(10_000),
  height: z.coerce.number().int().min(1).max(10_000),
});

export const ReorderPhotosSchema = z.object({
  photoIds: z.array(z.uuid()).min(1).max(MAX_PHOTOS_PER_LISTING),
});

export type PhotoUploadInput = z.infer<typeof PhotoUploadSchema>;
export type ReorderPhotosInput = z.infer<typeof ReorderPhotosSchema>;
