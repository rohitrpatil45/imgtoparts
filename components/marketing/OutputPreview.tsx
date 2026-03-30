    import React from "react";

export default function OutputPreview() {
  return (
    <section className="mt-20">
      <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        
        <div className="grid gap-8 lg:grid-cols-2">
          
          {/* LEFT - ORIGINAL IMAGE */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              Original Image
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Your STL or relief design
            </p>

            <div className="mt-4 aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-900/60 to-purple-900/40 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <div className="text-3xl mb-2">⬛</div>
                STL / Relief Design
              </div>
            </div>
          </div>

          {/* RIGHT - OUTPUT GRID */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              5 Professional Outputs
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Auto-generated crops ready to use
            </p>

            {/* TOP SMALL CARDS */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="aspect-video rounded-xl bg-gradient-to-br from-blue-900/60 to-indigo-800/40 border border-white/10" />
              <div className="aspect-video rounded-xl bg-gradient-to-br from-cyan-900/60 to-blue-800/40 border border-white/10" />
              <div className="aspect-video rounded-xl bg-gradient-to-br from-purple-900/60 to-indigo-800/40 border border-white/10" />
            </div>

            {/* MIDDLE SMALL CARD */}
            <div className="mt-3 w-1/2">
              <div className="aspect-video rounded-xl bg-gradient-to-br from-pink-900/60 to-purple-800/40 border border-white/10" />
            </div>

            {/* DETAIL ZOOM */}
            <div className="mt-4">
              <div className="flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600/70 to-pink-500/70 py-3 text-sm font-semibold text-white border border-white/10">
                Detail Zoom
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}