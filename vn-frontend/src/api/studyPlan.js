import { api } from '../api'

export const fetchDirectory = () => api('/directory/universities')
export const fetchStudyPlan = () => api('/study-plan/me')
export const updateStudyPlan = (data) => api('/study-plan/me', { method: 'PATCH', json: data })
export const saveItem = (kind, ref) => api('/study-plan/me/saved', { method: 'POST', json: { kind, ref } })
export const removeSavedItem = (id) => api(`/study-plan/me/saved/${id}`, { method: 'DELETE' })

export const LEVEL_LABEL = {
  foundation: 'Foundation', diploma: 'Diploma', bachelor: 'Bachelor’s', master: 'Master’s', doctorate: 'Doctorate',
}

// Directory dates are plain calendar dates; format in UTC so they never shift a day.
export const formatDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export const courseRef = (university, course) => `${university.id}/${course.id}`

// Maps saved refs back to directory entries; an entry missing from the directory resolves to null.
export function resolveRef(universities, kind, ref) {
  const [universityId, courseId] = ref.split('/')
  const university = universities.find((item) => item.id === universityId)
  if (!university) return null
  if (kind === 'university') return { university }
  const course = university.courses.find((item) => item.id === courseId)
  return course ? { university, course } : null
}
