import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const NAV_LINKS = [
  { href: "/#hoe-werkt-het", label: "Hoe werkt het" },
  { href: "/#campus", label: "Campus zoeken" },
  { href: "/#kotbazen", label: "Voor kotbazen" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="bg-surface">
      <div className="container-page flex h-21 items-center justify-between">
        <Logo />

        <nav className="hidden gap-8 text-[15px] font-medium text-ink-muted lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{user.firstName}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline-ink" size="pill">
                Uitloggen
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button asChild variant="outline-ink" size="pill">
              <Link href="/login">Inloggen</Link>
            </Button>
            <Button asChild variant="ink" size="pill">
              <Link href="/registreren">Kot plaatsen</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
