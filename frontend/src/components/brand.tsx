export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#fc4c02" />
      <path
        d="M21.4 9.1a8.6 8.6 0 1 0 0 13.8"
        fill="none"
        stroke="#0b0b0e"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
