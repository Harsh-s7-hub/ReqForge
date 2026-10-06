/**
 * Enhanced noise grain background + 2-3 localized thin isometric line accents.
 * Directly fulfills user directive: heavy noise texture + non-full-page line accents.
 */
export function BackgroundEffects() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Fine film grain keeps the gradient field from looking airbrushed. */}
      <svg
        className="absolute inset-0 h-full w-full mix-blend-overlay opacity-70 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="heavyNoiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.92"
            numOctaves="5"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#heavyNoiseFilter)" />
      </svg>

      {/* Coarser grain only lightly breaks up the large dark areas. */}
      <svg
        className="absolute inset-0 h-full w-full mix-blend-soft-light opacity-52 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="softNoiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.45"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#softNoiseFilter)" />
      </svg>

      {/* 2. LOCALIZED LINE ACCENTS (ONLY 2-3 VERY THIN ACCENT CLUSTERS, NOT FULL PAGE) */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <g
          fill="none"
          stroke="rgba(230, 220, 255, 0.15)"
          strokeWidth="0.8"
          strokeLinecap="round"
        >
          {/* Accent Cluster 1: Upper-Left Faint Diamond Grid */}
          <g transform="translate(120, 100)">
            <path d="M0 40 L60 0 L120 40 L60 80 Z" />
            <path d="M60 0 L180 80 L120 120 L0 40 Z" opacity="0.6" />
            <path d="M60 80 L180 0" strokeDasharray="4 6" opacity="0.5" />
          </g>

          {/* Accent Cluster 2: Upper-Right Faint Diamond Grid */}
          <g transform="translate(1120, 120)">
            <path d="M60 0 L180 80 L120 120 L0 40 Z" />
            <path d="M0 40 L60 0 L120 40 L60 80 Z" opacity="0.6" />
            <path d="M0 40 L120 120" strokeDasharray="4 6" opacity="0.5" />
          </g>

          {/* Accent Cluster 3: Mid-Background Soft Horizontal Perspective Guide */}
          <g transform="translate(480, 260)" opacity="0.45">
            <path d="M0 30 L240 0 L480 30" strokeDasharray="6 8" />
            <path d="M60 60 L240 30 L420 60" />
          </g>
        </g>

        {/* Scattered tiny sparkle cross marks */}
        {[
          [180, 160],
          [320, 260],
          [1180, 200],
          [1280, 320],
          [720, 220],
        ].map(([x, y], i) => (
          <g key={i} opacity="0.45" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8">
            <line x1={x - 3} y1={y} x2={x + 3} y2={y} />
            <line x1={x} y1={y - 3} x2={x} y2={y + 3} />
          </g>
        ))}
      </svg>

      {/* 3. Ambient Star Particles */}
      <div className="absolute inset-0">
        {[
          [12, 18, 1.5],
          [24, 32, 1.2],
          [8, 52, 1.6],
          [78, 16, 1.4],
          [88, 38, 1.6],
          [94, 58, 1.2],
          [34, 24, 1.1],
          [62, 14, 1.5],
        ].map(([left, top, size], index) => (
          <span
            key={index}
            className="animate-rf-drift absolute rounded-full bg-white"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              opacity: 0.5,
              boxShadow: "0 0 6px rgba(200,230,255,0.7)",
              animationDelay: `${index * 0.22}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
