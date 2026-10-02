import { BadRequestException, ParseUUIDPipe } from "@nestjs/common";

export const ParseIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new BadRequestException("Ongeldig id."),
});
