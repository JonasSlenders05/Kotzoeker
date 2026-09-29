// apps/web/src/app/koten/[slug]/photo-gallery.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import type { PublicListingDto } from "@kotzoeker/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Props = { photos: PublicListingDto["photos"]; title: string };

export function PhotoGallery({ photos, title }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const cover = photos[0];
  if (!cover) return <div className="aspect-[16/9] rounded-lg bg-muted" />;

  const current = openIndex === null ? null : photos[openIndex];
  const step = (delta: number) =>
    setOpenIndex((i) =>
      i === null ? null : (i + delta + photos.length) % photos.length,
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenIndex(0)}
        className="relative block aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted"
      >
        <Image
          src={cover.url}
          alt={cover.altText ?? title}
          fill
          priority
          sizes="(min-width: 896px) 896px, 100vw"
          className="object-cover"
        />
      </button>

      {photos.length > 1 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.slice(1).map((photo, i) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => setOpenIndex(i + 1)}
              className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted"
            >
              <Image
                src={photo.thumbUrl}
                alt={photo.altText ?? `${title}, foto ${i + 2}`}
                fill
                sizes="20vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={openIndex !== null}
        onOpenChange={(open) => !open && setOpenIndex(null)}
      >
        <DialogContent
          className="p-2 sm:max-w-5xl sm:p-4"
          aria-describedby={undefined} // geen beschrijving nodig; de titel volstaat
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
          }}
        >
          <DialogTitle className="sr-only">
            {title}, foto {(openIndex ?? 0) + 1} van {photos.length}
          </DialogTitle>
          {current && (
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={current.url}
                alt={current.altText ?? title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          )}
          {photos.length > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => step(-1)}>
                Vorige
              </Button>
              <span className="text-sm text-muted-foreground">
                {(openIndex ?? 0) + 1} / {photos.length}
              </span>
              <Button variant="ghost" onClick={() => step(1)}>
                Volgende
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
