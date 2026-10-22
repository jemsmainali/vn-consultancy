const configuredApiBase = import.meta.env.VITE_API_URL?.trim()
export const enquiryEndpoint = configuredApiBase
  ? new URL('/enquiries', configuredApiBase).toString()
  : '/api/enquiries'

export async function submitEnquiry(payload) {
  let response
  try {
    response = await fetch(enquiryEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(`Could not reach ${enquiryEndpoint}. Set VITE_API_URL to the enquiry API base or configure the /api/enquiries proxy.`)
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = data?.detail
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => item.msg).join(', ')
        : 'Your enquiry could not be sent. Please try again.'
    const error = new Error(message)
    error.fields = Array.isArray(detail)
      ? Object.fromEntries(detail.filter((item) => item.loc?.length).map((item) => [item.loc[item.loc.length - 1], item.msg]))
      : {}
    throw error
  }
  return data
}
