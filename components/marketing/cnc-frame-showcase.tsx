import { useId } from "react";

const frameViewports = {
  full: "0 0 1000 1000",
  fullCrop: "60 60 880 880",
  topLeft: "0 0 520 520",
  topRight: "480 0 520 520",
  bottomLeft: "0 480 520 520",
  bottomRight: "480 480 520 520",
  topDetail: "180 0 640 320",
  cornerDetail: "0 0 360 360",
  sideCarving: "0 180 320 640",
  centerZoom: "290 290 420 420"
} as const;

export type FramePreset = keyof typeof frameViewports;

type FrameArtworkProps = {
  preset?: FramePreset;
  className?: string;
};

type FramePreviewCardProps = {
  title: string;
  description: string;
  preset: FramePreset;
  className?: string;
  frameClassName?: string;
};

type OrnamentProps = {
  fill: string;
  stroke: string;
  transform?: string;
};

function CornerOrnament({ fill, stroke, transform }: OrnamentProps) {
  return (
    <g transform={transform}>
      <path
        d="M0 132C0 89 13 55 40 30C67 5 101 -4 142 2C125 15 112 31 103 49C94 68 91 88 94 111C98 144 115 170 144 188C173 206 205 212 240 206C217 229 187 241 151 241C105 241 66 226 35 195C12 172 0 151 0 132Z"
        fill={fill}
        fillOpacity="0.98"
      />
      <path
        d="M38 126C39 98 48 76 67 61C86 46 109 41 136 46C118 59 108 77 106 101C104 126 112 148 131 167C150 186 174 196 202 196C187 210 166 217 140 217C110 217 84 208 62 191C46 178 38 156 38 126Z"
        fill="rgba(255,248,220,0.22)"
      />
      <path
        d="M148 26C176 13 206 13 238 25C217 35 202 50 192 69C182 88 179 109 182 132C187 171 207 206 242 237C218 229 196 215 177 195C156 173 142 149 136 123C129 91 133 58 148 26Z"
        fill={fill}
        fillOpacity="0.92"
      />
      <path
        d="M90 168C114 154 138 149 163 152C188 155 211 167 232 188"
        fill="none"
        stroke={stroke}
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M105 105C123 94 143 91 164 95C185 99 205 111 223 131"
        fill="none"
        stroke={stroke}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M70 60C92 52 113 56 134 72"
        fill="none"
        stroke={stroke}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="150" cy="145" r="31" fill="rgba(250, 204, 21, 0.32)" />
      <circle
        cx="150"
        cy="145"
        r="17"
        fill="rgba(255, 248, 220, 0.78)"
        stroke={stroke}
        strokeWidth="6"
      />
      <circle cx="208" cy="88" r="12" fill="rgba(255, 248, 220, 0.78)" />
    </g>
  );
}

function SideOrnament({
  fill,
  stroke,
  transform,
  flip = false
}: OrnamentProps & { flip?: boolean }) {
  return (
    <g transform={`${transform ?? ""}${flip ? " scale(-1,1)" : ""}`}>
      <path
        d="M0 0C18 29 27 58 27 87C27 116 18 144 0 171C33 153 63 130 88 102C107 81 120 58 128 33C136 8 136 -19 127 -48C111 -32 96 -17 81 0C65 19 47 38 27 57C19 45 10 26 0 0Z"
        fill={fill}
      />
      <path
        d="M35 46C58 33 81 28 104 31C127 34 148 46 167 68"
        fill="none"
        stroke={stroke}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="116" cy="78" r="16" fill="rgba(255, 248, 220, 0.72)" />
    </g>
  );
}

function TopCenterOrnament({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g transform="translate(500 120)">
      <path
        d="M-114 0C-82 -24 -47 -36 -9 -36C30 -36 65 -24 96 0C73 13 55 31 44 53C33 75 28 99 29 125C0 105 -29 95 -59 95C-89 95 -118 105 -146 125C-145 99 -140 75 -129 53C-118 31 -100 13 -77 0C-90 -6 -102 -15 -114 0Z"
        fill={fill}
      />
      <path
        d="M-95 32C-58 14 -20 5 21 5C62 5 100 14 135 32"
        fill="none"
        stroke={stroke}
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        d="M-64 81C-40 68 -15 62 10 62C36 62 60 68 84 81"
        fill="none"
        stroke={stroke}
        strokeWidth="11"
        strokeLinecap="round"
      />
      <circle cx="10" cy="40" r="19" fill="rgba(255, 248, 220, 0.84)" />
    </g>
  );
}

export function FrameArtwork({
  preset = "full",
  className = ""
}: FrameArtworkProps) {
  const baseId = useId().replace(/:/g, "");
  const backdropId = `${baseId}-backdrop`;
  const goldId = `${baseId}-gold`;
  const strokeId = `${baseId}-stroke`;
  const shineId = `${baseId}-shine`;
  const glowId = `${baseId}-glow`;

  return (
    <div
      className={`relative isolate overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#050816] ${className}`}
    >
      <svg
        aria-hidden="true"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox={frameViewports[preset]}
      >
        <defs>
          <linearGradient id={backdropId} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#050816" />
            <stop offset="45%" stopColor="#121935" />
            <stop offset="100%" stopColor="#090d18" />
          </linearGradient>
          <linearGradient id={goldId} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#fff6d7" />
            <stop offset="18%" stopColor="#f7d97a" />
            <stop offset="45%" stopColor="#d7a83c" />
            <stop offset="72%" stopColor="#b97b1b" />
            <stop offset="100%" stopColor="#f6d88c" />
          </linearGradient>
          <linearGradient id={strokeId} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#7c4d11" />
            <stop offset="52%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#7c4d11" />
          </linearGradient>
          <radialGradient id={shineId} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.82)" />
            <stop offset="35%" stopColor="rgba(255,244,194,0.24)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              floodColor="#f59e0b"
              floodOpacity="0.35"
              stdDeviation="16"
            />
          </filter>
        </defs>

        <rect fill={`url(#${backdropId})`} height="1000" width="1000" />
        <rect
          fill="rgba(10, 14, 30, 0.82)"
          height="690"
          rx="54"
          width="690"
          x="155"
          y="155"
        />
        <rect
          fill="none"
          filter={`url(#${glowId})`}
          height="824"
          rx="92"
          stroke={`url(#${strokeId})`}
          strokeWidth="44"
          width="824"
          x="88"
          y="88"
        />
        <rect
          fill="none"
          height="740"
          rx="70"
          stroke={`url(#${goldId})`}
          strokeWidth="16"
          width="740"
          x="130"
          y="130"
        />
        <rect
          fill="rgba(255, 248, 220, 0.05)"
          height="722"
          rx="58"
          width="722"
          x="139"
          y="139"
        />
        <rect
          fill={`url(#${shineId})`}
          height="880"
          opacity="0.72"
          width="880"
          x="60"
          y="60"
        />

        <CornerOrnament
          fill={`url(#${goldId})`}
          stroke={`url(#${strokeId})`}
          transform="translate(92 92)"
        />
        <CornerOrnament
          fill={`url(#${goldId})`}
          stroke={`url(#${strokeId})`}
          transform="translate(908 92) scale(-1 1)"
        />
        <CornerOrnament
          fill={`url(#${goldId})`}
          stroke={`url(#${strokeId})`}
          transform="translate(92 908) scale(1 -1)"
        />
        <CornerOrnament
          fill={`url(#${goldId})`}
          stroke={`url(#${strokeId})`}
          transform="translate(908 908) scale(-1 -1)"
        />

        <TopCenterOrnament fill={`url(#${goldId})`} stroke={`url(#${strokeId})`} />
        <g transform="translate(500 880) scale(1 -1)">
          <TopCenterOrnament
            fill={`url(#${goldId})`}
            stroke={`url(#${strokeId})`}
          />
        </g>

        <SideOrnament
          fill={`url(#${goldId})`}
          stroke={`url(#${strokeId})`}
          transform="translate(145 345) rotate(-90)"
        />
        <SideOrnament
          fill={`url(#${goldId})`}
          stroke={`url(#${strokeId})`}
          transform="translate(855 345) rotate(90)"
        />

        <g fill={`url(#${goldId})`}>
          {[230, 330, 430, 530, 630, 730].map((x) => (
            <path
              key={`top-${x}`}
              d={`M${x} 146C${x + 18} 170 ${x + 18} 198 ${x} 230C${x + 34} 214 ${x + 56} 186 ${x + 66} 146C${x + 76} 186 ${x + 98} 214 ${x + 132} 230C${x + 114} 198 ${x + 114} 170 ${x + 132} 146C${x + 96} 160 ${x + 74} 187 ${x + 66} 226C${x + 57} 187 ${x + 35} 160 ${x} 146Z`}
            />
          ))}
        </g>
        <g fill={`url(#${goldId})`} transform="translate(0 1000) scale(1 -1)">
          {[230, 330, 430, 530, 630, 730].map((x) => (
            <path
              key={`bottom-${x}`}
              d={`M${x} 146C${x + 18} 170 ${x + 18} 198 ${x} 230C${x + 34} 214 ${x + 56} 186 ${x + 66} 146C${x + 76} 186 ${x + 98} 214 ${x + 132} 230C${x + 114} 198 ${x + 114} 170 ${x + 132} 146C${x + 96} 160 ${x + 74} 187 ${x + 66} 226C${x + 57} 187 ${x + 35} 160 ${x} 146Z`}
            />
          ))}
        </g>

        <g transform="translate(500 500)">
          <circle
            cx="0"
            cy="0"
            fill="rgba(255, 248, 220, 0.18)"
            r="140"
            stroke={`url(#${strokeId})`}
            strokeWidth="10"
          />
          <circle
            cx="0"
            cy="0"
            fill={`url(#${goldId})`}
            opacity="0.95"
            r="98"
          />
          <path
            d="M0 -70C15 -28 42 0 82 15C42 31 15 58 0 100C-17 58 -45 31 -84 15C-45 -1 -17 -28 0 -70Z"
            fill="rgba(66, 42, 8, 0.58)"
          />
          <path
            d="M-90 0C-52 -9 -18 -28 0 -60C18 -28 52 -9 90 0C52 10 18 30 0 62C-18 30 -52 10 -90 0Z"
            fill="rgba(66, 42, 8, 0.58)"
          />
          <circle cx="0" cy="0" fill="rgba(255,248,220,0.7)" r="22" />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(7,10,23,0.02),rgba(7,10,23,0.38))]" />
    </div>
  );
}

export function FramePreviewCard({
  title,
  description,
  preset,
  className = "",
  frameClassName = ""
}: FramePreviewCardProps) {
  return (
    <div
      className={`group rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-3 shadow-premium backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-sky-300/30 hover:bg-white/[0.08] ${className}`}
    >
      <FrameArtwork
        className={`aspect-[4/3] rounded-[1.35rem] ${frameClassName}`}
        preset={preset}
      />
      <div className="mt-4 space-y-1">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs leading-6 text-slate-300">{description}</div>
      </div>
    </div>
  );
}
