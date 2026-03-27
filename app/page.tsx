import Link from "next/link";
import { Container } from "@/components/ui/container";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HeroPanel } from "@/components/marketing/hero-panel";
import { PricingPreview } from "@/components/marketing/pricing-preview";

export default function LandingPage() {
  return (
    <div className="pb-16">
      <HeroPanel />

      <Container className="mt-16 sm:mt-20">
        <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-premium backdrop-blur-xl sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
              Built for CNC production teams
            </p>
            <h2 className="font-[var(--font-heading)] text-3xl font-semibold text-white sm:text-4xl">
              Faster prep for mockups, catalogs, and client approvals.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Generate consistent quadrant crops and a center-detail view in one
              pass. The app is designed for CNC designers who need clean image
              breakdowns without manual editing overhead.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { value: "5", label: "Exports per source image" },
              { value: "Sharp", label: "Server-side processing engine" },
              { value: "ZIP", label: "Bulk delivery for production teams" }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-white/10 bg-slate-950/40 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10"
              >
                <div className="font-[var(--font-heading)] text-3xl font-semibold text-white">
                  {item.value}
                </div>
                <div className="mt-2 text-sm text-slate-300">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <FeatureGrid />
      <PricingPreview />

      <Container className="mt-16">
        <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-white/10 bg-gradient-to-r from-cyan-500/10 via-slate-900/80 to-blue-500/10 p-6 shadow-premium backdrop-blur-xl sm:flex-row sm:items-center sm:p-8">
          <div>
            <h3 className="font-[var(--font-heading)] text-2xl font-semibold text-white">
              Ready to launch your cropping pipeline?
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Open the tool, upload your references, and export a production
              pack in seconds.
            </p>
          </div>
          <Link
            href="/tool"
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300"
          >
            Open the Tool
          </Link>
        </div>
      </Container>
    </div>
  );
}

