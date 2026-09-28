import { redirect } from "next/navigation";
import { homePathFor, requireUser } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.role) redirect(homePathFor(user.role));

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Welkom bij Kotzoeker</h1>
      <OnboardingForm
        defaultFirstName={user.firstName}
        defaultLastName={user.lastName}
      />
    </main>
  );
}
