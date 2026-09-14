/**
 * useAgenticRAG.js
 * Central state management hook for the Agentic RAG chat interface.
 * Owns: messages, workflowSteps, loading state, error state, and chat actions.
 */

import { useState, useCallback, useRef } from 'react'
import { sendQuestion } from '../services/api'

/**
 * @typedef {Object} ChatMessage
 * @property {string} id         - Unique identifier
 * @property {'user'|'assistant'} role
 * @property {string} content    - Message text (markdown allowed for assistant)
 * @property {number} timestamp  - Unix ms
 * @property {string} [sourceUsed]
 * @property {string[]} [nodesVisited]
 * @property {number} [retryCount]
 * @property {Array<{node: string, status: string}>} [steps]
 */

/**
 * @typedef {Object} WorkflowExecution
 * @property {string[]} nodesVisited
 * @property {string} sourceUsed
 * @property {number} retryCount
 * @property {Array<{node: string, status: string}>} steps
 */

let _idCounter = 0
const uid = () => `msg-${Date.now()}-${++_idCounter}`

export function useAgenticRAG() {
  /** @type {[ChatMessage[], Function]} */
  const [messages, setMessages] = useState([])

  /** @type {[WorkflowExecution|null, Function]} */
  const [activeWorkflow, setActiveWorkflow] = useState(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Keep a ref so we can abort in-flight requests if user clears chat
  const abortRef = useRef(null)

  /**
   * Submit a question: adds user message immediately, then calls API.
   */
  const submitQuestion = useCallback(async (question) => {
    if (!question.trim() || isLoading) return

    setError(null)

    // Add user bubble
    const userMsg = {
      id: uid(),
      role: 'user',
      content: question.trim(),
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setActiveWorkflow(null)

    try {
      const data = await sendQuestion(question.trim())

      const assistantMsg = {
        id: uid(),
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now(),
        sourceUsed: data.source_used,
        nodesVisited: data.nodes_visited,
        retryCount: data.retry_count,
        steps: data.steps,
      }

      setMessages(prev => [...prev, assistantMsg])
      setActiveWorkflow({
        nodesVisited: data.nodes_visited,
        sourceUsed: data.source_used,
        retryCount: data.retry_count,
        steps: data.steps,
      })
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  /**
   * Select a previous assistant message to show its workflow in the sidebar.
   */
  const selectMessageWorkflow = useCallback((msg) => {
    if (msg.role !== 'assistant') return
    setActiveWorkflow({
      nodesVisited: msg.nodesVisited || [],
      sourceUsed: msg.sourceUsed || 'unknown',
      retryCount: msg.retryCount || 0,
      steps: msg.steps || [],
    })
  }, [])

  /**
   * Clear all messages and reset state.
   */
  const clearChat = useCallback(() => {
    setMessages([])
    setActiveWorkflow(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    messages,
    activeWorkflow,
    isLoading,
    error,
    submitQuestion,
    selectMessageWorkflow,
    clearChat,
  }
}
