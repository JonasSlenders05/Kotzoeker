import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homePathFor, safeNextPath } from "@/lib/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { MagicLinkForm } from "./magic-link-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; registered?: string }>;
}) {
  const { next, error, registered } = await searchParams;

  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));

  const safeNext = safeNextPath(next);

  return (
    <main className="mx-auto max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Inloggen</h1>

      {registered && (
        <p className="text-sm">
          Je account is aangemaakt. Bevestig je e-mailadres via de mail en log
          dan in.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Inloggen is mislukt of de link is verlopen. Probeer het opnieuw.
        </p>
      )}

      <Tabs defaultValue="password">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">Wachtwoord</TabsTrigger>
          <TabsTrigger value="link">Link per e-mail</TabsTrigger>
        </TabsList>
        <TabsContent value="password" className="pt-4">
          <LoginForm next={safeNext} />
        </TabsContent>
        <TabsContent value="link" className="pt-4">
          <MagicLinkForm next={safeNext} />
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> of{" "}
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton next={safeNext} />

      <p className="text-sm">
        Nog geen account?{" "}
        <Link href="/registreren" className="underline">
          Registreer
        </Link>
      </p>
    </main>
  );
}
