import { Container } from "@/components/ui/container";

const features = [
  {
    title: "Server-side image pipeline",
    description:
      "Sharp handles extraction and resize work in the API route, which keeps outputs consistent and Vercel-ready."
  },
  {
    title: "Multi-upload ready",
    description:
      "Drop in a batch of reference images and process them together without leaving the dashboard."
  },
  {
    title: "Clear export system",
    description:
      "Every crop is labeled, individually downloadable, and bundled into a single ZIP for handoff."
  },
  {
    title: "SaaS-ready structure",
    description:
      "App Router pages, reusable components, and an auth-ready route map give you a clean base to extend."
  }
];

export function FeatureGrid() {
  return (
    <Container className="mt-16 sm:mt-20">
      <div className="mb-8 max-w-2xl">
        <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-200">
          Feature Set
        </p>
        <h2 className="mt-4 font-[var(--font-heading)] text-3xl font-semibold text-white sm:text-4xl">
          Everything needed for a polished first launch.
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-premium backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10"
          >
            <h3 className="font-[var(--font-heading)] text-2xl font-semibold text-white">
              {feature.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </Container>
  );
}

