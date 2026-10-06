import type { UserRole } from "@kotzoeker/shared";

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type Session = {
  id: string;
  email: string;
  role: UserRole;
};
