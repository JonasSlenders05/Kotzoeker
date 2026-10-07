import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { AmenityOptionDto, ListDto } from "@kotzoeker/shared";
import { Public } from "../auth/decorators/public.decorator";
import { AmenityService } from "./amenity.service";

@ApiTags("Amenities")
@Controller("amenities")
export class AmenityController {
  constructor(private readonly amenityService: AmenityService) {}

  @Get()
  @Public()
  async getAll(): Promise<ListDto<AmenityOptionDto>> {
    return { items: await this.amenityService.getAll() };
  }
}
