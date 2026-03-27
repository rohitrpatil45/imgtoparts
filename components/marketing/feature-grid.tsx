import { Container } from "@/components/ui/container";
import {
  FrameArtwork,
  FramePreviewCard
} from "@/components/marketing/cnc-frame-showcase";

const generatedOutputs = [
  {
    title: "Full crop",
    description: "Clean hero-ready framing for your main listing thumbnail.",
    preset: "fullCrop" as const,
    className: "sm:col-span-2"
  },
  {
    title: "Top detail",
    description: "Pull the premium upper carving into a focused product shot.",
    preset: "topDetail" as const
  },
  {
    title: "Corner detail",
    description: "Show off the ornate baroque corner for visual storytelling.",
    preset: "cornerDetail" as const
  },
  {
    title: "Side carving",
    description: "Highlight the relief depth and edge craftsmanship instantly.",
    preset: "sideCarving" as const
  },
  {
    title: "Center zoom",
    description: "Auto-detect and magnify the highest-value center carving.",
    preset: "centerZoom" as const,
    className: "sm:col-span-2"
  }
];

export function FeatureGrid() {
  return (
    <Container className="mt-20 pb-6 sm:mt-24">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-premium backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-100">
                Source Image
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                One detailed golden CNC frame becomes a complete visual pack for
                listings, mockups, and approval flows.
              </p>
            </div>
            <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-100">
              Input
            </span>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-[#09101d]/90 p-4">
            <FrameArtwork className="aspect-square rounded-[1.5rem]" preset="full" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "Auto crop detects useful frame boundaries",
                "Smart zoom isolates the strongest center carving",
                "Consistent output sizes for marketplaces",
                "Ready for CNC, Etsy, and 3D presentation"
              ].map((line) => (
                <div
                  key={line}
                  className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-slate-200 backdrop-blur-xl">
            Output System
          </p>
          <h2 className="mt-4 max-w-3xl font-[var(--font-heading)] text-3xl font-semibold text-white sm:text-4xl lg:text-[2.8rem]">
            From 1 Image to 5 Production Outputs
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
            The tool transforms a single ornamental source into a full crop and
            four focused detail views that feel hand-directed, without the
            manual editing pass.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {generatedOutputs.map((output) => (
              <FramePreviewCard
                key={output.title}
                className={output.className}
                description={output.description}
                preset={output.preset}
                title={output.title}
              />
            ))}
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-gradient-to-r from-sky-500/10 via-white/[0.02] to-violet-500/10 p-5 backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
                  Batch-ready workflow
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Generate the same five-output pattern across an entire upload
                  set and keep every listing visually consistent.
                </p>
              </div>
              <div className="rounded-full border border-sky-300/20 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-sky-100">
                5 exports per source
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
