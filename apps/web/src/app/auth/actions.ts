"use server";

import { redirect } from "next/navigation";
import { LoginSchema, RegisterSchema } from "@kotzoeker/shared";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginPath, homePathFor, safeNextPath } from "@/lib/auth";
import { saveOnboarding } from "@/server/dal/users";

type ActionError = { ok: false; message: string };

export async function loginWithPassword(
  input: unknown,
  next: string | null,
): Promise<ActionError | void> {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Vul je e-mailadres en wachtwoord in." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  // Zelfde melding voor een onbekend adres en een fout wachtwoord: verraadt niet wie een account heeft.
  if (error || !data.user)
    return { ok: false, message: "E-mailadres of wachtwoord klopt niet." };

  redirect(await getPostLoginPath(data.user.id, safeNextPath(next)));
}

export async function registerWithPassword(
  input: unknown,
): Promise<ActionError | void> {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Controleer de ingevulde gegevens." };
  const { email, password, role, firstName, lastName } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: `${firstName} ${lastName}` } },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return {
        ok: false,
        message: "Er bestaat al een account met dit e-mailadres. Log in.",
      };
    }
    if (error.code === "weak_password") {
      return { ok: false, message: "Kies een sterker wachtwoord." };
    }
    return {
      ok: false,
      message: "Registreren is niet gelukt. Probeer het opnieuw.",
    };
  }
  if (!data.user)
    return {
      ok: false,
      message: "Registreren is niet gelukt. Probeer het opnieuw.",
    };

  // Rol en naam meteen vastleggen: wie registreert, hoeft niet langs de onboarding.
  await saveOnboarding(data.user.id, { role, firstName, lastName });

  // Staat e-mailbevestiging aan (in de cloud), dan is er nog geen sessie.
  if (!data.session) redirect("/login?registered=1");
  redirect(homePathFor(role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
