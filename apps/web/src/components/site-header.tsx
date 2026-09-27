import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <Link href="/" className="font-semibold">
        Kotzoeker
      </Link>

      {user ? (
        <div className="flex items-center gap-3">
          <span className="text-sm">{user.firstName}</span>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Uitloggen
            </Button>
          </form>
        </div>
      ) : (
        <Button asChild size="sm">
          <Link href="/login">Inloggen</Link>
        </Button>
      )}
    </header>
  );
}
