import Link from "next/link";
import { Container } from "@/components/ui/container";
import { FrameArtwork } from "@/components/marketing/cnc-frame-showcase";

const workflowHighlights = [
  "AI-guided multi-crop workflow",
  "Marketplace-ready export presets",
  "Glass dashboard built for quick review"
];

export function HeroPanel() {
  return (
    <Container className="relative pt-12 sm:pt-16 lg:pt-20">
      <div className="absolute left-8 top-10 -z-10 h-56 w-56 rounded-full bg-sky-500/20 blur-[110px]" />
      <div className="absolute right-0 top-24 -z-10 h-72 w-72 rounded-full bg-violet-500/20 blur-[130px]" />

      <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-8">
          <p className="inline-flex rounded-full border border-sky-400/20 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-sky-100 shadow-[0_0_30px_rgba(56,189,248,0.15)] backdrop-blur-xl">
            Production-ready SaaS
          </p>

          <div className="space-y-5">
            <h1 className="max-w-4xl font-[var(--font-heading)] text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Turn 1 Image into 5{" "}
              <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Professional Shots
              </span>{" "}
              in Seconds
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Auto crop, smart zoom, and generate marketplace-ready images for
              CNC, Etsy, and 3D creators.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/tool"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_60px_rgba(59,130,246,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_80px_rgba(139,92,246,0.35)]"
            >
              Get Started Free
            </Link>
            <Link
              href="/tool"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-slate-100 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-white/[0.06]"
            >
              View Demo
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {workflowHighlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-slate-200 shadow-premium backdrop-blur-xl transition duration-300 hover:border-sky-300/20 hover:bg-white/[0.07]"
              >
                {highlight}
              </div>
            ))}
          </div>

          <div className="grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
            {[
              { value: "5x", label: "delivery-ready crops" },
              { value: "<10s", label: "from upload to export" },
              { value: "1 click", label: "detail zoom generation" }
            ].map((item) => (
              <div key={item.label}>
                <div className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text font-[var(--font-heading)] text-3xl font-semibold text-transparent">
                  {item.value}
                </div>
                <div className="mt-1 text-sm text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-[2rem] border border-white/12 bg-white/[0.055] p-4 shadow-premium backdrop-blur-2xl sm:p-5">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute left-10 top-10 h-28 w-28 rounded-full bg-sky-500/20 blur-[90px]" />
          <div className="absolute bottom-10 right-10 h-32 w-32 rounded-full bg-violet-500/20 blur-[100px]" />

          <div className="relative rounded-[1.75rem] border border-white/10 bg-[#090f1d]/90 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">
                  Export Overview
                </p>
                <p className="mt-2 max-w-sm text-sm text-slate-400">
                  Preview the production pack before delivery with quadrant
                  crops, edge details, and a center zoom.
                </p>
              </div>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.18)]">
                ONLINE
              </span>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3">
              <FrameArtwork className="aspect-[16/10]" preset="full" />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-medium text-white">Original Image</p>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  4096 x 4096
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: "Top-left crop", preset: "topLeft" as const },
                { label: "Top-right crop", preset: "topRight" as const },
                { label: "Bottom-left crop", preset: "bottomLeft" as const },
                { label: "Bottom-right crop", preset: "bottomRight" as const }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-2 transition duration-300 hover:border-sky-300/20 hover:bg-white/[0.07]"
                >
                  <FrameArtwork
                    className="aspect-square rounded-[1rem]"
                    preset={item.preset}
                  />
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center rounded-[1.2rem] border border-sky-300/20 bg-gradient-to-r from-sky-500/15 via-blue-500/15 to-violet-500/15 px-4 py-3 text-sm font-semibold text-sky-100 transition duration-300 hover:-translate-y-0.5 hover:border-sky-300/40 hover:from-sky-500/20 hover:to-violet-500/20"
            >
              Detail Zoom
            </button>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3">
              <FrameArtwork className="aspect-[16/9]" preset="centerZoom" />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-medium text-white">
                  Center carving close-up
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Smart zoom
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
