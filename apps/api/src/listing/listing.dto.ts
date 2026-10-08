import { createZodDto } from "nestjs-zod";
import { ListingDraft } from "@kotzoeker/shared";

export class ListingDraftRequestDto extends createZodDto(ListingDraft) {}
