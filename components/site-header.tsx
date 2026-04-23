import Link from "next/link";
import { Container } from "@/components/ui/container";

const links = [
  { href: "/", label: "Home" },
  { href: "/tool", label: "Tool" },
  { href: "/tool/3d-render", label: "3D Render" },
  { href: "/pricing", label: "Pricing" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0f1a]/75 backdrop-blur-xl">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-blue-50 shadow-[0_18px_45px_rgba(76,81,191,0.25)]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(139,92,246,0.2))"
            }}
          >
            <span className="font-[var(--font-heading)] text-base font-semibold tracking-[0.16em]">
              CNC
            </span>
          </div>
          <div>
            <div className="font-[var(--font-heading)] text-sm font-semibold uppercase tracking-[0.2em] text-blue-50">
              CNC Image Auto Crop Tool
            </div>
            <div className="text-xs text-slate-400">
              Smart crops for premium CNC visuals
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
            href="/login"
            className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition duration-300 hover:border-white/20 hover:bg-white/10 sm:inline-flex"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="hidden rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-50 transition duration-300 hover:border-cyan-300/30 hover:bg-cyan-300/15 lg:inline-flex"
          >
            Sign Up
          </Link>
          <Link
            href="/tool"
            className="inline-flex rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-400 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5"
          >
            Open App
          </Link>
        </div>
      </Container>
    </header>
  );
}

