import Link from "next/link";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Tool", href: "/tool" },
        { label: "Pricing", href: "/pricing" },
        { label: "Documentation", href: "/docs" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookies" }
      ]
    }
  ];

  const socialLinks = [
    { label: "Twitter", href: "#", icon: "𝕏" },
    { label: "LinkedIn", href: "#", icon: "in" },
    { label: "GitHub", href: "#", icon: "gh" }
  ];

  return (
    <footer className="relative border-t border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 py-16">
      <Container>
        <div className="grid gap-8 md:grid-cols-5 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">
                CNC Image Auto Crop
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Premium image automation tool built for SaaS workflows. Streamline your product photography with AI-powered precision.
              </p>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-4 pt-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:border-blue-500/30 hover:bg-blue-500/10 transition duration-300"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-blue-300 transition duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>© {currentYear} CNC Image Auto Crop.</span>
            <span className="hidden sm:inline">All rights reserved.</span>
          </div>
          
          <div className="flex gap-6">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:border-blue-500/50 hover:bg-blue-500/20 transition duration-300 text-xs font-medium"
            >
              <span>🔐</span>
              Auth Ready
            </Link>
            <Link
              href="/status"
              className="text-slate-400 hover:text-blue-300 transition duration-300"
            >
              Status
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

