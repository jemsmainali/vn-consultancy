// Shared research metadata for destination content.
// Update researchDate, the rates and every country's `sources` together when content is re-checked.

export const researchDate = '30 October 2026'

// Nepal Rastra Bank published foreign exchange rates for 2026-10-30 (selling rates, NPR per 1 unit).
// NZD is not published by NRB, so it is derived from the NRB EUR rate and the ECB EUR/NZD
// reference rate of 2026-10-29 (170.09 / 1.9817).
export const exchangeRates = {
  date: '30 October 2026',
  source: { label: 'Nepal Rastra Bank – Foreign exchange rates', url: 'https://www.nrb.org.np/forex/' },
  crossSource: { label: 'European Central Bank – Euro reference rates (29 Oct 2026)', url: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html' },
  npr: { AUD: 107.39, USD: 152.72, GBP: 203.32, CAD: 109.12, EUR: 170.09, JPY: 0.967, KRW: 0.1142, NZD: 85.83 },
}

const symbols = { AUD: 'AUD', USD: 'USD', GBP: '£', CAD: 'CAD', EUR: '€', JPY: '¥', KRW: '₩', NZD: 'NZD' }

const groupNepali = (value) => {
  const digits = String(Math.round(value))
  if (digits.length <= 3) return digits
  const last3 = digits.slice(-3)
  return `${digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`
}

export function formatLocal(amount, currency) {
  const symbol = symbols[currency] || currency
  const value = amount.toLocaleString('en-US')
  return /^[A-Z]{3}$/.test(symbol) ? `${symbol} ${value}` : `${symbol}${value}`
}

// Approximate NPR in lakh/crore, the way families in Nepal usually discuss budgets.
export function formatNprValue(npr) {
  if (npr >= 1e7) return `NPR ${(npr / 1e7).toFixed(2).replace(/\.?0+$/, '')} crore`
  if (npr >= 1e5) return `NPR ${(npr / 1e5).toFixed(1).replace(/\.0$/, '')} lakh`
  return `NPR ${groupNepali(Math.round(npr / 100) * 100)}`
}

export function formatNpr(amount, currency) {
  const rate = exchangeRates.npr[currency]
  return rate ? formatNprValue(amount * rate) : ''
}

export function formatRange([min, max], currency) {
  return min === max ? formatLocal(min, currency) : `${formatLocal(min, currency)} – ${formatLocal(max, currency)}`
}

export function formatNprRange([min, max], currency) {
  if (min === max) return `≈ ${formatNpr(min, currency)}`
  return `≈ ${formatNpr(min, currency).replace(/^NPR /, 'NPR ')} – ${formatNpr(max, currency).replace(/^NPR /, '')}`
}

// Labels used to mark how certain a statement is.
export const claimTypes = {
  official: { label: 'Official requirement', detail: 'Published by a government or official body. Check the linked source for the current version.' },
  estimate: { label: 'Estimate', detail: 'Indicative range from published institution fees and typical costs. Your actual costs depend on the course, city and lifestyle.' },
  'institution-specific': { label: 'Varies by institution', detail: 'Set by each university or college. Check the institution’s own page for your course.' },
  verify: { label: 'Check before relying on this', detail: 'Recently changed, disputed or not confirmed on an official page during our research.' },
}
