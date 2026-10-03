import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import { useLogSale, useProducts, useSales } from '../api/hooks'
import DateRangeSelect, { useRange } from '../components/DateRangeSelect'
import { BusinessSwitcher } from '../components/Layout'
import { EmptyState, ErrorState, Field, Modal, Skeleton } from '../components/ui'
import { formatNaira } from '../lib/format'

const PAYMENT_LABELS = { cash: 'Cash', transfer: 'Transfer', pos: 'POS', other: 'Other' }

function LogSaleModal({ onClose }) {
  const { data: products = [] } = useProducts()
  const mutation = useLogSale()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: { productId: '', qty: 1, unitPrice: '', payment: 'cash', date: format(new Date(), 'yyyy-MM-dd') },
  })
  const selected = products.find((p) => p.id === watch('productId'))

  const onSubmit = async (values) => {
    setServerError('')
    try {
      await mutation.mutateAsync(values)
      onClose()
    } catch (e) {
      setServerError(e.message)
    }
  }

  return (
    <Modal title="Log a sale" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="form-grid">
        {serverError && <p className="banner full" role="alert">{serverError}</p>}
        <div className="full">
          <Field label="Product" error={errors.productId?.message}>
            <select
              className="input"
              {...register('productId', {
                required: 'Choose a product',
                onChange: (e) => {
                  const p = products.find((x) => x.id === e.target.value)
                  if (p) setValue('unitPrice', p.price)
                },
              })}
            >
              <option value="">Select…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name} ({p.stock} in stock)
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Quantity" error={errors.qty?.message}>
          <input
            className="input"
            type="number"
            min="1"
            {...register('qty', {
              required: 'Required',
              valueAsNumber: true,
              min: { value: 1, message: 'At least 1' },
              validate: (v) => !selected || v <= selected.stock || `Only ${selected.stock} in stock`,
            })}
          />
        </Field>
        <Field label="Unit price (₦)" error={errors.unitPrice?.message}>
          <input
            className="input"
            type="number"
            min="0"
            {...register('unitPrice', { required: 'Required', valueAsNumber: true, min: { value: 0, message: 'Invalid' } })}
          />
        </Field>
        <Field label="Payment">
          <select className="input" {...register('payment')}>
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Date" error={errors.date?.message}>
          <input className="input" type="date" {...register('date', { required: 'Required' })} />
        </Field>
        <div className="modal-actions full">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save sale'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Sales() {
  const [days, setDays] = useState(30)
  const [open, setOpen] = useState(false)
  const range = useRange(days)
  const { data, isLoading, error, refetch } = useSales(range)

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Sales</h1>
        <div className="page-actions">
          <DateRangeSelect value={days} onChange={setDays} />
          <BusinessSwitcher />
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={14} aria-hidden="true" /> Log sale
          </button>
        </div>
      </div>

      <div className="card">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <Skeleton height={300} />
        ) : data.length === 0 ? (
          <EmptyState title="No sales in this period" hint="Log your first sale to see it here." />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th className="num">Qty</th>
                  <th className="num">Unit price</th>
                  <th className="num">Total</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 200).map((s) => (
                  <tr key={s.id}>
                    <td>{format(parseISO(s.date), 'd MMM yyyy')}</td>
                    <td>{s.productName}</td>
                    <td className="num">{s.qty}</td>
                    <td className="num">{formatNaira(s.unitPrice)}</td>
                    <td className="num">{formatNaira(s.total)}</td>
                    <td>{PAYMENT_LABELS[s.payment] || s.payment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 200 && <p className="label" style={{ paddingTop: 12 }}>Showing latest 200 of {data.length} sales.</p>}
          </div>
        )}
      </div>

      {open && <LogSaleModal onClose={() => setOpen(false)} />}
    </div>
  )
}
