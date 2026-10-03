import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Field } from '../components/ui'
import Logo from '../components/Logo'
import { isMock } from '../api'

export default function Login() {
  const { user, login } = useApp()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } })

  if (user) return <Navigate to="/" replace />

  const onSubmit = async (values) => {
    setError('')
    try {
      await login(values)
    } catch (e) {
      setError(e.message || 'Could not sign in')
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Logo style={{ padding: 0 }} />
        <div>
          <h1 className="page-title">Sign in</h1>
          <p className="label">Track stock and sales, and ask Bimpe AI about your business.</p>
        </div>
        {isMock && <p className="banner banner-info">Demo mode: any email and password will work.</p>}
        {error && (
          <p className="banner" role="alert">
            {error}
          </p>
        )}
        <Field label="Email" error={errors.email?.message}>
          <input
            className="input"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email', {
              required: 'Enter your email',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password', { required: 'Enter your password' })}
          />
        </Field>
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
