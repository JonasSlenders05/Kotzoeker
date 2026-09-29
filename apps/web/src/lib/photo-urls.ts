const BUCKET_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos`;

export const photoUrl = (storagePath: string) => `${BUCKET_URL}/${storagePath}`;
export const thumbPath = (storagePath: string) =>
  storagePath.replace(/\.webp$/, "_thumb.webp");
export const thumbUrl = (storagePath: string) =>
  photoUrl(thumbPath(storagePath));
