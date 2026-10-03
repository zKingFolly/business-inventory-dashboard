import { CURRENCY } from '../config'

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
})
const nairaPrecise = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
})
const number = new Intl.NumberFormat('en-NG')

export const formatNaira = (value, precise = false) =>
  (precise ? nairaPrecise : naira).format(value || 0)

export const formatNumber = (value) => number.format(value || 0)

export const formatCompactNaira = (value) => {
  const abs = Math.abs(value)
  if (abs >= 1e6) return `₦${(value / 1e6).toFixed(1).replace(/\.0$/, '')}M`
  if (abs >= 1e3) return `₦${(value / 1e3).toFixed(0)}k`
  return `₦${value}`
}

export const formatDelta = (delta) => {
  if (delta === null || delta === undefined) return '–'
  const sign = delta > 0 ? '+' : ''
  return `${sign}${Math.round(delta)}%`
}
