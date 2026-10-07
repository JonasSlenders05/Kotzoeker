import { createZodDto } from "nestjs-zod";
import { RegisterSchema } from "@kotzoeker/shared";

export class RegisterUserRequestDto extends createZodDto(RegisterSchema) {}
