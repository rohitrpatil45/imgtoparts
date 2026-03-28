import Link from "next/link";
import { HeroWorkbench } from "@/components/marketing/cnc-visuals";
import { Container } from "@/components/ui/container";

const heroStats = [
  { value: "5", label: "ready-to-export crops" },
  { value: "<10s", label: "from upload to review" },
  { value: "1 click", label: "batch delivery to your team" }
];

export function HeroPanel() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.25),transparent_60%)]" />

      <Container>
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">

          {/* badge */}
          <div className="mb-6 inline-flex rounded-full border border-blue-300/20 bg-blue-300/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-100">
            AI image prep for CNC teams
          </div>

          {/* heading */}
          <h1 className="font-[var(--font-heading)] text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Turn 1 Image into{" "}
            <span className="gradient-text font-bold">
              5 Professional Shots
            </span>{" "}
            in Seconds
          </h1>

          {/* subtext */}
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Auto crop, smart zoom, and generate marketplace-ready images for CNC,
            Etsy, and 3D creators. Save hours on manual editing.
          </p>

          {/* buttons */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/tool"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-400 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(76,81,191,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_60px_rgba(76,81,191,0.45)]"
            >
              Get Started Free →
            </Link>

            <Link
              href="#showcase"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-100 backdrop-blur transition duration-300 hover:border-white/20 hover:bg-white/10"
            >
              View Demo
            </Link>
          </div>

          {/* stats */}
          <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
            {heroStats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
              >
                <div className="text-2xl font-semibold text-white">
                  {item.value}
                </div>
                <div className="mt-1 text-sm text-slate-300">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
