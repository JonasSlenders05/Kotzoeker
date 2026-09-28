import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db, landlordProfiles, profiles, studentProfiles } from "@kotzoeker/db";
import type { CurrentUserDto } from "@kotzoeker/shared";

type ProfileRow = typeof profiles.$inferSelect;

export type ProfileSetup = {
  role: "student" | "landlord"; // nooit 'admin' via de app
  firstName: string;
  lastName: string;
  phone?: string | null;
};

function toCurrentUserDto(row: ProfileRow): CurrentUserDto {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    firstName: row.firstName,
    lastName: row.lastName,
  };
}

export async function findUserById(id: string): Promise<CurrentUserDto | null> {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, id));
  return row ? toCurrentUserDto(row) : null;
}

/** Zet rol en naam één keer en maakt het rolprofiel aan. false = er was al een rol. */
export async function saveOnboarding(
  userId: string,
  setup: ProfileSetup,
): Promise<boolean> {
  const { role, firstName, lastName, phone } = setup;

  return db.transaction(async (tx) => {
    // Enkel als er nog geen rol is: zo kan niemand later van rol wisselen.
    const updated = await tx
      .update(profiles)
      .set({ role, firstName, lastName, phone: phone || null })
      .where(and(eq(profiles.id, userId), isNull(profiles.role)))
      .returning({ id: profiles.id });

    if (updated.length === 0) return false;

    if (role === "landlord") {
      await tx
        .insert(landlordProfiles)
        .values({ profileId: userId })
        .onConflictDoNothing();
    } else {
      await tx
        .insert(studentProfiles)
        .values({ profileId: userId })
        .onConflictDoNothing();
    }
    return true;
  });
}
