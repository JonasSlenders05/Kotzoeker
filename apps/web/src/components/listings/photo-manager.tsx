// apps/web/src/components/listings/photo-manager.tsx
"use client";

import { useState, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  MAX_PHOTOS_PER_LISTING,
  type ListingPhotoDto,
} from "@kotzoeker/shared";
import {
  addListingPhoto,
  deleteListingPhoto,
  reorderListingPhotos,
} from "@/app/dashboard/koten/photo-actions";
import { preparePhoto } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { SortablePhoto } from "./sortable-photo";

type Upload = {
  id: string; // wordt ook het id van de foto en de bestandsnaam
  file: File;
  previewUrl: string;
  status: "waiting" | "busy" | "failed";
  error?: string;
};

const PARALLEL_UPLOADS = 3;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

const REJECTION_MESSAGES: Record<string, string> = {
  "file-invalid-type":
    "Enkel JPG, PNG of WebP. Zet iPhone-foto's (HEIC) eerst om naar JPG.",
  "file-too-large": "Groter dan 15 MB.",
  "too-many-files": `Maximaal ${MAX_PHOTOS_PER_LISTING} foto's per kot.`,
};

/** Voert `task` uit voor alle items, met hoogstens `limit` tegelijk. */
async function runLimited<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await task(items[next++]!);
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
}

type Props = { listingId: string; photos: ListingPhotoDto[] };

export function PhotoManager({ listingId, photos: serverPhotos }: Props) {
  // Lokale kopie, zodat slepen meteen zichtbaar is. Stuurt de server nieuwe foto's, dan nemen we die over.
  const [photos, setPhotos] = useState(serverPhotos);
  const [lastServerPhotos, setLastServerPhotos] = useState(serverPhotos);
  if (serverPhotos !== lastServerPhotos) {
    setLastServerPhotos(serverPhotos);
    setPhotos(serverPhotos);
  }

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remaining = MAX_PHOTOS_PER_LISTING - photos.length - uploads.length;

  const updateUpload = (id: string, changes: Partial<Upload>) =>
    setUploads((list) =>
      list.map((u) => (u.id === id ? { ...u, ...changes } : u)),
    );

  const removeUpload = (upload: Upload) => {
    URL.revokeObjectURL(upload.previewUrl);
    setUploads((list) => list.filter((u) => u.id !== upload.id));
  };

  async function uploadOne(upload: Upload) {
    updateUpload(upload.id, { status: "busy", error: undefined });
    try {
      const { full, thumb } = await preparePhoto(upload.file);
      const bitmap = await createImageBitmap(full);
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();

      // Stap 1: rechtstreeks naar Storage. De Storage-policy controleert of dit jouw kot is.
      const bucket = createClient().storage.from("listing-photos");
      const base = `${listingId}/${upload.id}`;
      const results = await Promise.all([
        bucket.upload(`${base}.webp`, full, { contentType: "image/webp" }),
        bucket.upload(`${base}_thumb.webp`, thumb, {
          contentType: "image/webp",
        }),
      ]);
      if (results.some((r) => r.error)) throw new Error("Uploaden mislukt.");

      // Stap 2: de rij in listing_photos. De server bouwt het pad zelf op.
      const result = await addListingPhoto({
        listingId,
        photoId: upload.id,
        ...size,
      });
      if (!result.ok) throw new Error(result.message);

      removeUpload(upload); // de foto zit nu in `photos` via de server
    } catch (e) {
      updateUpload(upload.id, {
        status: "failed",
        error: e instanceof Error ? e.message : "Uploaden mislukt.",
      });
    }
  }

  function retry(upload: Upload) {
    // Nieuw id: een half gelukte eerste poging kan het oude pad al bezet hebben.
    const fresh: Upload = {
      ...upload,
      id: crypto.randomUUID(),
      status: "waiting",
      error: undefined,
    };
    setUploads((list) => list.map((u) => (u.id === upload.id ? fresh : u)));
    void uploadOne(fresh);
  }

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
      maxSize: MAX_INPUT_BYTES,
      maxFiles: Math.max(remaining, 1), // 0 betekent "onbeperkt" in react-dropzone
      disabled: remaining <= 0,
      onDrop: (accepted) => {
        const added: Upload[] = accepted.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          status: "waiting",
        }));
        setUploads((list) => [...list, ...added]);
        void runLimited(added, PARALLEL_UPLOADS, uploadOne);
      },
    });

  const sensors = useSensors(
    // distance: een gewone klik (op "Verwijderen") start geen sleepbeweging
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const previous = photos;
    const next = arrayMove(
      photos,
      photos.findIndex((p) => p.id === active.id),
      photos.findIndex((p) => p.id === over.id),
    );
    setPhotos(next); // eerst op het scherm, dan naar de server
    setError(null);
    startTransition(async () => {
      const result = await reorderListingPhotos({
        listingId,
        photoIds: next.map((p) => p.id),
      });
      if (!result.ok) {
        setPhotos(previous);
        setError(result.message);
      }
    });
  }

  function handleDelete(photoId: string) {
    if (!window.confirm("Deze foto verwijderen?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteListingPhoto(photoId);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={[
          "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragActive ? "border-primary bg-muted" : "",
          remaining <= 0 ? "cursor-not-allowed opacity-50" : "",
        ].join(" ")}
      >
        <input {...getInputProps()} />
        <p className="font-medium">
          {isDragActive
            ? "Laat los om te uploaden"
            : "Sleep foto's hierheen of klik om te kiezen"}
        </p>
        <p className="text-sm text-muted-foreground">
          JPG, PNG of WebP tot 15 MB. Nog {Math.max(remaining, 0)} van{" "}
          {MAX_PHOTOS_PER_LISTING}.
        </p>
      </div>

      {fileRejections.length > 0 && (
        <ul role="alert" className="space-y-1 text-sm text-destructive">
          {fileRejections.map(({ file, errors }) => (
            <li key={`${file.name}-${file.lastModified}`}>
              {file.name}:{" "}
              {errors
                .map((e) => REJECTION_MESSAGES[e.code] ?? e.message)
                .join(" ")}
            </li>
          ))}
        </ul>
      )}

      {uploads.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {uploads.map((upload) => (
            <li key={upload.id} className="space-y-1">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- lokale blob-URL, next/image heeft hier geen zin */}
                <img
                  src={upload.previewUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-60"
                />
              </div>
              <p
                className={
                  upload.status === "failed"
                    ? "text-sm text-destructive"
                    : "text-sm"
                }
              >
                {upload.status === "waiting" && "Wachten…"}
                {upload.status === "busy" && "Bezig…"}
                {upload.status === "failed" && upload.error}
              </p>
              {upload.status === "failed" && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => retry(upload)}
                  >
                    Opnieuw
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeUpload(upload)}
                  >
                    Weglaten
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={photos.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((photo, index) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  index={index}
                  disabled={pending}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {photos.length > 1 && (
        <p className="text-sm text-muted-foreground">
          Sleep om de volgorde te wijzigen. De eerste foto is de cover.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
