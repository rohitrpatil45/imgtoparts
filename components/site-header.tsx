import Link from "next/link";
import { Container } from "@/components/ui/container";

const links = [
  { href: "/", label: "Home" },
  { href: "/tool", label: "Tool" },
  { href: "/pricing", label: "Pricing" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-100">
            <span className="font-[var(--font-heading)] text-lg font-semibold">
              CNC
            </span>
          </div>
          <div>
            <div className="font-[var(--font-heading)] text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
              CNC Image Auto Crop Tool
            </div>
            <div className="text-xs text-slate-400">
              Production-ready image prep for designers
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition duration-300 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition duration-300 hover:border-cyan-300/30 hover:bg-white/10 sm:inline-flex"
          >
            Sign In
          </Link>
          <Link
            href="/tool"
            className="inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300"
          >
            Launch App
          </Link>
        </div>
      </Container>
    </header>
  );
}

