import { useEffect, useRef } from 'react'
import { AlertTriangle, Inbox } from 'lucide-react'
import { formatDelta } from '../lib/format'

export function DeltaBadge({ delta, invert = false }) {
  if (delta === null || delta === undefined) return <span className="badge">–</span>
  const good = invert ? delta < 0 : delta >= 0
  return <span className={`badge ${good ? 'badge-up' : 'badge-down'}`}>{formatDelta(delta)}</span>
}

export function Skeleton({ height = 80, style }) {
  return <div className="skeleton" style={{ height, ...style }} aria-hidden="true" />
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state card" role="alert">
      <AlertTriangle size={20} aria-hidden="true" />
      <p>{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="state">
      <Inbox size={20} aria-hidden="true" />
      <p style={{ color: 'var(--text)' }}>{title}</p>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const previous = document.activeElement
    ref.current?.querySelector('input, select, button')?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
