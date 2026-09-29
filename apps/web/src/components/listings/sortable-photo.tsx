// apps/web/src/components/listings/sortable-photo.tsx
"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ListingPhotoDto } from "@kotzoeker/shared";
import { thumbUrl } from "@/lib/photo-urls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  photo: ListingPhotoDto;
  index: number;
  disabled: boolean;
  onDelete: (photoId: string) => void;
};

export function SortablePhoto({ photo, index, disabled, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: photo.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        isDragging ? "relative z-10 space-y-1 opacity-80" : "space-y-1"
      }
    >
      {/* touch-none: anders scrollt de pagina op een gsm in plaats van te slepen. */}
      <div
        {...attributes}
        {...listeners}
        className="relative aspect-[4/3] cursor-grab touch-none overflow-hidden rounded-md bg-muted"
      >
        <Image
          src={thumbUrl(photo.storagePath)}
          alt={`Foto ${index + 1}`}
          fill
          sizes="(min-width: 640px) 25vw, 50vw"
          className="object-cover"
        />
        {index === 0 && <Badge className="absolute left-2 top-2">Cover</Badge>}
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => onDelete(photo.id)}
      >
        Verwijderen
      </Button>
    </li>
  );
}
