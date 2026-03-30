import React from 'react'
import { Container } from "@/components/ui/container";


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


function ProblemSolve() {
  return (
   <div>
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
   </div>
  )
}

export default ProblemSolve