import { BadRequestException } from "@nestjs/common";
import { createZodValidationPipe } from "nestjs-zod";
import { z } from "zod";

export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error) =>
    new BadRequestException({
      message: "Ongeldige invoer.",
      details: { body: z.flattenError(error as z.ZodError).fieldErrors },
    }),
});
