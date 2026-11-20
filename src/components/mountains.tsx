// Summit's mountain artwork: plain SVG, colored with currentColor / CSS variables so it works in light and dark.

export function MountainMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <path d="M2 27 L12 10 L17 18 L21 13 L30 27 Z" fill="currentColor" opacity="0.95" />
      <path d="M12 10 L14.6 14.4 L12.8 13.4 L11 15 L9.6 14.2 Z" fill="#fff" opacity="0.9" />
      <path d="M21 13 L23.2 16.6 L21.6 15.9 L20.2 17 Z" fill="#fff" opacity="0.8" />
      <circle cx="25" cy="7" r="2.6" fill="#fde68a" />
    </svg>
  );
}

/** A thin ridge line (used as the top edge of the footer). */
export function MountainRange({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className={className} aria-hidden>
      <path fill="currentColor" d="M0 60 L0 44 L70 30 L140 40 L230 14 L300 34 L360 26 L450 42 L540 10 L610 30 L680 24 L760 40 L860 6 L940 32 L1010 22 L1090 38 L1180 16 L1260 34 L1340 26 L1440 40 L1440 60 Z" />
    </svg>
  );
}

/** The fixed background: sky glow, stars (night) and three layers of ranges with pines. */
export function MountainScene() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,var(--sky-glow),transparent_60%)]" />
      <div className="scene-stars absolute inset-x-0 top-0 h-[55vh]" />
      <div className="absolute -left-[15%] -top-[25%] h-[70vh] w-[60vw] animate-drift rounded-full bg-[radial-gradient(closest-side,var(--aurora-1),transparent)] blur-3xl" />
      <div className="absolute -right-[10%] top-[5%] h-[60vh] w-[55vw] animate-drift rounded-full bg-[radial-gradient(closest-side,var(--aurora-2),transparent)] blur-3xl [animation-delay:-9s]" />
      <svg viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[36vh] w-full" style={{ opacity: "var(--scene-opacity)" }}>
        {/* far range with snowcaps */}
        <path fill="var(--range-far)" d="M0 420 L0 250 L90 200 L170 230 L260 140 L330 190 L400 160 L500 230 L590 120 L680 200 L760 170 L850 230 L960 100 L1050 190 L1130 150 L1220 210 L1330 130 L1440 190 L1440 420 Z" />
        <path fill="var(--snow)" d="M260 140 L285 158 L268 156 L252 168 L240 158 Z M590 120 L618 142 L600 138 L584 150 L568 140 Z M960 100 L992 124 L972 120 L956 134 L940 122 Z M1330 130 L1356 150 L1338 146 L1322 158 L1308 148 Z" />
        {/* middle range */}
        <path fill="var(--range-mid)" d="M0 420 L0 300 L120 250 L220 290 L330 230 L440 290 L560 240 L650 285 L780 220 L900 280 L1010 245 L1120 295 L1250 235 L1360 280 L1440 260 L1440 420 Z" />
        {/* near hills with pines */}
        <path fill="var(--range-near)" d="M0 420 L0 340 L160 315 L320 345 L480 318 L640 350 L800 322 L960 352 L1120 325 L1280 350 L1440 330 L1440 420 Z" />
        <g fill="var(--range-near)">
          {[60, 110, 150, 380, 420, 700, 745, 1010, 1050, 1090, 1330, 1380].map((x, i) => {
            const h = 34 + ((i * 7) % 18), y = 345 - (i % 3) * 8;
            return <path key={x} d={`M${x} ${y - h} L${x + 12} ${y} L${x - 12} ${y} Z`} />;
          })}
        </g>
      </svg>
      <div className="absolute inset-0 bg-[linear-gradient(var(--grid)_1px,transparent_1px),linear-gradient(90deg,var(--grid)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_60%)]" />
    </div>
  );
}
