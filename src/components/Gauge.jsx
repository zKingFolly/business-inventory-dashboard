const RADIUS = 80
const ARC_LENGTH = Math.PI * RADIUS
const ARC_PATH = 'M20 100 A80 80 0 0 1 180 100'

export default function Gauge({ pct }) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <svg
      viewBox="0 0 200 110"
      width="100%"
      style={{ maxWidth: 260 }}
      role="img"
      aria-label={`${Math.round(clamped)}% of products healthy`}
    >
      <path d={ARC_PATH} fill="none" stroke="var(--bar-muted)" strokeWidth="12" strokeLinecap="round" />
      <path
        d={ARC_PATH}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${(clamped / 100) * ARC_LENGTH} ${ARC_LENGTH}`}
      />
    </svg>
  )
}
