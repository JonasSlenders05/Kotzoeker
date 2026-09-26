import "server-only";
import { type UserRole } from "@kotzoeker/db";
import { CurrentUserDto } from "@kotzoeker/shared";
import { cache } from "react";
import { createClient } from "./supabase/client";
import { findUserById } from "@/server/dal/user";
import { notFound, redirect } from "next/navigation";

export function homePathFor(role: UserRole | null) {
  if (!role) return "/onboarding";
  return role === "landlord" ? "/dashboard" : "/";
}

export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return null;
  return next;
}

export const getCurrentUser = cache(
  async (): Promise<CurrentUserDto | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (error || !userId) return null;

    return findUserById(userId);
  },
);

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();
  if (!user.role) redirect("/onboarding");
  if (user.role !== role) notFound();
  return user;
}

export async function getPostLoginPath(userId: string, next: string | null) {
  const user = await findUserById(userId);
  if (!user?.role) return "/onboarding";
  return next ?? homePathFor(user.role);
}
