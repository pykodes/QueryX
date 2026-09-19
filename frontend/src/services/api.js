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

/**
 * Submit natural language query to backend
 */
export async function askQuestion(question, provider = null) {
  return request('/api/ask', {
    method: 'POST',
    body: JSON.stringify({
      question,
      provider: provider || undefined,
    }),
  })
}

/**
 * Fetch database schema information
 */
export async function getSchema() {
  return request('/api/schema')
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
  askQuestion,
  getSchema,
  uploadDataset,
  API_BASE_URL,
}
