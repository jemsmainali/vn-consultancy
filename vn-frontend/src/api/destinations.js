import { api } from '../api'

// Preview fields only (slug, name, currency, summary, lastVerified) – no sign-in needed.
export const getDestinationPreviews = () => api('/destinations/preview')

// Full guides need a signed-in student or staff account; anonymous requests get 401.
export const getDestinationGuide = (slug) => api(`/destinations/${encodeURIComponent(slug)}`)
export const compareDestinationGuides = (slugs) => api(`/destinations/compare?slugs=${slugs.map(encodeURIComponent).join(',')}`)
