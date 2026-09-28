import { requireRole } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireRole("landlord");
  return <h1 className="text-2xl font-semibold">Welkom, {user.firstName}</h1>;
}
