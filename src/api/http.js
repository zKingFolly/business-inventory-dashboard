import { API_BASE_URL } from '../config'
import {
  validateChat,
  validateChats,
  validateDashboard,
  validateProducts,
  validateSales,
  expectArray,
  expectObject,
} from '../lib/validate'

export const TOKEN_KEY = 'kobo-token'

async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v))
  const token = localStorage.getItem(TOKEN_KEY)
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    window.dispatchEvent(new Event('kobo:unauthorized'))
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const err = await res.json()
      message = err.detail || err.message || message
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message)
  }
  return res.status === 204 ? null : res.json()
}

const b = (id) => `/api/businesses/${id}`

/** Real backend client. Endpoints follow the contract documented in README. */
export const httpApi = {
  login: async (creds) => {
    const data = await request('/api/auth/login', { method: 'POST', body: creds })
    expectObject(data, 'login', ['token', 'user'])
    return data
  },
  listBusinesses: async () => expectArray(await request('/api/businesses'), 'businesses'),
  getDashboard: async (id, range) => validateDashboard(await request(`${b(id)}/dashboard`, { params: range })),
  listProducts: async (id) => validateProducts(await request(`${b(id)}/products`)),
  createProduct: (id, input) => request(`${b(id)}/products`, { method: 'POST', body: input }),
  restockProduct: (id, productId, qty) =>
    request(`${b(id)}/products/${productId}/restock`, { method: 'POST', body: { qty } }),
  listSales: async (id, range) => validateSales(await request(`${b(id)}/sales`, { params: range })),
  logSale: (id, input) => request(`${b(id)}/sales`, { method: 'POST', body: input }),
  listChats: async (id) => validateChats(await request(`${b(id)}/chats`)),
  getChat: async (id, chatId) => validateChat(await request(`${b(id)}/chats/${chatId}`)),
  sendMessage: (id, { chatId, text }) =>
    request(`${b(id)}/chat`, { method: 'POST', body: { chatId, message: text } }),
}
