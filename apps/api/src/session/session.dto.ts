import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { LoginSchema } from "@kotzoeker/shared";

export class LoginRequestDto extends createZodDto(LoginSchema) {}
export class TokenResponseDto extends createZodDto(
  z.object({ token: z.string() }),
) {}
