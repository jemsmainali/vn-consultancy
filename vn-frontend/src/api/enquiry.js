const configuredApiBase = import.meta.env.VITE_API_URL?.trim()
export const enquiryEndpoint = configuredApiBase
  ? new URL('/enquiries', configuredApiBase).toString()
  : '/api/enquiries'

// Pydantic prefixes custom validator messages with "Value error, ".
const cleanMessage = (message) => String(message || '').replace(/^Value error,\s*/i, '')

export async function submitEnquiry(payload) {
  let response
  try {
    response = await fetch(enquiryEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (cause) {
    console.error(`Could not reach ${enquiryEndpoint}. Set VITE_API_URL to the enquiry API base or configure the /api/enquiries proxy.`, cause)
    throw new Error('We could not reach our server. Check your connection and try again.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = data?.detail
    const message = response.status === 429
      ? 'Too many enquiries were sent from this device. Please wait a minute and try again.'
      : typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => cleanMessage(item.msg)).join(', ')
          : 'Your enquiry could not be sent. Please try again.'
    const error = new Error(message)
    error.status = response.status
    error.fields = Array.isArray(detail)
      ? Object.fromEntries(detail.filter((item) => item.loc?.length).map((item) => [item.loc[item.loc.length - 1], cleanMessage(item.msg)]))
      : {}
    throw error
  }
  return data
}
