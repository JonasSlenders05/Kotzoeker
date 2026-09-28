"use server";

import { redirect } from "next/navigation";
import { OnboardingSchema } from "@kotzoeker/shared";
import { homePathFor, requireUser } from "@/lib/auth";
import { saveOnboarding } from "@/server/dal/users";

export async function completeOnboarding(input: unknown) {
  const user = await requireUser(); // het id komt altijd hiervandaan, nooit uit de input

  const parsed = OnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "Controleer de ingevulde gegevens." };
  }

  const saved = await saveOnboarding(user.id, parsed.data);
  if (!saved) {
    return { ok: false as const, message: "Je hebt al een rol gekozen." };
  }

  redirect(homePathFor(parsed.data.role));
}
