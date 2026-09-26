import "server-only";
import { eq } from "drizzle-orm";
import { db, profiles } from "@kotzoeker/db";
import type { CurrentUserDto } from "@kotzoeker/shared";

type ProfileRow = typeof profiles.$inferSelect;

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
