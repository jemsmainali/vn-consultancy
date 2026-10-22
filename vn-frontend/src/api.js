export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const PUBLIC_ROUTES = new Set([
  '/', '/about', '/destinations', '/journey', '/faqs', '/contact', '/privacy',
  '/login', '/register', '/verify', '/forgot-password', '/reset-password', '/terms',
])

const send = (path, opts = {}) => {
  const headers = { ...(opts.headers || {}) }
  let body = opts.body
  if (opts.json) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.json) }
  // credentials: 'include' is what makes the browser send/accept the httpOnly cookies
  return fetch(API_BASE + path, { method: opts.method, headers, body, credentials: 'include' })
}

// Normal JSON in/out. The cookie carries the token automatically; refreshes once on 401.
export async function api(path, opts = {}) {
  let res = await send(path, opts)
  if (res.status === 401 && path !== '/auth/refresh') {
    const r = await send('/auth/refresh', { method: 'POST' })
    if (r.ok) {
      res = await send(path, opts)
    } else if (path !== '/auth/me' && !PUBLIC_ROUTES.has(window.location.pathname)) {
      window.location.href = '/login'
    }
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const d = data?.detail
    const error = new Error(typeof d === 'string' ? d : Array.isArray(d) ? d.map((x) => x.msg).join(', ') : 'Something went wrong')
    error.status = res.status
    error.fieldErrors = Array.isArray(d)
      ? Object.fromEntries(d.filter((item) => item.loc?.length).map((item) => [item.loc[item.loc.length - 1], item.msg]))
      : {}
    throw error
  }
  return data
}

export const logout = () => api('/auth/logout', { method: 'POST' })

export async function openDocument(id) {
  const w = window.open('', '_blank') // open the tab first so the browser doesn't block it
  try {
    const res = await fetch(API_BASE + `/documents/${id}/file`, { credentials: 'include' })
    if (!res.ok) throw new Error('Could not open the file')
    w.location = URL.createObjectURL(await res.blob())
  } catch (e) {
    w.close()
    throw e
  }
}

export async function fetchMyPhoto() {
  try {
    const res = await fetch(API_BASE + '/auth/me/photo', { credentials: 'include' })
    if (!res.ok) return null
    return URL.createObjectURL(await res.blob())
  } catch {
    return null
  }
}

export const updateProfile = (data) => api('/auth/me', { method: 'PATCH', json: data })

export function uploadProfilePhoto(file) {
  const formData = new FormData()
  formData.append('photo', file)
  return api('/auth/me/photo', { method: 'POST', body: formData })
}

// --- Upload with real progress events (fetch doesn't reliably expose upload progress) ---

function xhrUpload(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', API_BASE + path)
    xhr.withCredentials = true // carries the httpOnly cookies, same as fetch's credentials:'include'

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      let data = null
      try { data = JSON.parse(xhr.responseText) } catch { /* non-JSON response, leave data null */ }
      resolve({ status: xhr.status, data })
    }
    xhr.onerror = () => reject(new Error('Network error during upload. Check your connection and try again.'))
    xhr.send(formData)
  })
}

/**
 * Upload a FormData payload with progress callbacks, cookie auth, and the
 * same 401-refresh-then-retry behavior as api(). onProgress receives 0-100.
 */
export async function uploadWithProgress(path, formData, onProgress) {
  let res = await xhrUpload(path, formData, onProgress)

  if (res.status === 401) {
    const r = await send('/auth/refresh', { method: 'POST' })
    if (r.ok) {
      res = await xhrUpload(path, formData, onProgress)
    } else {
      if (window.location.pathname !== '/login') window.location.href = '/login'
      throw new Error('Your session expired. Please sign in again.')
    }
  }

  if (res.status < 200 || res.status >= 300) {
    const d = res.data?.detail
    throw new Error(typeof d === 'string' ? d : Array.isArray(d) ? d.map((x) => x.msg).join(', ') : 'Upload failed')
  }
  return res.data
}
