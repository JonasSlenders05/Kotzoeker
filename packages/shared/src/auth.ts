import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email("Vul een geldig e-mailadres in"),
  password: z
    .string({ error: "Vul je wachtwoord in" })
    .min(1, "Vul je wachtwoord in")
    .max(128),
});

// Minstens 8 tekens, met een letter en een cijfer. De API controleert dezelfde regels.
const password = z
  .string({ error: "Kies een wachtwoord" })
  .min(8, "Minstens 8 tekens")
  .max(128, "Maximaal 128 tekens")
  .regex(/[A-Za-z]/, "Minstens één letter")
  .regex(/[0-9]/, "Minstens één cijfer");

/** Wat de API ontvangt bij registratie (POST /api/users). */
export const RegisterSchema = z.object({
  // Bewust zonder 'admin': die rol kan je nooit zelf kiezen.
  role: z.enum(["student", "landlord"], {
    message: "Kies of je student of kotbaas bent",
  }),
  firstName: z
    .string({ error: "Vul je voornaam in" })
    .trim()
    .min(1, "Vul je voornaam in")
    .max(50),
  lastName: z
    .string({ error: "Vul je achternaam in" })
    .trim()
    .min(1, "Vul je achternaam in")
    .max(80),
  email: z.email("Vul een geldig e-mailadres in"),
  password,
});

/** Het registratieformulier: hetzelfde, plus een tweede keer het wachtwoord. */
export const RegisterFormSchema = RegisterSchema.extend({
  passwordConfirm: z.string({ error: "Herhaal je wachtwoord" }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "De wachtwoorden zijn niet gelijk",
  path: ["passwordConfirm"],
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type RegisterFormInput = z.infer<typeof RegisterFormSchema>;
