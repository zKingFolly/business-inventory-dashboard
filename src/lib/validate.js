/**
 * Light runtime checks for API responses. Each helper throws a descriptive
 * error if the backend returns something the UI cannot render.
 */

const fail = (what, detail) => {
  throw new Error(`Unexpected API response for ${what}: ${detail}`)
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

export function expectArray(value, what) {
  if (!Array.isArray(value)) fail(what, 'expected an array')
  return value
}

export function expectObject(value, what, requiredKeys = []) {
  if (!isObject(value)) fail(what, 'expected an object')
  for (const key of requiredKeys) {
    if (!(key in value)) fail(what, `missing "${key}"`)
  }
  return value
}

export const validateProducts = (data) =>
  expectArray(data, 'products').map((p) =>
    expectObject(p, 'product', ['id', 'name', 'stock', 'price']),
  )

export const validateSales = (data) =>
  expectArray(data, 'sales').map((s) => expectObject(s, 'sale', ['id', 'date', 'total']))

export const validateDashboard = (data) =>
  expectObject(data, 'dashboard', ['kpis', 'series', 'topProducts', 'stockHealth', 'paymentMix', 'categories'])

export const validateChats = (data) =>
  expectArray(data, 'chats').map((c) => expectObject(c, 'chat', ['id', 'title', 'updatedAt']))

export const validateChat = (data) => expectObject(data, 'chat', ['id', 'messages'])
