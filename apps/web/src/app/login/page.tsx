import { redirect } from "next/navigation";
import { getCurrentUser, homePathFor, safeNextPath } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));

  return (
    <main className="mx-auto max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Inloggen bij Kotzoeker</h1>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Inloggen is mislukt of de link is verlopen. Probeer opnieuw.
        </p>
      )}
      <LoginForm next={safeNextPath(next)} />
    </main>
  );
}
