/**
 * ChatInput — text area with send / clear buttons and keyboard shortcuts.
 * Enter = submit, Shift+Enter = newline.
 */

import React, { useState, useRef, useEffect } from 'react'
import { Send, Trash2, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'

/**
 * @param {{
 *   onSubmit: (question: string) => void,
 *   onClear: () => void,
 *   isLoading: boolean,
 *   error: string|null,
 *   hasMessages: boolean,
 * }} props
 */
export default function ChatInput({ onSubmit, onClear, isLoading, error, hasMessages }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [value])

  const canSubmit = value.trim().length > 0 && !isLoading

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSubmit) handleSubmit()
    }
  }

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit(value.trim())
    setValue('')
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  return (
    <div className="px-4 md:px-6 py-4 border-t border-white/[0.06]">
      {/* Error banner */}
      {error && (
        <div className="mb-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 animate-slide-up">
          <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-300 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Input row */}
      <div className={`flex items-end gap-2 px-3 py-2 rounded-2xl glass border transition-all ${
        isLoading
          ? 'border-indigo-500/20'
          : 'border-white/[0.08] focus-within:border-indigo-500/40 focus-within:shadow-lg focus-within:shadow-indigo-500/5'
      }`}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Waiting for response…' : 'Ask about Agentic RAG… (Enter to send)'}
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none outline-none leading-relaxed py-1.5 min-h-[36px] max-h-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Chat input"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
          {/* Clear button */}
          {hasMessages && !isLoading && (
            <button
              id="clear-chat-btn"
              onClick={onClear}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Clear chat"
              aria-label="Clear chat"
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Send button */}
          <button
            id="send-btn"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              canSubmit
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            {isLoading ? (
              <LoadingSpinner size={16} />
            ) : (
              <Send size={15} className={canSubmit ? 'text-white' : ''} />
            )}
          </button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-slate-700 mt-2 text-center">
        Shift+Enter for new line · Enter to send
      </p>
    </div>
  )
}
