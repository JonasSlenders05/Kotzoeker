import { z } from "zod";

export const MAX_PHOTOS_PER_LISTING = 20;
export const MAX_PHOTOS_BYTES = 5 * 1024 * 1024;

export const PhotoUploadSchema = z.object({
  width: z.coerce.number().int().min(1).max(10_000),
  height: z.coerce.number().int().int().min(1).max(10_000),
});

export const ReorderPhotosSchema = z.object({
  photoId: z.array(z.uuid().min(1).max(MAX_PHOTOS_PER_LISTING)),
});

export type PhotoUploadInput = z.infer<typeof PhotoUploadSchema>;
export type ReorderPhotosInput = z.infer<typeof ReorderPhotosSchema>;
