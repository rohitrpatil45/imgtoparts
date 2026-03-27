import Link from "next/link";
import { Container } from "@/components/ui/container";

const plans = [
  {
    name: "Starter",
    price: "$19",
    detail: "For solo CNC designers handling daily crop prep.",
    features: ["Unlimited uploads", "Single workspace", "ZIP exports"]
  },
  {
    name: "Studio",
    price: "$49",
    detail: "For production teams managing shared design review cycles.",
    features: ["Everything in Starter", "Team workspaces", "Priority support"],
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    detail: "For manufacturers who need deployment support and governance.",
    features: ["SSO ready", "Custom onboarding", "Private infrastructure"]
  }
];

export default function PricingPage() {
  return (
    <Container className="pb-16 pt-10 sm:pt-14">
      <div className="mx-auto max-w-3xl text-center">
        <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
          Pricing Placeholder
        </p>
        <h1 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl">
          SaaS-ready pricing UI, ready for billing integration later.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
          This page is intentionally presentation-only for now so the app stays
          deployment-ready without adding payment logic before you need it.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-[2rem] border p-6 shadow-premium backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${
              plan.featured
                ? "border-cyan-300/40 bg-cyan-400/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-[var(--font-heading)] text-2xl font-semibold text-white">
                {plan.name}
              </h2>
              {plan.featured ? (
                <span className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  Popular
                </span>
              ) : null}
            </div>
            <div className="mt-6 font-[var(--font-heading)] text-4xl font-semibold text-white">
              {plan.price}
              {plan.price !== "Custom" ? (
                <span className="ml-2 text-base font-medium text-slate-400">
                  / month
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {plan.detail}
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-200">
              {plan.features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
                >
                  {feature}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:border-cyan-300/30 hover:bg-cyan-400/10"
            >
              Coming Soon
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/tool"
          className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300"
        >
          Try the Tool
        </Link>
      </div>
    </Container>
  );
}

