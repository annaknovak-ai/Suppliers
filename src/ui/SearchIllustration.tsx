// Decorative illustration for the search screen (buildings and a leaf).
const GREEN = "#1B4B2F";
const NAVY = "#0A2947";
const IVORY = "#FAFBF2";

const BUILDINGS: { x: number; height: number; color: string; windows: number[] }[] = [
  { x: 0, height: 120, color: GREEN, windows: [19] },
  { x: 44, height: 180, color: NAVY, windows: [15, 23] },
  { x: 88, height: 240, color: GREEN, windows: [13, 19, 25] },
  { x: 132, height: 154, color: NAVY, windows: [19] },
  { x: 176, height: 208, color: NAVY, windows: [15, 23] },
  { x: 220, height: 132, color: GREEN, windows: [19] },
  { x: 264, height: 170, color: GREEN, windows: [15, 23] },
];

const BASE = 250;
const WIDTH = 38;

export function SearchIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 250"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMaxYMax meet"
    >
      {BUILDINGS.map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={BASE - b.height} width={WIDTH} height={b.height} fill={b.color} />
          {b.windows.map((wx) => (
            <path
              key={wx}
              d={`M${b.x + wx} ${BASE - b.height + 14}V${BASE - 12}`}
              stroke={IVORY}
              strokeWidth="2"
            />
          ))}
        </g>
      ))}
      <path d="M322 250c4-60 30-110 76-140 2 52-22 112-76 140z" fill={GREEN} />
      <path d="M326 246c16-44 38-86 68-128" stroke={IVORY} strokeWidth="2" fill="none" />
    </svg>
  );
}
