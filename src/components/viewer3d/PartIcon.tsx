import type { PartName } from './cameraShots.ts'

// A small drawing of each part, for its callout on the bow. Drawn on a 24 by 24
// grid in the color of the text around it.
const PATHS: Record<PartName, string> = {
  riser: 'M13 3c-2 3-3 6-3 9s1 6 3 9M10 10.5h3.5M10 13.5h3.5',
  limbs: 'M15 2C9 6 8 10 8 12s1 6 7 10M15 2v20',
  string: 'M12 2v20M10 9h4M10 15h4',
  nockingPoint: 'M8 3v18M8 10.5h3M8 13.5h3M9.5 12H21M18 9.5l3 2.5-3 2.5',
  rest: 'M6 4v16M6 14h7l3-3M3 9h18',
  plunger: 'M3 12h4M7 9h8v6H7zM15 10.5h4v3h-4zM19 12h2',
  arrow: 'M3 12h17M17 9l3 3-3 3M3 12l3-3M3 12l3 3M6 12l3-3M6 12l3 3',
  stabilizer: 'M3 12h13M16 9h5v6h-5zM3 9v6',
}

export function PartIcon({ part, className }: { part: PartName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d={PATHS[part]}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
