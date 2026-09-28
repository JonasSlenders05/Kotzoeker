import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homePathFor } from "@/lib/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Account aanmaken</h1>

      <RegisterForm />

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> of{" "}
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton next={null} />

      <p className="text-sm">
        Heb je al een account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
