/**
 * Pixel-faithful 3D isometric hero visual component for RegForge.
 * Positioned UPWARDS to seamlessly fill the viewport beneath CTA buttons.
 * Features:
 * - Large 3D shaded purple blocks stepping up on left and right
 * - Central 3D tilted segmented pie chart disc with glossy slices & lifted segment
 * - Vibrant 3D cyan/blue interlocking torus chain rings floating in front
 * - Signature stacked rounded-rectangle wireframe contour plinth beneath central disc
 * - Floating translucent cyan glass cards with rounded corners
 * - Top-right floating dark 3D tile in mid-air
 * - Bottom-left sub-scene: elevated glass plinth + mini pie chart + 4 vertical node pins
 * - Bottom-right sub-scene: 3D segmented donut ring over plinth block
 * - Dashed white circular orbit paths
 */
export function HeroVisual() {
  return (
    <div
      aria-hidden="true"
      className="animate-rf-fade-up-delay-3 pointer-events-none relative z-10 mx-auto w-full max-w-none px-0"
    >
      <div className="relative mx-auto aspect-[16/9.5] w-[132%] max-w-none -translate-x-[12%] sm:w-[124%] sm:-translate-x-[9.5%] md:w-[116%] md:-translate-x-[6.9%] md:max-w-[1720px] lg:aspect-[16/8.2]">
        <svg
          viewBox="-160 0 1720 700"
          className="h-full w-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
          role="presentation"
        >
          <defs>
            {/* --- Block Face Gradients --- */}
            <linearGradient id="topPurpleLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9b56df" />
              <stop offset="100%" stopColor="#5d259e" />
            </linearGradient>

            <linearGradient id="topPurpleMedium" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7e3cbe" />
              <stop offset="100%" stopColor="#45197b" />
            </linearGradient>

            <linearGradient id="topPurpleDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#50228b" />
              <stop offset="100%" stopColor="#250a4c" />
            </linearGradient>

            <linearGradient id="glassCyanTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8efbf4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#20cbff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#462498" stopOpacity="0.3" />
            </linearGradient>

            {/* --- Cyan Glossy Gradients for Torus & Cards --- */}
            <linearGradient id="cyanTorusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#91ffff" />
              <stop offset="40%" stopColor="#00d5ff" />
              <stop offset="100%" stopColor="#2b7eff" />
            </linearGradient>

            <linearGradient id="cyanCardFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8ffcf6" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#12c6ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b218a" stopOpacity="0.35" />
            </linearGradient>

            {/* --- Pie Slice Gradients --- */}
            <linearGradient id="pieSliceCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7bf9ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#279eff" stopOpacity="0.5" />
            </linearGradient>

            <linearGradient id="pieSlicePurpleLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a963f2" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#6229af" stopOpacity="0.55" />
            </linearGradient>

            <linearGradient id="pieSlicePurpleDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4b2085" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#220a45" stopOpacity="0.65" />
            </linearGradient>

            {/* Ambient floor bloom */}
            <radialGradient id="floorBloomGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b4be8" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#491c85" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0b031d" stopOpacity="0" />
            </radialGradient>

            {/* Filters */}
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="cyanGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="blockShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                dx="0"
                dy="20"
                stdDeviation="16"
                floodColor="#060214"
                floodOpacity="0.75"
              />
            </filter>
          </defs>

          {/* Floor ambient glow behind scene */}
          <ellipse
            cx="700"
            cy="540"
            rx="580"
            ry="135"
            fill="url(#floorBloomGrad)"
          />

          {/* Peripheral architecture continues the scene past both viewport edges. */}
          <g filter="url(#blockShadow)" opacity="0.92">
            <IsoBlock x={-165} y={470} w={190} h={110} d={68} top="url(#topPurpleDark)" />
            <IsoBlock x={-72} y={360} w={155} h={80} d={56} top="url(#topPurpleMedium)" />
            <IsoBlock x={32} y={415} w={108} h={116} d={40} top="url(#topPurpleLit)" />
            <IsoBlock x={1292} y={438} w={176} h={120} d={66} top="url(#topPurpleDark)" />
            <IsoBlock x={1372} y={328} w={152} h={92} d={54} top="url(#topPurpleMedium)" />
            <IsoBlock x={1264} y={382} w={96} h={132} d={36} top="url(#topPurpleLit)" />
          </g>
          <g fill="none" stroke="rgba(159, 221, 255, 0.25)" strokeWidth="1.25" strokeDasharray="5 9">
            <path d="M -110 360 C 50 245, 170 250, 315 320" />
            <path d="M 1085 320 C 1240 245, 1375 250, 1530 360" />
          </g>

          {/* ==================== 1. LARGE SOLID 3D ISOMETRIC BLOCKS (Left & Right Plinths) ==================== */}
          <g filter="url(#blockShadow)">
            {/* Left Background Blocks */}
            <IsoBlock x={130} y={430} w={145} h={72} d={54} top="url(#topPurpleDark)" />
            <IsoBlock x={280} y={460} w={120} h={60} d={46} top="url(#topPurpleMedium)" />
            
            {/* Left Foreground Tall Blocks */}
            <IsoBlock x={210} y={380} w={170} h={44} d={62} top="url(#topPurpleLit)" />
            <IsoBlock x={340} y={290} w={78} h={125} d={38} top="url(#topPurpleLit)" />
            <IsoBlock x={285} y={340} w={65} h={90} d={32} top="url(#topPurpleDark)" />

            {/* Right Background Blocks */}
            <IsoBlock x={940} y={440} w={130} h={66} d={48} top="url(#topPurpleMedium)" />
            <IsoBlock x={1070} y={410} w={160} h={88} d={58} top="url(#topPurpleDark)" />

            {/* Right Foreground Plinths & Towers */}
            <IsoBlock x={890} y={365} w={160} h={40} d={56} top="url(#topPurpleLit)" />
            <IsoBlock x={970} y={270} w={85} h={135} d={42} top="url(#topPurpleLit)" />
            <IsoBlock x={1055} y={310} w={68} h={85} d={34} top="url(#topPurpleDark)" />

            {/* Large Center Base Plinths */}
            <IsoBlock x={440} y={470} w={360} h={90} d={105} top="url(#topPurpleMedium)" />
            <IsoBlock x={500} y={405} w={270} h={50} d={80} top="url(#topPurpleLit)" />
          </g>

          {/* Glass Top Plinths on Left & Right */}
          <g>
            <IsoBlock x={205} y={340} w={180} h={25} d={64} top="url(#glassCyanTop)" glass />
            <IsoBlock x={875} y={325} w={170} h={24} d={60} top="url(#glassCyanTop)" glass />
          </g>

          {/* ==================== 2. SIGNATURE CONTOUR WIREFRAME PLINTH STACK (Bottom Center) ==================== */}
          <g
            fill="none"
            stroke="rgba(205, 235, 255, 0.75)"
            strokeWidth="1.8"
            filter="url(#softGlow)"
          >
            <path d="M 580 400 L 700 340 L 820 400 L 700 460 Z" opacity="0.5" />
            <path d="M 592 380 L 700 326 L 808 380 L 700 434 Z" opacity="0.65" />
            <path d="M 606 360 L 700 312 L 794 360 L 700 408 Z" opacity="0.8" />
            <path d="M 620 340 L 700 298 L 780 340 L 700 382 Z" opacity="0.95" />
          </g>

          {/* ==================== 3. CENTRAL 3D TILTED SEGMENTED PIE DISC ==================== */}
          <g filter="url(#blockShadow)">
            {/* Base Drop Shadow Disc */}
            <ellipse cx="700" cy="280" rx="160" ry="72" fill="rgba(12, 4, 30, 0.65)" />

            {/* 3D Disc Side Rim */}
            <path
              d="M 540 280 A 160 72 0 0 0 860 280 L 860 302 A 160 72 0 0 1 540 302 Z"
              fill="#2b0d52"
              stroke="rgba(160, 115, 225, 0.5)"
              strokeWidth="1.2"
            />

            {/* Disc Top Surface */}
            <ellipse
              cx="700"
              cy="280"
              rx="160"
              ry="72"
              fill="url(#topPurpleMedium)"
              stroke="rgba(200, 230, 255, 0.6)"
              strokeWidth="2"
            />

            {/* Segment 1: Front Cyan Glossy Slice */}
            <path
              d="M 700 280 L 700 208 A 160 72 0 0 1 842 308 Z"
              fill="url(#pieSliceCyan)"
              stroke="rgba(220, 255, 255, 0.85)"
              strokeWidth="1.6"
            />

            {/* Segment 2: Front-left Purple Lit Slice */}
            <path
              d="M 700 280 L 842 308 A 160 72 0 0 1 608 340 Z"
              fill="url(#pieSlicePurpleLit)"
              stroke="rgba(200, 170, 250, 0.65)"
              strokeWidth="1.4"
            />

            {/* Segment 3: Rear Dark Violet Slice */}
            <path
              d="M 700 280 L 608 340 A 160 72 0 0 1 560 260 Z"
              fill="url(#pieSlicePurpleDark)"
              stroke="rgba(160, 125, 220, 0.45)"
              strokeWidth="1.2"
            />

            {/* Floating Lifted Segment Slice */}
            <g transform="translate(16, -28)" filter="url(#cyanGlow)">
              <path
                d="M 742 235 L 790 208 L 845 242 L 796 268 Z"
                fill="url(#cyanCardFill)"
                stroke="rgba(230, 255, 255, 0.95)"
                strokeWidth="1.8"
              />
              <path
                d="M 742 235 L 796 268 L 796 276 L 742 243 Z"
                fill="#009ddb"
                opacity="0.85"
              />
              <path
                d="M 796 268 L 845 242 L 845 250 L 796 276 Z"
                fill="#007cb3"
                opacity="0.9"
              />
            </g>

            {/* Center Hole Rim */}
            <ellipse
              cx="700"
              cy="280"
              rx="50"
              ry="22"
              fill="#12052c"
              stroke="rgba(190, 230, 255, 0.6)"
              strokeWidth="1.5"
            />
            <ellipse
              cx="700"
              cy="282"
              rx="47"
              ry="20"
              fill="none"
              stroke="rgba(0, 235, 255, 0.5)"
              strokeWidth="1.2"
            />
          </g>

          {/* ==================== 4. 3D GLOSSY CYAN INTERLOCKING TORUS RINGS ==================== */}
          <g filter="url(#cyanGlow)" className="animate-rf-float">
            {/* Primary Cyan Torus (Tilted Front Angle) */}
            <g transform="translate(765, 215) rotate(-16)">
              <ellipse
                cx="0"
                cy="0"
                rx="82"
                ry="40"
                fill="none"
                stroke="url(#cyanTorusGrad)"
                strokeWidth="19"
                strokeLinecap="round"
              />
              <ellipse
                cx="-2"
                cy="-3"
                rx="78"
                ry="37"
                fill="none"
                stroke="rgba(255, 255, 255, 0.75)"
                strokeWidth="2.8"
                strokeDasharray="48 90"
              />
              <ellipse
                cx="2"
                cy="3"
                rx="82"
                ry="40"
                fill="none"
                stroke="rgba(8, 35, 80, 0.55)"
                strokeWidth="4"
              />
            </g>

            {/* Secondary Interlocked Cyan Torus Ring */}
            <g transform="translate(705, 235) rotate(30)">
              <ellipse
                cx="0"
                cy="0"
                rx="65"
                ry="32"
                fill="none"
                stroke="url(#cyanTorusGrad)"
                strokeWidth="14"
                opacity="0.9"
              />
              <ellipse
                cx="-1"
                cy="-2"
                rx="61"
                ry="30"
                fill="none"
                stroke="rgba(255, 255, 255, 0.65)"
                strokeWidth="2.2"
                strokeDasharray="34 68"
              />
            </g>
          </g>

          {/* White & Cyan Dashed Orbital Rings */}
          <g stroke="rgba(195, 230, 255, 0.45)" strokeWidth="1.5" fill="none">
            <ellipse
              cx="700"
              cy="275"
              rx="250"
              ry="100"
              strokeDasharray="6 10"
              transform="rotate(-12 700 275)"
            />
            <ellipse
              cx="710"
              cy="280"
              rx="295"
              ry="118"
              stroke="rgba(130, 190, 255, 0.25)"
              strokeDasharray="4 12"
              transform="rotate(6 710 280)"
            />
          </g>

          {/* ==================== 5. FLOATING TRANSLUCENT CYAN GLASS CARDS ==================== */}
          <g filter="url(#cyanGlow)" className="animate-rf-float-slow">
            {/* Card 1: Mid-Left Floating Cyan Slab */}
            <g transform="translate(400, 150) rotate(-16)">
              <rect
                x="0"
                y="0"
                width="128"
                height="76"
                rx="14"
                fill="url(#cyanCardFill)"
                stroke="rgba(230, 255, 255, 0.9)"
                strokeWidth="2"
              />
              <path
                d="M 12 14 L 116 14"
                stroke="rgba(255, 255, 255, 0.65)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </g>

            {/* Card 2: Mid-Right Top Glass Card */}
            <g transform="translate(850, 130) rotate(14)">
              <rect
                x="0"
                y="0"
                width="110"
                height="65"
                rx="12"
                fill="url(#glassCyanTop)"
                stroke="rgba(200, 250, 255, 0.75)"
                strokeWidth="1.8"
              />
              <rect
                x="14"
                y="14"
                width="46"
                height="24"
                rx="4"
                fill="rgba(255, 255, 255, 0.18)"
              />
            </g>

            {/* Card 3: Far Right Small Floating Tile */}
            <g transform="translate(935, 210) rotate(-8)">
              <rect
                x="0"
                y="0"
                width="82"
                height="48"
                rx="9"
                fill="url(#cyanCardFill)"
                opacity="0.88"
                stroke="rgba(220, 255, 255, 0.7)"
                strokeWidth="1.5"
              />
            </g>

            {/* Card 4: Top Center Small Tile */}
            <g transform="translate(560, 120) rotate(-22)">
              <rect
                x="0"
                y="0"
                width="70"
                height="42"
                rx="8"
                fill="url(#glassCyanTop)"
                stroke="rgba(210, 250, 255, 0.65)"
                strokeWidth="1.5"
              />
            </g>
          </g>

          {/* ==================== 6. TOP RIGHT FLOATING DARK TILE (Reference Image 2 Signature) ==================== */}
          <g transform="translate(1090, 160) rotate(14)" filter="url(#blockShadow)">
            <rect
              x="0"
              y="0"
              width="190"
              height="120"
              rx="16"
              fill="rgba(26, 10, 56, 0.85)"
              stroke="rgba(190, 165, 245, 0.5)"
              strokeWidth="2"
            />
            {/* Top Gloss Rim */}
            <rect
              x="2"
              y="2"
              width="186"
              height="116"
              rx="14"
              fill="none"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="1"
            />
          </g>

          {/* ==================== 7. BOTTOM-LEFT SUB-SCENE (PLINTH + MINI PIE + NODE PINS) ==================== */}
          <g>
            <ellipse
              cx="230"
              cy="320"
              rx="110"
              ry="48"
              fill="rgba(50, 22, 105, 0.55)"
              stroke="rgba(190, 210, 255, 0.4)"
              strokeWidth="1.5"
            />
            <ellipse
              cx="230"
              cy="300"
              rx="58"
              ry="25"
              fill="url(#topPurpleLit)"
              stroke="rgba(200, 235, 255, 0.65)"
              strokeWidth="1.6"
            />
            <path
              d="M 230 300 L 230 275 A 58 25 0 0 1 278 310 Z"
              fill="url(#pieSliceCyan)"
            />

            {/* Vertical Connector Pins + Glowing Nodes */}
            <g stroke="rgba(210, 235, 255, 0.65)" strokeWidth="1.3" fill="none">
              <path d="M 200 285 L 150 238" strokeDasharray="3 4" />
              <path d="M 252 288 L 310 242" strokeDasharray="3 4" />
              <path d="M 268 318 L 326 338" strokeDasharray="3 4" />
              <path d="M 195 324 L 140 350" strokeDasharray="3 4" />
            </g>
            <circle cx="150" cy="238" r="6" fill="#8ffcf6" filter="url(#cyanGlow)" />
            <circle cx="310" cy="242" r="5" fill="#c2edff" />
            <circle cx="326" cy="338" r="5.5" fill="#8ffcf6" filter="url(#cyanGlow)" />
            <circle cx="140" cy="350" r="4.5" fill="#cce2ff" />

            <ellipse
              cx="230"
              cy="315"
              rx="140"
              ry="58"
              fill="none"
              stroke="rgba(200, 220, 255, 0.28)"
              strokeWidth="1.2"
              strokeDasharray="4 8"
            />
          </g>

          {/* ==================== 8. BOTTOM-RIGHT SUB-SCENE (DONUT RING + PLINTH) ==================== */}
          <g>
            <IsoBlock x={1060} y={260} w={90} h={64} d={44} top="url(#topPurpleDark)" />
            <g className="animate-rf-spin-slow" style={{ transformOrigin: "1140px 220px" }}>
              <circle
                cx="1140"
                cy="220"
                r="72"
                fill="none"
                stroke="url(#cyanTorusGrad)"
                strokeWidth="8"
                strokeDasharray="75 24 48 18 32 16"
                opacity="0.88"
                strokeLinecap="round"
                filter="url(#cyanGlow)"
              />
              <circle
                cx="1140"
                cy="220"
                r="48"
                fill="none"
                stroke="rgba(170, 140, 255, 0.55)"
                strokeWidth="4"
                strokeDasharray="36 18"
              />
            </g>
          </g>

          {/* Connection Arcs across components */}
          <g fill="none" stroke="rgba(190, 225, 255, 0.32)" strokeWidth="1.5" strokeDasharray="4 8">
            <path d="M 315 260 C 425 170, 535 160, 615 230" />
            <path d="M 755 200 C 865 120, 975 150, 1075 210" />
          </g>
        </svg>

        {/* A feathered vignette holds the scene together without creating a panel edge. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 88% at 50% 47%, transparent 43%, rgba(5, 1, 14, 0.24) 100%)",
          }}
        />
      </div>
    </div>
  );
}

type IsoBlockProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  d: number;
  top: string;
  glass?: boolean;
};

function IsoBlock({ x, y, w, h, d, top, glass }: IsoBlockProps) {
  const topPath = `M ${x} ${y} L ${x + w / 2} ${y - d / 2} L ${x + w} ${y} L ${x + w / 2} ${y + d / 2} Z`;
  const leftPath = `M ${x} ${y} L ${x + w / 2} ${y + d / 2} L ${x + w / 2} ${y + d / 2 + h} L ${x} ${y + h} Z`;
  const rightPath = `M ${x + w} ${y} L ${x + w / 2} ${y + d / 2} L ${x + w / 2} ${y + d / 2 + h} L ${x + w} ${y + h} Z`;

  return (
    <g>
      {/* Left Shaded Face */}
      <path
        d={leftPath}
        fill={glass ? "rgba(50, 24, 105, 0.55)" : "#220a48"}
        opacity={glass ? 0.78 : 1}
      />
      {/* Right Dark Shaded Face */}
      <path
        d={rightPath}
        fill={glass ? "rgba(28, 12, 65, 0.65)" : "#13042b"}
        opacity={glass ? 0.85 : 1}
      />
      {/* Top Gradient Face */}
      <path
        d={topPath}
        fill={top}
        stroke={glass ? "rgba(210, 245, 255, 0.55)" : "rgba(175, 135, 235, 0.45)"}
        strokeWidth="1.1"
      />
      {/* Top Edge Highlight */}
      <path
        d={`M ${x} ${y} L ${x + w / 2} ${y - d / 2} L ${x + w} ${y}`}
        fill="none"
        stroke="rgba(230, 215, 255, 0.35)"
        strokeWidth="1.3"
      />
    </g>
  );
}
