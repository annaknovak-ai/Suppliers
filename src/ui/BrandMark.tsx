// Product mark: vertical buildings in green and navy with one leaf.
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="6" y="18" width="8" height="24" fill="#0A2947" />
      <rect x="15" y="6" width="9" height="36" fill="#0A2947" />
      <rect x="25" y="13" width="8" height="29" fill="#1B4B2F" />
      <rect x="34" y="21" width="7" height="21" fill="#1B4B2F" />
      <g stroke="#FAFBF2" strokeWidth="1.2">
        <path d="M10 22v16" />
        <path d="M18.5 10v28M21 10v28" />
        <path d="M29 17v21" />
      </g>
      <path d="M4 46c10-1 22-4 30-11 5-4 9-9 11-15-8 2-16 6-23 12-6 5-11 9-18 14z" fill="#1B4B2F" />
      <path d="M8 44c10-5 21-12 33-21" stroke="#FAFBF2" strokeWidth="1" fill="none" />
    </svg>
  );
}
