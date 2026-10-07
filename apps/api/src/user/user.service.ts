import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { users } from "@kotzoeker/db";
import type { CurrentUserDto } from "@kotzoeker/shared";
import {
    InjectDrizzle,
    type DatabaseProvider,
} from "../drizzle/drizzle.provider";

@Injectable()
export class UserService {
  constructor(@InjectDrizzle() private readonly db: DatabaseProvider) {}

  async getById(id: string): Promise<CurrentUserDto> {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!user) throw new NotFoundException("Deze gebruiker bestaat niet.");
    return user;
  }
}
