/**
 * An ICPC balloon: at the contest, every problem a team solves earns a
 * balloon of that problem's colour, tied to their desk.
 */
export function Balloon({ color, letter, className = "" }: { color: string; letter?: string; className?: string }) {
  return (
    <svg viewBox="0 0 40 64" className={className} aria-hidden="true" focusable="false">
      {/* string */}
      <path d="M20 45 C 17 51, 23 55, 20 63" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
      {/* knot */}
      <path d="M17.5 46 L 22.5 46 L 20 42.5 Z" fill={color} />
      {/* body */}
      <path d="M20 2 C 31 2, 38 11, 38 21 C 38 33, 28 42, 20 43.5 C 12 42, 2 33, 2 21 C 2 11, 9 2, 20 2 Z" fill={color} />
      {/* highlight */}
      <ellipse cx="12.5" cy="13" rx="3.2" ry="5.5" transform="rotate(25 12.5 13)" fill="#fff" opacity="0.35" />
      {letter && (
        <text x="20" y="28.5" textAnchor="middle" fontSize="17" fontWeight="800" fill="#0c1424" fontFamily="var(--font-archivo), sans-serif">
          {letter}
        </text>
      )}
    </svg>
  );
}

/** Balloon colours, problem A, B, C… (fixed, like a real contest's). */
export const BALLOON_COLORS = ["#ff7070", "#6fb3ff", "#46d39a", "#ffc857", "#c4a4ff", "#ff8a3d"];
