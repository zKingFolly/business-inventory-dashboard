import { useMemo } from 'react'
import { format, subDays } from 'date-fns'

export const RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]

export function useRange(days) {
  return useMemo(() => {
    const today = new Date()
    return {
      from: format(subDays(today, days - 1), 'yyyy-MM-dd'),
      to: format(today, 'yyyy-MM-dd'),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, new Date().toDateString()])
}

export default function DateRangeSelect({ value, onChange }) {
  return (
    <>
      <label className="sr-only" htmlFor="range">
        Date range
      </label>
      <select id="range" className="select" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {RANGES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </>
  )
}
