import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus } from 'lucide-react'
import { useCreateProduct, useProducts, useRestock } from '../api/hooks'
import { BusinessSwitcher } from '../components/Layout'
import { EmptyState, ErrorState, Field, Modal, Skeleton } from '../components/ui'
import { formatNaira } from '../lib/format'

function stockStatus(p) {
  if (p.stock <= 0) return { label: 'Out of stock', cls: 'badge-bad' }
  if (p.stock <= p.reorderLevel) return { label: 'Low', cls: 'badge-warn' }
  return { label: 'In stock', cls: 'badge-ok' }
}

function ProductModal({ onClose }) {
  const mutation = useCreateProduct()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { name: '', category: '', price: '', cost: '', stock: 0, reorderLevel: 5 } })

  const num = { valueAsNumber: true, min: { value: 0, message: 'Cannot be negative' } }
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
    <Modal title="Add product" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="form-grid">
        {serverError && <p className="banner full" role="alert">{serverError}</p>}
        <div className="full">
          <Field label="Name" error={errors.name?.message}>
            <input className="input" {...register('name', { required: 'Enter a name', validate: (v) => !!v.trim() || 'Enter a name' })} />
          </Field>
        </div>
        <Field label="Category" error={errors.category?.message}>
          <input className="input" {...register('category', { required: 'Required' })} />
        </Field>
        <Field label="Opening stock" error={errors.stock?.message}>
          <input className="input" type="number" {...register('stock', { required: 'Required', ...num })} />
        </Field>
        <Field label="Selling price (₦)" error={errors.price?.message}>
          <input className="input" type="number" {...register('price', { required: 'Required', ...num })} />
        </Field>
        <Field label="Cost price (₦)" error={errors.cost?.message}>
          <input className="input" type="number" {...register('cost', { required: 'Required', ...num })} />
        </Field>
        <div className="full">
          <Field label="Reorder level" error={errors.reorderLevel?.message}>
            <input className="input" type="number" {...register('reorderLevel', { required: 'Required', ...num })} />
          </Field>
        </div>
        <div className="modal-actions full">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Add product'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function RestockModal({ product, onClose }) {
  const mutation = useRestock()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { qty: 10 } })

  const onSubmit = async ({ qty }) => {
    setServerError('')
    try {
      await mutation.mutateAsync({ productId: product.id, qty })
      onClose()
    } catch (e) {
      setServerError(e.message)
    }
  }

  return (
    <Modal title={`Restock ${product.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {serverError && <p className="banner" role="alert">{serverError}</p>}
        <p className="label">Currently {product.stock} in stock.</p>
        <Field label="Units received" error={errors.qty?.message}>
          <input className="input" type="number" {...register('qty', { required: 'Required', valueAsNumber: true, min: { value: 1, message: 'At least 1' } })} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Add stock'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Inventory() {
  const { data, isLoading, error, refetch } = useProducts()
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [restocking, setRestocking] = useState(null)

  const rows = (data || []).filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Inventory</h1>
        <div className="page-actions">
          <BusinessSwitcher />
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <Plus size={14} aria-hidden="true" /> Add product
          </button>
        </div>
      </div>

      <div className="toolbar">
        <label className="sr-only" htmlFor="search">Search products</label>
        <input id="search" className="input" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="card">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <Skeleton height={300} />
        ) : rows.length === 0 ? (
          <EmptyState title={query ? 'No products match your search' : 'No products yet'} hint={query ? undefined : 'Add your first product to start tracking stock.'} />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="num">Price</th>
                  <th className="num">Stock</th>
                  <th className="num">Runs out in</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const status = stockStatus(p)
                  return (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td className="num">{formatNaira(p.price)}</td>
                      <td className="num">{p.stock}</td>
                      <td className="num">{p.daysLeft === null ? '–' : `${p.daysLeft} days`}</td>
                      <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                      <td>
                        <div className="table-actions">
                          <button className="btn" onClick={() => setRestocking(p)}>Restock</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adding && <ProductModal onClose={() => setAdding(false)} />}
      {restocking && <RestockModal product={restocking} onClose={() => setRestocking(null)} />}
    </div>
  )
}
