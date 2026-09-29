import { z } from "zod";

export const MAX_PHOTOS_PER_LISTING = 20;

export const AddPhotoSchema = z.object({
  listingId: z.uuid(),
  photoId: z.uuid(),
  width: z.number().int().min(1).max(10_000),
  height: z.number().int().min(1).max(10_000),
});

export const ReorderPhotosSchema = z.object({
  listingId: z.uuid(),
  photoIds: z.array(z.uuid()).min(1).max(MAX_PHOTOS_PER_LISTING),
});

export type AddPhotoInput = z.infer<typeof AddPhotoSchema>;
