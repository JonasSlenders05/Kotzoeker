import { z } from "zod";

export const OnboardingSchema = z.object({
  // Bewust zonder 'admin': die rol kan je nooit zelf kiezen.
  role: z.enum(["student", "landlord"], {
    message: "Kies of je student of kotbaas bent",
  }),
  firstName: z.string().trim().min(1, "Vul je voornaam in").max(50),
  lastName: z.string().trim().min(1, "Vul je achternaam in").max(80),
  phone: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(/^\+?[0-9 ./-]{9,20}$/, "Dit is geen geldig telefoonnummer"),
  ]),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;
