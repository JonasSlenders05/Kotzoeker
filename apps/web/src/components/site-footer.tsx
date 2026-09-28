import Link from "next/link";
import { Logo } from "@/components/logo";

const LINKS = [
  { href: "/over-ons", label: "Over ons" },
  { href: "/#kotbazen", label: "Voor kotbazen" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="container-page flex items-center justify-between pt-16 pb-12 text-sm text-ink-muted">
      <Logo className="text-xl" />
      <nav className="flex gap-6">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-ink">
            {l.label}
          </Link>
        ))}
      </nav>
      <span>© {new Date().getFullYear()} Kotzoeker</span>
    </footer>
  );
}
