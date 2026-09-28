import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email("Vul een geldig e-mailadres in"),
  password: z.string().min(1, "Vul je wachtwoord in"),
});

// Zelfde regels als in config.toml: minstens 8 tekens, met een letter en een cijfer.
const password = z
  .string()
  .min(8, "Minstens 8 tekens")
  .max(72, "Maximaal 72 tekens")
  .regex(/[A-Za-z]/, "Minstens één letter")
  .regex(/[0-9]/, "Minstens één cijfer");

export const RegisterSchema = z
  .object({
    role: z.enum(["student", "landlord"], {
      message: "Kies of je student of kotbaas bent",
    }),
    firstName: z.string().trim().min(1, "Vul je voornaam in").max(50),
    lastName: z.string().trim().min(1, "Vul je achternaam in").max(80),
    email: z.email("Vul een geldig e-mailadres in"),
    password,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "De wachtwoorden zijn niet gelijk",
    path: ["passwordConfirm"],
  });

export const MagicLinkSchema = z.object({
  email: z.email("Vul een geldig e-mailadres in"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
