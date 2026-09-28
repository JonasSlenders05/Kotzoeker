import "server-only"; // de build faalt als dit bestand ooit in browsercode belandt
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { CurrentUserDto, UserRole } from "@kotzoeker/shared";
import { createClient } from "@/lib/supabase/server";
import { findUserById } from "@/server/dal/users";

/** Waar iemand na het inloggen thuishoort. */
export function homePathFor(role: UserRole | null) {
  if (!role) return "/onboarding";
  return role === "landlord" ? "/dashboard" : "/";
}

/** Enkel interne paden toelaten, anders heb je een open redirect. */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return null;
  return next;
}

/** De ingelogde gebruiker, of null. Hoogstens één keer per request opgehaald. */
export const getCurrentUser = cache(
  async (): Promise<CurrentUserDto | null> => {
    const supabase = await createClient();
    // getClaims() controleert de handtekening van het token. Gebruik hier nooit getSession().
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (error || !userId) return null;

    // null als er geen profiel is (account van vóór de trigger): behandel als niet ingelogd.
    return findUserById(userId);
  },
);

/** Voor pagina's en acties waarvoor je enkel ingelogd moet zijn. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Voor alles wat een bepaalde rol vereist. */
export async function requireRole(role: UserRole) {
  const user = await requireUser();
  if (!user.role) redirect("/onboarding");
  if (user.role !== role) notFound(); // verraadt niet dat de pagina bestaat
  return user;
}

/** Na een geslaagde login: onboarding, de gevraagde pagina, of de startpagina van de rol. */
export async function getPostLoginPath(userId: string, next: string | null) {
  const user = await findUserById(userId);
  if (!user?.role) return "/onboarding";
  return next ?? homePathFor(user.role);
}
