import Image from "next/image";
import type { ReactNode } from "react";

const cncArtworkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200" fill="none">
  <defs>
    <linearGradient id="surface" x1="200" y1="120" x2="1420" y2="1100" gradientUnits="userSpaceOnUse">
      <stop stop-color="#091224"/>
      <stop offset="0.55" stop-color="#0F1832"/>
      <stop offset="1" stop-color="#050914"/>
    </linearGradient>
    <linearGradient id="frame" x1="120" y1="120" x2="1480" y2="1080" gradientUnits="userSpaceOnUse">
      <stop stop-color="#60A5FA" stop-opacity="0.85"/>
      <stop offset="0.45" stop-color="#A78BFA" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#22D3EE" stop-opacity="0.55"/>
    </linearGradient>
    <linearGradient id="board" x1="180" y1="180" x2="1430" y2="1030" gradientUnits="userSpaceOnUse">
      <stop stop-color="#111C37"/>
      <stop offset="1" stop-color="#0A1327"/>
    </linearGradient>
    <linearGradient id="ring" x1="800" y1="340" x2="800" y2="860" gradientUnits="userSpaceOnUse">
      <stop stop-color="#67E8F9"/>
      <stop offset="0.48" stop-color="#818CF8"/>
      <stop offset="1" stop-color="#C084FC"/>
    </linearGradient>
    <linearGradient id="detail" x1="200" y1="220" x2="1400" y2="380" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E0E7FF"/>
      <stop offset="1" stop-color="#7DD3FC"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(800 600) rotate(90) scale(440 560)">
      <stop stop-color="#818CF8" stop-opacity="0.24"/>
      <stop offset="1" stop-color="#818CF8" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1600" height="1200" rx="56" fill="url(#surface)"/>
  <rect x="58" y="58" width="1484" height="1084" rx="44" stroke="url(#frame)" stroke-opacity="0.45" stroke-width="6"/>
  <rect x="118" y="118" width="1364" height="964" rx="40" fill="url(#board)" stroke="#93C5FD" stroke-opacity="0.18" stroke-width="4"/>
  <rect x="184" y="184" width="1232" height="832" rx="28" fill="#0A1326" stroke="#A78BFA" stroke-opacity="0.22" stroke-width="3"/>
  <rect x="184" y="184" width="1232" height="832" rx="28" fill="url(#glow)"/>

  <g stroke="#93C5FD" stroke-opacity="0.1">
    <path d="M240 304H1360"/>
    <path d="M240 424H1360"/>
    <path d="M240 544H1360"/>
    <path d="M240 664H1360"/>
    <path d="M240 784H1360"/>
    <path d="M240 904H1360"/>
    <path d="M336 232V968"/>
    <path d="M512 232V968"/>
    <path d="M688 232V968"/>
    <path d="M864 232V968"/>
    <path d="M1040 232V968"/>
    <path d="M1216 232V968"/>
  </g>

  <g fill="none" stroke="url(#detail)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M312 280H1288"/>
    <path d="M348 280C390 244 446 226 504 226H1096C1154 226 1210 244 1252 280"/>
    <path d="M452 280C476 310 516 330 560 330H1040C1084 330 1124 310 1148 280"/>
    <circle cx="800" cy="280" r="54"/>
    <circle cx="800" cy="280" r="18"/>
    <path d="M746 280H854"/>
    <path d="M800 226V334"/>
  </g>

  <g fill="none" stroke="#A78BFA" stroke-width="10" stroke-linecap="round">
    <path d="M316 388C376 432 376 512 316 556C256 600 256 680 316 724C376 768 376 848 316 892"/>
    <path d="M372 388C432 432 432 512 372 556C312 600 312 680 372 724C432 768 432 848 372 892"/>
    <path d="M1268 404L1330 468L1276 522L1338 584L1280 644"/>
    <path d="M1212 404L1274 468L1220 522L1282 584L1224 644"/>
  </g>

  <g fill="none" stroke="url(#ring)" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="800" cy="612" r="220" stroke-width="12"/>
    <circle cx="800" cy="612" r="172" stroke-width="6" stroke-opacity="0.88"/>
    <circle cx="800" cy="612" r="128" stroke-width="4" stroke-opacity="0.75"/>
    <circle cx="800" cy="612" r="42" stroke-width="8"/>
    <path d="M800 414V810" stroke-width="6"/>
    <path d="M602 612H998" stroke-width="6"/>
    <path d="M660 472L940 752" stroke-width="5"/>
    <path d="M940 472L660 752" stroke-width="5"/>
    <path d="M800 448C836 500 900 538 972 544C916 570 880 624 880 684C840 640 784 616 724 616C768 576 788 518 800 448Z" stroke-width="5"/>
    <path d="M658 560C716 570 758 614 768 672C720 636 654 634 604 668C624 620 624 584 658 560Z" stroke-width="5"/>
    <path d="M942 560C976 584 976 620 996 668C946 634 880 636 832 672C842 614 884 570 942 560Z" stroke-width="5"/>
  </g>

  <g fill="none" stroke="#67E8F9" stroke-opacity="0.8" stroke-width="5" stroke-linecap="round">
    <path d="M564 858C646 820 730 802 800 802C870 802 954 820 1036 858"/>
    <path d="M612 904C676 876 740 862 800 862C860 862 924 876 988 904"/>
    <path d="M688 952H912"/>
    <path d="M708 1000H892"/>
  </g>

  <g fill="#E0E7FF" fill-opacity="0.9" font-family="Arial, sans-serif">
    <text x="260" y="258" font-size="26" letter-spacing="6">CNC ORNAMENTAL PANEL</text>
    <text x="1160" y="258" font-size="18" letter-spacing="4">AUTO CROP SOURCE</text>
    <text x="256" y="956" font-size="18" letter-spacing="4">DETAIL MAP</text>
    <text x="1144" y="956" font-size="18" letter-spacing="4">CENTER RELIEF</text>
  </g>
</svg>
`;

const cncArtworkSrc = `data:image/svg+xml;utf8,${encodeURIComponent(cncArtworkSvg)}`;

type ArtworkViewportProps = {
  alt: string;
  badge?: string;
  title?: string;
  description?: string;
  position?: string;
  zoom?: number;
  className?: string;
  viewportClassName?: string;
  meta?: ReactNode;
};

export function ArtworkViewport({
  alt,
  badge,
  title,
  description,
  position = "50% 50%",
  zoom = 1,
  className = "",
  viewportClassName = "",
  meta
}: ArtworkViewportProps) {
  return (
    <div
      className={`group rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-premium backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] ${className}`}
    >
      <div
        className={`relative overflow-hidden rounded-[24px] border border-white/10 bg-[#11172a] ${viewportClassName}`}
      >
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 28%), radial-gradient(circle at top right, rgba(96,165,250,0.16), transparent 30%), radial-gradient(circle at bottom left, rgba(168,85,247,0.14), transparent 34%)"
          }}
        />
        <Image
          alt={alt}
          src={cncArtworkSrc}
          fill
          unoptimized
          sizes="(min-width: 1280px) 36vw, (min-width: 1024px) 44vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          style={{
            objectPosition: position,
            transform: `scale(${zoom})`
          }}
        />
      </div>

      {(title || description || badge || meta) && (
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            {badge ? (
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-100/85">
                {badge}
              </div>
            ) : null}
            {title ? (
              <h3 className="mt-3 font-[var(--font-heading)] text-lg font-semibold text-white">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
          {meta ? <div className="shrink-0">{meta}</div> : null}
        </div>
      )}
    </div>
  );
}

export function HeroWorkbench() {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-premium backdrop-blur-xl sm:p-5">
      <div className="rounded-[28px] border border-white/10 bg-[#0f1528]/90 p-4">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                CNC crop session
              </p>
              <p className="text-xs text-slate-400">
                Source mapped into multiple export views
              </p>
            </div>
          </div>
          <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-100">
            Processing
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-3">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-400">
              <span>Preview canvas</span>
              <span>5 outputs</span>
            </div>
            <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#10182d]">
              <div
                className="absolute inset-0 z-10"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 22%), radial-gradient(circle at top, rgba(96,165,250,0.18), transparent 32%), radial-gradient(circle at bottom right, rgba(168,85,247,0.15), transparent 36%)"
                }}
              />
              <Image
                alt="CNC design source preview"
                src={cncArtworkSrc}
                fill
                priority
                unoptimized
                sizes="(min-width: 1280px) 40vw, 100vw"
                className="object-cover"
                style={{
                  objectPosition: "50% 48%",
                  transform: "scale(1.05)"
                }}
              />
              <div className="aspect-[4/3] w-full" />

              <div className="absolute inset-x-[11%] top-[12%] z-20 h-[22%] rounded-2xl border border-cyan-200/50 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(125,211,252,0.18)]" />
              <div className="absolute left-[56%] top-[14%] z-20 h-[28%] w-[24%] rounded-2xl border border-violet-200/50 bg-violet-300/10 shadow-[0_0_0_1px_rgba(196,181,253,0.18)]" />
              <div className="absolute left-[28%] top-[40%] z-20 h-[34%] w-[32%] rounded-[30px] border border-blue-200/50 bg-blue-300/10 shadow-[0_0_0_1px_rgba(147,197,253,0.18)]" />

              <div className="absolute left-[12%] top-[8%] z-20 rounded-full border border-cyan-200/30 bg-slate-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
                Top detail
              </div>
              <div className="absolute left-[58%] top-[10%] z-20 rounded-full border border-violet-200/30 bg-slate-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-100">
                Corner crop
              </div>
              <div className="absolute left-[30%] top-[70%] z-20 rounded-full border border-blue-200/30 bg-slate-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-100">
                Center zoom
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Full view",
                position: "50% 52%",
                zoom: 1.16
              },
              {
                label: "Side carving",
                position: "16% 56%",
                zoom: 1.8
              },
              {
                label: "Center zoom",
                position: "50% 58%",
                zoom: 2.05
              }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border border-white/10 bg-white/5 p-3 transition duration-300 hover:border-white/20 hover:bg-white/[0.08]"
              >
                <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#11172a]">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      alt={item.label}
                      src={cncArtworkSrc}
                      fill
                      unoptimized
                      sizes="220px"
                      className="object-cover"
                      style={{
                        objectPosition: item.position,
                        transform: `scale(${item.zoom})`
                      }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-100">
                    {item.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
                    Ready
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
