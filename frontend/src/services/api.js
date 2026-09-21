/**
 * QueryX Frontend API Client
 *
 * Configured to connect seamlessly to the FastAPI backend.
 *
 * Flow:
 * 1. If VITE_API_BASE_URL is set in .env (e.g., http://127.0.0.1:8000), it targets the backend directly via CORS.
 * 2. If VITE_API_BASE_URL is not set (default), it uses relative path '/api' which Vite's dev server proxies
 *    directly to http://127.0.0.1:8000.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Helper to perform fetch with consistent error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data.error || data.detail || `Server returned ${response.status} (${response.statusText})`
      const error = new Error(message)
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to QueryX backend at ${API_BASE_URL || 'http://127.0.0.1:8000'}. Please ensure FastAPI is running in your backend terminal.`
      )
    }
    throw err
  }
}

/**
 * Check backend and database health
 */
export async function checkHealth() {
  return request('/api/health')
}

/**
 * Fetch sample questions to prompt the user
 */
export async function getSampleQuestions() {
  return request('/api/sample-questions')
}

export async function getDatabases(userId) {
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
  return request(`/api/databases${query}`)
}

export async function uploadDatabase(file, userId) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('user_id', String(userId))
  const response = await fetch(`${API_BASE_URL}/api/databases/upload`, {
    method: 'POST',
    body: formData,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || `Database upload failed (${response.status})`)
  return data
}

/**
/**
 * Register user in database
 */
export async function registerUser(fullName, email, password) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password }),
  })
}

/**
 * Login user
 */
export async function loginUser(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/**
 * Fetch stored query history for user
 */
export async function getQueryHistory(userId, userEmail = null) {
  const params = new URLSearchParams()
  if (userId) params.set('user_id', userId)
  if (userEmail) params.set('user_email', userEmail)
  return request(`/api/history?${params.toString()}`)
}

/**
 * Submit natural language query to backend
 */
export async function askQuestion(question, provider = null, userId = null, userEmail = null, databaseId = 'sample') {
  return request('/api/ask', {
    method: 'POST',
    body: JSON.stringify({
      question,
      provider: provider || undefined,
      user_id: userId || undefined,
      user_email: userEmail || undefined,
      database_id: databaseId,
    }),
  })
}

/**
 * Fetch database schema information
 */
export async function getSchema(databaseId = 'sample', userId = null) {
  const params = new URLSearchParams({ database_id: String(databaseId) })
  if (userId) params.set('user_id', String(userId))
  return request(`/api/schema?${params.toString()}`)
}

/**
 * Upload a CSV dataset to the backend
 */
export async function uploadDataset(file) {
  const formData = new FormData()
  formData.append('file', file)

  const url = `${API_BASE_URL}/api/upload`

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message =
        data.error ||
        data.detail ||
        `Server returned ${response.status} (${response.statusText})`

      const error = new Error(message)
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to QueryX backend at ${
          API_BASE_URL || 'http://127.0.0.1:8000'
        }. Please ensure FastAPI is running.`
      )
    }

    throw err
  }
}

export default {
  checkHealth,
  getSampleQuestions,
  getDatabases,
  uploadDatabase,
  askQuestion,
  getSchema,
  uploadDataset,
  registerUser,
  loginUser,
  getQueryHistory,
  API_BASE_URL,
}
