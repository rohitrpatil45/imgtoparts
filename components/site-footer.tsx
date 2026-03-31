import Link from "next/link";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  const productLinks = [
    { href: "/tool", label: "Tool" },
    { href: "/pricing", label: "Pricing" },
  ];

  const companyLinks = [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const legalLinks = [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ];

  const linkClassName =
    "group inline-flex w-fit items-center text-slate-400 transition duration-200 hover:text-white";

  return (
    <footer className="border-t border-white/10">
      <Container className="py-12">
        <div className="grid gap-10 text-sm sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex text-base font-semibold tracking-tight text-white transition hover:opacity-80"
            >
              CNC Image Auto Crop Tool
            </Link>
            <p className="mt-4 leading-6 text-slate-400">
              Precision image workflows for modern CNC teams, designed to feel
              fast, polished, and effortless from upload to output.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white">Product</h3>
            <nav className="mt-4 flex flex-col gap-3">
              {productLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClassName}>
                  <span className="border-b border-transparent pb-0.5 transition duration-200 group-hover:border-white/30">
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white">Company</h3>
            <nav className="mt-4 flex flex-col gap-3">
              {companyLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClassName}>
                  <span className="border-b border-transparent pb-0.5 transition duration-200 group-hover:border-white/30">
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white">Legal</h3>
            <nav className="mt-4 flex flex-col gap-3">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClassName}>
                  <span className="border-b border-transparent pb-0.5 transition duration-200 group-hover:border-white/30">
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 CNC Image Auto Crop Tool. All rights reserved.</p>
          <p>Built for premium SaaS image workflows.</p>
        </div>
      </Container>
    </footer>
  );
}

