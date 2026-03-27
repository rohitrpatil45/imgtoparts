import Link from "next/link";
import { Container } from "@/components/ui/container";

const highlights = [
  "Drag-and-drop multi-image upload",
  "Server-side Sharp processing",
  "One-click ZIP exports"
];

export function HeroPanel() {
  return (
    <Container className="pt-10 sm:pt-14">
      <div className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
            Production-ready SaaS
          </p>
          <div className="space-y-4">
            <h1 className="max-w-4xl font-[var(--font-heading)] text-5xl font-semibold leading-tight text-white sm:text-6xl">
              Crop CNC reference imagery into clean production-ready views.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              CNC Image Auto Crop Tool turns raw images into quadrant crops and
              center-detail shots with a premium dashboard built for fast design
              review and export.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tool"
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              Launch the Tool
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:border-cyan-300/30 hover:bg-white/10"
            >
              View Pricing UI
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 shadow-premium backdrop-blur-xl"
              >
                {highlight}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-premium backdrop-blur-xl">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Export Overview
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Preview the production pack before delivery
                </p>
              </div>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">
                Online
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Original preview",
                "Top-left crop",
                "Top-right crop",
                "Bottom-left crop",
                "Bottom-right crop",
                "Center detail"
              ].map((item, index) => (
                <div
                  key={item}
                  className={`rounded-3xl border border-white/10 p-4 ${
                    index === 0
                      ? "bg-gradient-to-br from-cyan-400/20 to-blue-500/10 sm:col-span-2"
                      : "bg-white/5"
                  }`}
                >
                  <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-slate-900/80" />
                  <p className="mt-3 text-sm text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

