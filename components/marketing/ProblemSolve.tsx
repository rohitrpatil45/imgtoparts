import React from 'react'
import { Container } from "@/components/ui/container";

const problems = [
  {
    title: "Manual cropping is slow",
    description:
      "Design teams burn time framing the same image again and again just to assemble product-ready views.",
    icon: "⏱️"
  },
  {
    title: "Inconsistent product images",
    description:
      "Without a repeatable crop system, every listing and approval deck ends up with slightly different framing.",
    icon: "🎯"
  },
  {
    title: "Poor marketplace quality",
    description:
      "Weak detail shots and uneven zoom levels make premium CNC work feel less polished than it should.",
    icon: "✨"
  }
];

function ProblemSolve() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 sm:py-32">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <Container className="relative z-10">
        <section className="space-y-16">
          {/* Header Section */}
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 backdrop-blur-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-300">
                The Challenge
              </span>
            </div>

            <h2 className="mt-8 font-[var(--font-heading)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Where CNC teams <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">lose momentum</span>
            </h2>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Image preparation shouldn't be your biggest bottleneck. Yet for most teams, it is. 
              Here's what's holding you back.
            </p>
          </div>

          {/* Problems Grid */}
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-3 mt-16">
            {problems.map((problem, index) => (
              <div
                key={problem.title}
                className="group relative"
              >
                {/* Card background with gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur-xl -z-10"></div>

                <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 transition duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-2xl">
                  {/* Number badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 text-lg font-bold text-blue-300">
                      {index + 1}
                    </span>
                    <span className="text-3xl opacity-60 group-hover:opacity-100 transition">{problem.icon}</span>
                  </div>

                  {/* Content */}
                  <h3 className="font-[var(--font-heading)] text-xl sm:text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition">
                    {problem.title}
                  </h3>

                  <p className="text-slate-400 text-base leading-relaxed group-hover:text-slate-300 transition">
                    {problem.description}
                  </p>

                  {/* Accent line */}
                  <div className="mt-6 h-1 w-0 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-8 transition-all duration-300"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </div>
  )
}

export default ProblemSolve