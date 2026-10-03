import { useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDashboard } from '../api/hooks'
import DateRangeSelect, { useRange } from '../components/DateRangeSelect'
import Gauge from '../components/Gauge'
import { BusinessSwitcher } from '../components/Layout'
import { DeltaBadge, ErrorState, Skeleton } from '../components/ui'
import { formatCompactNaira, formatNaira, formatNumber } from '../lib/format'

function Kpi({ label, metric, render, invert }) {
  return (
    <div className="card">
      <div className="kpi-top">
        <span className="label">{label}</span>
        <DeltaBadge delta={metric.delta} invert={invert} />
      </div>
      <p className="kpi-value">{render(metric.value)}</p>
      <p className="label">vs previous period</p>
    </div>
  )
}

const chartTooltip = {
  contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 },
  labelStyle: { color: 'var(--text-muted)' },
}

const PAY_COLORS = ['var(--warn)', 'var(--accent)', '#4cc3d9', '#9b6bd6']

export default function Dashboard() {
  const [days, setDays] = useState(7)
  const range = useRange(days)
  const { data, isLoading, error, refetch } = useDashboard(range)

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">General metrics</h1>
        <div className="page-actions">
          <DateRangeSelect value={days} onChange={setDays} />
          <BusinessSwitcher />
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <>
          <div className="grid-kpi">
            {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={120} />)}
          </div>
          <Skeleton height={320} />
        </>
      ) : (
        <>
          <section className="grid-kpi" aria-label="Key metrics">
            <Kpi label="Revenue" metric={data.kpis.revenue} render={formatNaira} />
            <Kpi label="Profit margin" metric={data.kpis.profitMargin} render={(v) => `${v.toFixed(1)}%`} />
            <Kpi label="Sales logged" metric={data.kpis.orders} render={formatNumber} />
            <Kpi label="Avg. sale value" metric={data.kpis.avgOrderValue} render={formatNaira} />
            <Kpi label="Units sold" metric={data.kpis.unitsSold} render={formatNumber} />
          </section>

          <section className="grid-main">
            <div className="card">
              <div className="card-head">
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 500 }}>Sales &amp; returns</h2>
                  <p className="label">
                    Sales {data.totals.salesDelta >= 0 ? 'up' : 'down'} {Math.abs(Math.round(data.totals.salesDelta ?? 0))}% vs previous period
                  </p>
                </div>
                <div className="big-figures">
                  <div className="big-figure">
                    <p className="label"><span className="legend-dot" style={{ background: 'var(--accent)' }} />Total sales</p>
                    <p className="mono">{formatCompactNaira(data.totals.sales)}</p>
                  </div>
                  <div className="big-figure">
                    <p className="label"><span className="legend-dot" style={{ background: 'var(--series-muted)' }} />Returns</p>
                    <p className="mono">{formatCompactNaira(data.totals.returns)}</p>
                  </div>
                </div>
              </div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} minTickGap={16} />
                    <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={formatCompactNaira} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip {...chartTooltip} formatter={(v, name) => [formatNaira(v), name]} />
                    <Area type="monotone" dataKey="returns" name="Returns" stroke="var(--series-muted)" strokeWidth={2} fill="none" />
                    <Area type="monotone" dataKey="sales" name="Sales" stroke="var(--accent)" strokeWidth={2} fill="url(#fillSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 500 }}>Top products</h2>
                  <p className="label">Units sold in this period</p>
                </div>
              </div>
              {data.topProducts.length === 0 ? (
                <p className="label">No sales in this period.</p>
              ) : (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topProducts.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 12 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(n) => (n.length > 18 ? `${n.slice(0, 17)}…` : n)} />
                      <Tooltip {...chartTooltip} cursor={{ fill: 'transparent' }} formatter={(v) => [`${v} units`, 'Sold']} />
                      <Bar dataKey="units" radius={4} barSize={14}>
                        {data.topProducts.slice(0, 6).map((_, i) => (
                          <Cell key={i} fill={i === 0 ? 'var(--accent)' : 'var(--bar-muted)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          <section className="grid-bottom">
            <div className="card">
              <h2 style={{ fontSize: 14, fontWeight: 500 }}>Stock health</h2>
              <div className="gauge-wrap">
                <Gauge pct={data.stockHealth.pct} />
                <div className="gauge-center">
                  <p className="mono">{data.stockHealth.healthy}/{data.stockHealth.total}</p>
                  <p className="label">products well stocked</p>
                </div>
              </div>
              <p className="label" style={{ marginTop: 12 }}>
                {data.stockHealth.low} low · {data.stockHealth.out} out of stock
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 14, fontWeight: 500 }}>Payment methods</h2>
              <p className="mono" style={{ fontSize: 22, marginTop: 8 }}>{formatNaira(data.paymentMix.total)}</p>
              <div className="stack-bar" aria-hidden="true">
                {data.paymentMix.items.map((p, i) => (
                  <span key={p.key} style={{ width: `${data.paymentMix.total ? (p.amount / data.paymentMix.total) * 100 : 0}%`, background: PAY_COLORS[i] }} />
                ))}
              </div>
              <div className="legend-row">
                {data.paymentMix.items.map((p, i) => (
                  <div key={p.key}>
                    <span><span className="legend-dot" style={{ background: PAY_COLORS[i] }} />{p.label}</span>
                    <span className="mono">{formatCompactNaira(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Sales by category</h2>
              <table className="table">
                <thead>
                  <tr><th>Category</th><th className="num">Sales</th><th className="num">Revenue</th></tr>
                </thead>
                <tbody>
                  {data.categories.map((c) => (
                    <tr key={c.category}>
                      <td>{c.category}</td>
                      <td className="num">{c.orders}</td>
                      <td className="num">{formatNaira(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
