import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { eq } from "drizzle-orm";
import { landlordProfiles, studentProfiles, users } from "@kotzoeker/db";
import type { LoginInput, RegisterInput } from "@kotzoeker/shared";
import type { Env } from "../config/env";
import {
    InjectDrizzle,
    type DatabaseProvider,
} from "../drizzle/drizzle.provider";
import type { JwtPayload } from "./auth.types";

const INVALID_CREDENTIALS = "E-mailadres of wachtwoord klopt niet.";

@Injectable()
export class AuthService {
  private dummyHash: Promise<string> | null = null;

  constructor(
    @InjectDrizzle() private readonly db: DatabaseProvider,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      timeCost: this.config.get("AUTH_HASH_TIME_COST", { infer: true }),
      memoryCost: this.config.get("AUTH_HASH_MEMORY_COST", { infer: true }),
    });
  }

  verifyToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }

  private signToken(user: {
    id: string;
    email: string;
    role: JwtPayload["role"];
  }): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async login({ email, password }: LoginInput): Promise<string> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (!user) {
      this.dummyHash ??= this.hashPassword(crypto.randomUUID());
      await argon2.verify(await this.dummyHash, password);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (!(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return this.signToken(user);
  }

  async register(input: RegisterInput): Promise<string> {
    const passwordHash = await this.hashPassword(input.password);

    const user = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          role: input.role,
          email: input.email.toLowerCase(),
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
        })
        .returning({ id: users.id, email: users.email, role: users.role });

      if (input.role === "landlord") {
        await tx.insert(landlordProfiles).values({ userId: created!.id });
      } else {
        await tx.insert(studentProfiles).values({ userId: created!.id });
      }
      return created!;
    });

    return this.signToken(user);
  }
}
