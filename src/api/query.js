import { useCallback, useEffect, useRef, useState } from 'react'

const STALE_MS = 30_000
const cache = new Map()
const listeners = new Set()

const keyOf = (key) => JSON.stringify(key)

export function invalidate(prefix) {
  const head = JSON.stringify(prefix).slice(0, -1)
  for (const k of [...cache.keys()]) if (k.startsWith(head)) cache.delete(k)
  listeners.forEach((fn) => fn(head))
}

export function clearCache() {
  cache.clear()
  listeners.forEach((fn) => fn(''))
}

export function useQuery(key, fn, enabled = true) {
  const id = keyOf(key)
  const fnRef = useRef(fn)
  fnRef.current = fn
  const cached = cache.get(id)
  const [state, setState] = useState({
    data: cached?.data,
    error: null,
    isLoading: enabled && !cached,
  })

  const load = useCallback(
    async (force) => {
      const hit = cache.get(id)
      if (!force && hit && Date.now() - hit.at < STALE_MS) {
        setState({ data: hit.data, error: null, isLoading: false })
        return
      }
      setState((s) => ({ ...s, isLoading: !hit, error: null }))
      try {
        const data = await fnRef.current()
        cache.set(id, { data, at: Date.now() })
        setState({ data, error: null, isLoading: false })
      } catch (error) {
        setState((s) => ({ ...s, error, isLoading: false }))
      }
    },
    [id],
  )

  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    const run = (force) => active && load(force)
    run(false)
    const onInvalidate = (head) => {
      if (head === '' || id.startsWith(head)) run(true)
    }
    listeners.add(onInvalidate)
    return () => {
      active = false
      listeners.delete(onInvalidate)
    }
  }, [id, enabled, load])

  return { ...state, refetch: () => load(true) }
}

export function useMutation(fn, onSuccess) {
  const [state, setState] = useState({ isPending: false, error: null })
  const fnRef = useRef(fn)
  fnRef.current = fn
  const successRef = useRef(onSuccess)
  successRef.current = onSuccess

  const mutateAsync = useCallback(async (input) => {
    setState({ isPending: true, error: null })
    try {
      const result = await fnRef.current(input)
      setState({ isPending: false, error: null })
      successRef.current?.(result)
      return result
    } catch (error) {
      setState({ isPending: false, error })
      throw error
    }
  }, [])

  return {
    mutateAsync,
    mutate: (input) => mutateAsync(input).catch(() => {}),
    isPending: state.isPending,
    isError: !!state.error,
    error: state.error,
  }
}
