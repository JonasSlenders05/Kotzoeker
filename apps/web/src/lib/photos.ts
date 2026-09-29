import imageCompression from "browser-image-compression";
export async function preparePhoto(file: File) {
  const common = { fileType: "image/webp", useWebWorker: true };
  const [full, thumb] = await Promise.all([
    imageCompression(file, {
      ...common,
      maxWidthOrHeight: 1600,
      maxSizeMB: 0.5,
    }),
    imageCompression(file, {
      ...common,
      maxWidthOrHeight: 400,
      maxSizeMB: 0.05,
    }),
  ]);
  return { full, thumb };
}
