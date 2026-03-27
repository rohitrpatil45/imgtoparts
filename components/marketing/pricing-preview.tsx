import Link from "next/link";
import { Container } from "@/components/ui/container";

export function PricingPreview() {
  return (
    <Container className="mt-16 sm:mt-20">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-premium backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-200">
              Monetization Ready
            </p>
            <h2 className="mt-4 font-[var(--font-heading)] text-3xl font-semibold text-white">
              Pricing page included so the SaaS shell is ready for the next step.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              The billing layer is intentionally deferred, but the product
              narrative, plan layout, and CTA flow are already in place.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            Open Pricing Page
          </Link>
        </div>
      </div>
    </Container>
  );
}

