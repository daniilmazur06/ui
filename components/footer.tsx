import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/", label: "Analyze" },
  { href: "/rankings", label: "Rankings" },
  { href: "/criteria", label: "Criteria" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground/70">
          Built at St. John{"'"}s Hacks
        </p>
      </div>
    </footer>
  );
}
