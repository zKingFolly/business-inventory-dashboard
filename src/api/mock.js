import { addDays, differenceInCalendarDays, format, parseISO, subDays } from 'date-fns'
import { formatNaira, formatNumber } from '../lib/format'

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))
const iso = (date) => format(date, 'yyyy-MM-dd')
let uid = 1000
const nextId = (prefix) => `${prefix}_${++uid}`

function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const BUSINESSES = [
  { id: 'b1', name: 'Mama Ngozi Provisions' },
  { id: 'b2', name: 'Lekki Mini Mart' },
]

const CATALOG = [
  ['Indomie Noodles (carton)', 'Groceries', 7800, 6900, 60],
  ['Peak Milk Tin (carton)', 'Groceries', 24500, 21800, 14],
  ['Golden Penny Semo 1kg', 'Groceries', 2300, 1900, 40],
  ['Dangote Sugar 500g', 'Groceries', 1500, 1250, 55],
  ['Power Oil 5L', 'Cooking', 12500, 10900, 12],
  ['Gino Tomato Paste (box)', 'Cooking', 9800, 8600, 18],
  ['Maggi Cubes (pack)', 'Cooking', 1800, 1450, 70],
  ['Coca-Cola 50cl (crate)', 'Beverages', 6200, 5300, 25],
  ['Eva Water 75cl (pack)', 'Beverages', 1800, 1400, 80],
  ['Milo 500g', 'Beverages', 4900, 4200, 9],
  ['Omo Detergent 900g', 'Household', 2700, 2200, 30],
  ['Dettol Soap (pack)', 'Household', 3400, 2800, 6],
]

const PAYMENTS = ['cash', 'transfer', 'pos', 'other']
const PAYMENT_LABELS = { cash: 'Cash', transfer: 'Transfer', pos: 'POS', other: 'Other' }

function seedBusiness(seed) {
  const rand = rng(seed)
  const today = new Date()
  const products = CATALOG.map(([name, category, price, cost, stock], i) => ({
    id: `p_${seed}_${i}`,
    name,
    category,
    price,
    cost,
    stock,
    reorderLevel: Math.max(5, Math.round(stock * 0.25)),
  }))
  const sales = []
  const returns = []
  for (let d = 90; d >= 1; d--) {
    const date = iso(subDays(today, d))
    const weekend = [0, 6].includes(subDays(today, d).getDay())
    const entries = Math.round(8 + rand() * 8 + (weekend ? 5 : 0))
    for (let i = 0; i < entries; i++) {
      const p = products[Math.floor(Math.pow(rand(), 1.6) * products.length)]
      const qty = 1 + Math.floor(rand() * 4)
      const sale = {
        id: nextId('s'),
        date,
        productId: p.id,
        productName: p.name,
        category: p.category,
        qty,
        unitPrice: p.price,
        unitCost: p.cost,
        total: qty * p.price,
        payment: PAYMENTS[Math.floor(Math.pow(rand(), 1.8) * PAYMENTS.length)],
      }
      sales.push(sale)
      if (rand() < 0.05) {
        returns.push({ date, productId: p.id, qty: 1, amount: p.price })
      }
    }
  }
  return { products, sales, returns, chats: seedChats() }
}

function seedChats() {
  const now = new Date()
  const make = (title, daysAgo, q, a) => {
    const at = subDays(now, daysAgo).toISOString()
    return {
      id: nextId('c'),
      title,
      updatedAt: at,
      messages: [
        { id: nextId('m'), role: 'user', content: q, createdAt: at },
        { id: nextId('m'), role: 'assistant', content: a, createdAt: at },
      ],
    }
  }
  return [
    make('Products expected to run out', 0, 'Which products will run out soon?', 'Ask me again for a fresh forecast based on your latest sales.'),
    make('Peak revenue times', 1, 'When do I sell the most?', 'Weekends are usually your strongest days. Ask me for a breakdown by day.'),
    make('Analysis for my future stock', 1, 'What should I restock?', 'Ask me again and I will check your current stock levels.'),
    make('Best sellers this week', 4, 'What are my best sellers?', 'Ask me again for the latest ranking.'),
    make('Checking in on today’s sales', 5, 'How are sales today?', 'Ask me again for the latest numbers.'),
  ]
}

const db = { b1: seedBusiness(11), b2: seedBusiness(29) }

function getDb(businessId) {
  const data = db[businessId]
  if (!data) throw new Error('Business not found')
  return data
}

const inRange = (date, from, to) => date >= from && date <= to
const sum = (items, fn) => items.reduce((acc, item) => acc + fn(item), 0)
const pctChange = (current, previous) => (previous ? ((current - previous) / previous) * 100 : null)

function withForecast(data) {
  const since = iso(subDays(new Date(), 14))
  return data.products.map((p) => {
    const units = sum(
      data.sales.filter((s) => s.productId === p.id && s.date >= since),
      (s) => s.qty,
    )
    const avgDailyUnits = units / 14
    return {
      ...p,
      avgDailyUnits: Math.round(avgDailyUnits * 10) / 10,
      daysLeft: avgDailyUnits > 0 ? Math.floor(p.stock / avgDailyUnits) : null,
    }
  })
}

function periodStats(data, from, to) {
  const sales = data.sales.filter((s) => inRange(s.date, from, to))
  const returns = data.returns.filter((r) => inRange(r.date, from, to))
  const revenue = sum(sales, (s) => s.total)
  const cost = sum(sales, (s) => s.qty * s.unitCost)
  return {
    sales,
    returns,
    revenue,
    profitMargin: revenue ? ((revenue - cost) / revenue) * 100 : 0,
    orders: sales.length,
    avgOrderValue: sales.length ? revenue / sales.length : 0,
    unitsSold: sum(sales, (s) => s.qty),
    returnsAmount: sum(returns, (r) => r.amount),
  }
}

function buildDashboard(data, { from, to }) {
  const days = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1
  const prevTo = iso(subDays(parseISO(from), 1))
  const prevFrom = iso(subDays(parseISO(from), days))
  const cur = periodStats(data, from, to)
  const prev = periodStats(data, prevFrom, prevTo)
  const metric = (key) => ({ value: cur[key], delta: pctChange(cur[key], prev[key]) })

  const series = Array.from({ length: days }, (_, i) => {
    const day = addDays(parseISO(from), i)
    const date = iso(day)
    return {
      date,
      label: format(day, days > 8 ? 'd MMM' : 'EEE'),
      sales: sum(cur.sales.filter((s) => s.date === date), (s) => s.total),
      returns: sum(cur.returns.filter((r) => r.date === date), (r) => r.amount),
    }
  })

  const byProduct = {}
  cur.sales.forEach((s) => {
    byProduct[s.productName] = (byProduct[s.productName] || 0) + s.qty
  })
  const topProducts = Object.entries(byProduct)
    .map(([name, units]) => ({ name, units }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 12)

  const products = data.products
  const out = products.filter((p) => p.stock <= 0).length
  const low = products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length
  const healthy = products.length - out - low

  const paymentMix = PAYMENTS.map((key) => ({
    key,
    label: PAYMENT_LABELS[key],
    amount: sum(cur.sales.filter((s) => s.payment === key), (s) => s.total),
  }))

  const cats = {}
  cur.sales.forEach((s) => {
    cats[s.category] = cats[s.category] || { category: s.category, orders: 0, revenue: 0 }
    cats[s.category].orders += 1
    cats[s.category].revenue += s.total
  })

  return {
    kpis: {
      revenue: metric('revenue'),
      profitMargin: { value: cur.profitMargin, delta: pctChange(cur.profitMargin, prev.profitMargin) },
      orders: metric('orders'),
      avgOrderValue: metric('avgOrderValue'),
      unitsSold: metric('unitsSold'),
    },
    series,
    totals: {
      sales: cur.revenue,
      returns: cur.returnsAmount,
      salesDelta: pctChange(cur.revenue, prev.revenue),
      returnsDelta: pctChange(cur.returnsAmount, prev.returnsAmount),
    },
    topProducts,
    stockHealth: { healthy, total: products.length, pct: products.length ? (healthy / products.length) * 100 : 0, low, out },
    paymentMix: { total: sum(paymentMix, (p) => p.amount), items: paymentMix },
    categories: Object.values(cats).sort((a, b) => b.revenue - a.revenue),
  }
}

function answer(data, text) {
  const q = text.toLowerCase()
  const today = new Date()
  const forecast = withForecast(data)

  if (/(run out|runs out|stock|restock|inventory)/.test(q)) {
    const days = Number((q.match(/(\d+)\s*day/) || [])[1]) || 30
    const soon = forecast
      .filter((p) => p.daysLeft !== null && p.daysLeft <= days)
      .sort((a, b) => a.daysLeft - b.daysLeft)
    if (!soon.length) return `Good news: nothing is forecast to run out in the next ${days} days.`
    return [
      `${soon.length} product${soon.length > 1 ? 's' : ''} will likely run out within ${days} days:`,
      ...soon.map((p) => `• ${p.name}: ${p.stock} left, about ${p.daysLeft} day${p.daysLeft === 1 ? '' : 's'} at ${p.avgDailyUnits} units/day`),
    ].join('\n')
  }
  if (/return/.test(q)) {
    const from = iso(subDays(today, 10))
    const rows = data.returns.filter((r) => r.date >= from)
    if (!rows.length) return 'No returns were recorded in the last 10 days.'
    const byProduct = {}
    rows.forEach((r) => {
      const name = data.products.find((p) => p.id === r.productId)?.name || 'Unknown'
      byProduct[name] = (byProduct[name] || 0) + r.qty
    })
    const top = Object.entries(byProduct).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return ['Most returned in the last 10 days:', ...top.map(([n, c]) => `• ${n}: ${c} return${c > 1 ? 's' : ''}`)].join('\n')
  }
  if (/yesterday/.test(q) || /(sell|sold|sales).*(yesterday)/.test(q)) {
    const date = iso(subDays(today, 1))
    const sales = data.sales.filter((s) => s.date === date)
    if (!sales.length) return 'You did not log any sales yesterday.'
    return `Yesterday you logged ${sales.length} sales worth ${formatNaira(sum(sales, (s) => s.total))} across ${formatNumber(sum(sales, (s) => s.qty))} units.`
  }
  if (/(today)/.test(q)) {
    const sales = data.sales.filter((s) => s.date === iso(today))
    return sales.length
      ? `Today so far: ${sales.length} sales worth ${formatNaira(sum(sales, (s) => s.total))}.`
      : 'No sales have been logged today yet. Add one from the Sales page.'
  }
  if (/(best|top|most|campaign|popular)/.test(q)) {
    const from = iso(subDays(today, 10))
    const by = {}
    data.sales.filter((s) => s.date >= from).forEach((s) => {
      by[s.productName] = (by[s.productName] || 0) + s.qty
    })
    const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return ['Your best sellers over the last 10 days:', ...top.map(([n, u], i) => `${i + 1}. ${n} (${u} units)`)].join('\n')
  }
  if (/(profit|revenue|week|month)/.test(q)) {
    const days = /month/.test(q) ? 30 : 7
    const stats = periodStats(data, iso(subDays(today, days)), iso(subDays(today, 1)))
    return `In the last ${days} days you made ${formatNaira(stats.revenue)} from ${stats.orders} sales, with a profit margin of ${stats.profitMargin.toFixed(1)}%.`
  }
  return 'I can answer questions about your sales, stock levels, returns and best sellers. Try: “What did I sell yesterday?” or “Which products will run out in 30 days?”'
}

export const mockApi = {
  async login({ email }) {
    await delay()
    return { token: 'mock-token', user: { id: 'u1', name: email.split('@')[0] || 'Owner', email } }
  },

  async listBusinesses() {
    await delay(100)
    return BUSINESSES
  },

  async getDashboard(businessId, range) {
    await delay()
    return buildDashboard(getDb(businessId), range)
  },

  async listProducts(businessId) {
    await delay(200)
    return withForecast(getDb(businessId))
  },

  async createProduct(businessId, input) {
    await delay()
    const data = getDb(businessId)
    const product = {
      id: nextId('p'),
      name: input.name.trim(),
      category: input.category,
      price: Number(input.price),
      cost: Number(input.cost),
      stock: Number(input.stock),
      reorderLevel: Number(input.reorderLevel),
    }
    data.products.push(product)
    return product
  },

  async restockProduct(businessId, productId, qty) {
    await delay(200)
    const product = getDb(businessId).products.find((p) => p.id === productId)
    if (!product) throw new Error('Product not found')
    product.stock += Number(qty)
    return product
  },

  async listSales(businessId, { from, to }) {
    await delay(200)
    return getDb(businessId)
      .sales.filter((s) => inRange(s.date, from, to))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  },

  async logSale(businessId, input) {
    await delay()
    const data = getDb(businessId)
    const product = data.products.find((p) => p.id === input.productId)
    if (!product) throw new Error('Product not found')
    const qty = Number(input.qty)
    if (qty > product.stock) throw new Error(`Only ${product.stock} in stock for ${product.name}`)
    product.stock -= qty
    const unitPrice = Number(input.unitPrice)
    const sale = {
      id: nextId('s'),
      date: input.date,
      productId: product.id,
      productName: product.name,
      category: product.category,
      qty,
      unitPrice,
      unitCost: product.cost,
      total: qty * unitPrice,
      payment: input.payment,
    }
    data.sales.push(sale)
    return sale
  },

  async listChats(businessId) {
    await delay(150)
    return getDb(businessId)
      .chats.map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  },

  async getChat(businessId, chatId) {
    await delay(150)
    const chat = getDb(businessId).chats.find((c) => c.id === chatId)
    if (!chat) throw new Error('Chat not found')
    return chat
  },

  async sendMessage(businessId, { chatId, text }) {
    const data = getDb(businessId)
    let chat = chatId && data.chats.find((c) => c.id === chatId)
    const now = new Date().toISOString()
    if (!chat) {
      chat = { id: nextId('c'), title: text.length > 32 ? `${text.slice(0, 32)}…` : text, updatedAt: now, messages: [] }
      data.chats.push(chat)
    }
    const userMessage = { id: nextId('m'), role: 'user', content: text, createdAt: now }
    chat.messages.push(userMessage)
    await delay(700)
    const assistantMessage = { id: nextId('m'), role: 'assistant', content: answer(data, text), createdAt: new Date().toISOString() }
    chat.messages.push(assistantMessage)
    chat.updatedAt = assistantMessage.createdAt
    return { chatId: chat.id, userMessage, assistantMessage }
  },
}
