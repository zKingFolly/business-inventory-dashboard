import { APP_NAME } from '../config'

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#111113" />
      <path
        d="M11 24V8h6.5a4.5 4.5 0 0 1 0 9H11M17.5 17l5 7"
        stroke="#3dcc7c"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export default function Logo({ children, style }) {
  return (
    <div className="brand" style={style}>
      <LogoMark />
      {APP_NAME}
      {children}
    </div>
  )
}
