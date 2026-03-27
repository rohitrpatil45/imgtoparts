import Link from "next/link";
import { Container } from "@/components/ui/container";

const links = [
  { href: "/", label: "Home" },
  { href: "/tool", label: "Tool" },
  { href: "/pricing", label: "Pricing" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0f1a]/70 backdrop-blur-2xl">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-gradient-to-br from-sky-400/15 to-violet-500/15 text-sky-50 shadow-[0_0_28px_rgba(59,130,246,0.15)]">
            <span className="font-[var(--font-heading)] text-lg font-semibold">
              CNC
            </span>
          </div>
          <div>
            <div className="font-[var(--font-heading)] text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">
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
              className="transition duration-300 hover:text-sky-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition duration-300 hover:border-sky-300/25 hover:bg-white/[0.08] sm:inline-flex"
          >
            Sign In
          </Link>
          <Link
            href="/tool"
            className="inline-flex rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(59,130,246,0.25)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(139,92,246,0.3)]"
          >
            Launch App
          </Link>
        </div>
      </Container>
    </header>
  );
}
