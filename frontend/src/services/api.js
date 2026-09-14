/**
 * api.js — Service layer for Agentic RAG backend calls.
 * All network logic lives here; components never call fetch directly.
 */

const BASE_URL = '/api'

/**
 * Send a question to the Agentic RAG backend.
 *
 * @param {string} question  The user's question text.
 * @returns {Promise<{
 *   answer: string,
 *   source_used: string,
 *   nodes_visited: string[],
 *   retry_count: number,
 *   steps: Array<{ node: string, status: string }>
 * }>}
 */
export async function sendQuestion(question) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })

  if (!res.ok) {
    let errMsg = `Server error ${res.status}`
    try {
      const errBody = await res.json()
      errMsg = errBody.detail || errMsg
    } catch (_) { /* ignore parse errors */ }
    throw new Error(errMsg)
  }

  return res.json()
}

/**
 * Check if the backend is ready.
 * @returns {Promise<{ status: string, message: string }>}
 */
export async function checkHealth() {
  const res = await fetch('/health')
  if (!res.ok) throw new Error('Backend not ready')
  return res.json()
}
