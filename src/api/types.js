/**
 * Data shapes shared by the mock layer and the real Python backend.
 * Dates are ISO strings: "yyyy-MM-dd" for days, full ISO for timestamps.
 */

/**
 * @typedef {Object} Business
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {number} price         Selling price in naira
 * @property {number} cost          Cost price in naira
 * @property {number} stock         Units on hand
 * @property {number} reorderLevel  Low-stock threshold
 * @property {number} avgDailyUnits Average units sold per day (last 14 days)
 * @property {number|null} daysLeft Forecast days until stock runs out
 */

/**
 * @typedef {Object} Sale
 * @property {string} id
 * @property {string} date
 * @property {string} productId
 * @property {string} productName
 * @property {string} category
 * @property {number} qty
 * @property {number} unitPrice
 * @property {number} unitCost
 * @property {number} total
 * @property {'cash'|'transfer'|'pos'|'other'} payment
 */

/**
 * @typedef {Object} Metric
 * @property {number} value
 * @property {number|null} delta Percent change vs previous period
 */

/**
 * @typedef {Object} Dashboard
 * @property {{revenue: Metric, profitMargin: Metric, orders: Metric, avgOrderValue: Metric, unitsSold: Metric}} kpis
 * @property {{date: string, label: string, sales: number, returns: number}[]} series
 * @property {{sales: number, returns: number, salesDelta: number|null, returnsDelta: number|null}} totals
 * @property {{name: string, units: number}[]} topProducts
 * @property {{healthy: number, total: number, pct: number, low: number, out: number}} stockHealth
 * @property {{total: number, items: {key: string, label: string, amount: number}[]}} paymentMix
 * @property {{category: string, orders: number, revenue: number}[]} categories
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {'user'|'assistant'} role
 * @property {string} content
 * @property {string} createdAt
 */

/**
 * @typedef {Object} ChatSummary
 * @property {string} id
 * @property {string} title
 * @property {string} updatedAt
 */

/**
 * @typedef {ChatSummary & {messages: ChatMessage[]}} Chat
 */

export {}
