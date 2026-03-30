import Link from "next/link";
import { ArtworkViewport } from "@/components/marketing/cnc-visuals";
import { HeroPanel } from "@/components/marketing/hero-panel";
import { Container } from "@/components/ui/container";
import OutputPreview from "@/components/marketing/OutputPreview";

const problems = [
  {
    title: "Manual cropping is slow",
    description:
      "Design teams burn time framing the same image again and again just to assemble product-ready views."
  },
  {
    title: "Inconsistent product images",
    description:
      "Without a repeatable crop system, every listing and approval deck ends up with slightly different framing."
  },
  {
    title: "Poor marketplace quality",
    description:
      "Weak detail shots and uneven zoom levels make premium CNC work feel less polished than it should."
  }
];

const workflow = [
  {
    step: "01",
    title: "Upload image",
    description:
      "Drop in a CNC design source and queue it instantly for processing."
  },
  {
    step: "02",
    title: "AI processes image",
    description:
      "The system detects the composition and maps the strongest detail regions."
  },
  {
    step: "03",
    title: "Get 5 outputs",
    description:
      "Receive a full view, top detail, corner crop, side carving, and center zoom."
  }
];

const features = [
  {
    title: "Auto crop",
    description:
      "Create clean product compositions without manual drag-and-resize work."
  },
  {
    title: "Smart zoom",
    description:
      "Highlight carvings, edges, and center relief with controlled close-up framing."
  },
  {
    title: "Batch export",
    description:
      "Process multiple source images and deliver the full set of outputs together."
  },
  {
    title: "CNC ready output",
    description:
      "Keep every generated image aligned for approvals, mockups, and marketplace publishing."
  }
];

export default function LandingPage() {
  return (
    <div className="pb-20 sm:pb-24">
      <HeroPanel />
      <OutputPreview />

      <Container className="mt-20 sm:mt-24">
        <section className="space-y-8">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-200">
              The problem
            </div>
            <h2 className="mt-4 font-[var(--font-heading)] text-3xl font-semibold text-white sm:text-4xl">
              CNC teams lose momentum when image prep stays manual.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              The page is only convincing when the image set feels deliberate.
              These are the bottlenecks that slow that down.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {problems.map((problem, index) => (
              <div
                key={problem.title}
                className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-premium backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08]"
              >
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                  0{index + 1}
                </div>
                <h3 className="mt-5 font-[var(--font-heading)] text-2xl font-semibold text-white">
                  {problem.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {problem.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Container>

      {/* <Container className="mt-20 sm:mt-24">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-premium backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-blue-300/20 bg-blue-300/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-100">
                How it works
              </div>
              <h2 className="mt-4 font-[var(--font-heading)] text-3xl font-semibold text-white sm:text-4xl">
                A simple workflow that turns one source image into a full asset
                pack.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-300">
              The interaction stays light while the output feels considered,
              making it easier to move from upload to usable imagery.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {workflow.map((item) => (
              <div
                key={item.step}
                className="relative rounded-[28px] border border-white/10 bg-[#11172a]/70 p-6"
              >
                <div className="inline-flex rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-100">
                  Step {item.step}
                </div>
                <h3 className="mt-5 font-[var(--font-heading)] text-2xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {item.description}
                </p>
                <div
                  className="pointer-events-none absolute inset-x-6 bottom-6 h-px"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, rgba(96,165,250,0), rgba(96,165,250,0.55), rgba(168,85,247,0))"
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </Container> */}

      {/* <Container className="mt-20 sm:mt-24">
        <section id="showcase" className="space-y-8">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-200">
              Output showcase
            </div>
            <h2 className="mt-4 font-[var(--font-heading)] text-3xl font-semibold text-white sm:text-4xl">
              One CNC design, transformed into a premium multi-view image set.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Every card below uses the same source artwork, framed differently
              to surface the most useful product angles and detail regions.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.84fr_1.16fr]">
            <ArtworkViewport
              alt="Original CNC design source image"
              badge="Original image"
              title="Raw CNC source"
              description="The unprocessed source used to generate every output view in the set."
              viewportClassName="aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5]"
            />

            <div className="space-y-5">
              <ArtworkViewport
                alt="Full crop view of the CNC design"
                badge="Main crop"
                title="Full view"
                description="A balanced hero crop that keeps the primary panel and decorative structure intact."
                position="50% 52%"
                zoom={1.18}
                viewportClassName="aspect-[16/10]"
                meta={
                  <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-100">
                    Marketplace ready
                  </div>
                }
              />

              <div className="grid gap-5 lg:grid-cols-[0.76fr_0.52fr]">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                  <ArtworkViewport
                    alt="Top detail crop from the CNC design"
                    badge="Detail crop"
                    title="Top detail"
                    description="Focuses on the decorative top band and measurement geometry."
                    position="50% 18%"
                    zoom={1.92}
                    viewportClassName="aspect-[16/11]"
                  />
                  <ArtworkViewport
                    alt="Corner detail crop from the CNC design"
                    badge="Detail crop"
                    title="Corner detail"
                    description="Pulls the upper corner structure into a sharp supporting image."
                    position="84% 20%"
                    zoom={2.18}
                    viewportClassName="aspect-[16/11]"
                  />
                </div>

                <ArtworkViewport
                  alt="Side carving crop from the CNC design"
                  badge="Vertical crop"
                  title="Side carving"
                  description="Captures the carved side channel in a tall, premium detail format."
                  position="16% 54%"
                  zoom={1.86}
                  viewportClassName="h-full min-h-[24rem] aspect-[4/5]"
                />
              </div>

              <ArtworkViewport
                alt="Center zoom crop from the CNC design"
                badge="Signature detail"
                title="Center zoom"
                description="Pushes into the middle relief so the craftsmanship reads clearly even at smaller thumbnail sizes."
                position="50% 58%"
                zoom={2.2}
                viewportClassName="aspect-[16/8]"
              />
            </div>
          </div>
        </section>
      </Container> */}

      <Container className="mt-20 sm:mt-24">
        <section className="space-y-8">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-200">
              Features
            </div>
            <h2 className="mt-4 font-[var(--font-heading)] text-3xl font-semibold text-white sm:text-4xl">
              Built for teams that want speed without losing visual quality.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-premium backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08]"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, rgba(96,165,250,0.18), rgba(168,85,247,0.18))"
                  }}
                >
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-300 via-violet-300 to-indigo-300" />
                </div>
                <h3 className="mt-5 font-[var(--font-heading)] text-2xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Container>

      <Container className="mt-20 sm:mt-24">
        <section
          className="relative overflow-hidden rounded-[36px] border border-white/10 p-8 shadow-premium backdrop-blur-xl sm:p-10 lg:p-14"
          style={{
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(91,33,182,0.2) 48%, rgba(15,23,42,0.92) 100%)"
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at top left, rgba(125,211,252,0.16), transparent 28%), radial-gradient(circle at 80% 25%, rgba(192,132,252,0.18), transparent 34%)"
            }}
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-100">
                Final call to action
              </div>
              <h2 className="mt-4 font-[var(--font-heading)] text-3xl font-semibold text-white sm:text-5xl">
                Start generating images in seconds
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-200">
                Open the tool, upload your source image, and produce a clean
                five-view CNC image set without manual editing overhead.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tool"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-400 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(76,81,191,0.32)] transition duration-300 hover:-translate-y-0.5"
              >
                Start Free Preview
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition duration-300 hover:bg-white/15"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
