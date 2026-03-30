import { Container } from "@/components/ui/container";

const features = [
  {
    title: "Server-side image pipeline",
    description:
      "Sharp handles extraction and resize work in the API route, which keeps outputs consistent and Vercel-ready.",
    icon: "⚙️",
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Multi-upload ready",
    description:
      "Drop in a batch of reference images and process them together without leaving the dashboard.",
    icon: "📤",
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Clear export system",
    description:
      "Every crop is labeled, individually downloadable, and bundled into a single ZIP for handoff.",
    icon: "📦",
    color: "from-emerald-500 to-teal-500"
  },
  {
    title: "SaaS-ready structure",
    description:
      "App Router pages, reusable components, and an auth-ready route map give you a clean base to extend.",
    icon: "🏗️",
    color: "from-orange-500 to-red-500"
  }
];

export function FeatureGrid() {
  return (
    <div className="relative py-24 sm:py-32 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <Container className="relative z-10">
        {/* Header Section */}
        <div className="mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 backdrop-blur-sm mb-6">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-300">
              Feature Set
            </span>
          </div>
          <h2 className="font-[var(--font-heading)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Everything needed for a <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">polished first launch</span>
          </h2>
          <p className="mt-6 text-lg text-slate-300 leading-relaxed">
            Powerful features built to streamline your workflow and deliver professional results every time.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient blur background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-3xl opacity-0 group-hover:opacity-20 transition duration-500 blur-2xl -z-10`}></div>

              {/* Card */}
              <div className="relative h-full rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 sm:p-10 transition duration-300 hover:border-white/30 hover:bg-white/[0.08] hover:shadow-2xl hover:-translate-y-2">
                
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 mb-6 group-hover:scale-110 transition duration-300`}>
                  <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-2xl">
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition">
                  {feature.title}
                </h3>

                <p className="text-slate-400 text-base leading-relaxed group-hover:text-slate-300 transition">
                  {feature.description}
                </p>

                {/* Accent line */}
                <div className="mt-6 h-1 w-12 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-20 transition-all duration-300"></div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

