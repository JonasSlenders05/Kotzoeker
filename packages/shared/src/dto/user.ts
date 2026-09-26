export type UserRole = "student" | "landlord" | "admin";

export type CurrentUserDto = {
  id: string;
  email: string;
  role: UserRole | null; // null = onboarding nog niet gedaan
  firstName: string;
  lastName: string;
};
