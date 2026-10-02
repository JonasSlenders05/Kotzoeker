export type UserRole = "student" | "landlord" | "admin";

export type CurrentUserDto = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
};

export type TokenDto = { token: string };
