/**
 * ChatContainer — scrollable message list.
 * Auto-scrolls to the latest message and renders the typing indicator
 * while isLoading is true.
 */

import React, { useEffect, useRef, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import ChatMessage from './ChatMessage'

/**
 * @param {{
 *   messages: import('../../hooks/useAgenticRAG').ChatMessage[],
 *   isLoading: boolean,
 *   selectedMessageId: string|null,
 *   onSelectMessage: (msg: object) => void,
 * }} props
 */
export default function ChatContainer({ messages, isLoading, selectedMessageId, onSelectMessage }) {
  const bottomRef = useRef(null)

  // Auto-scroll on new messages or loading state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return <EmptyChat />
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5">
      {messages.map(msg => (
        <ChatMessage
          key={msg.id}
          message={msg}
          onSelect={onSelectMessage}
          isSelected={msg.id === selectedMessageId}
        />
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex gap-3 animate-slide-up">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse-slow" />
          </div>
          <div className="glass border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <span className="text-xs text-slate-500 ml-1">Thinking…</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

function EmptyChat() {
  const suggestions = [
    'What is Agentic RAG?',
    'How does query rewriting work in LangGraph?',
    'Explain the retrieval grading mechanism',
    'What happens when KB evidence is weak?',
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center mb-5 shadow-xl shadow-indigo-500/10">
        <MessageSquare size={28} className="text-indigo-400" />
      </div>

      <h2 className="text-lg font-semibold text-slate-200 mb-2">
        Ask the Agentic RAG
      </h2>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-8">
        Powered by LangGraph, Pinecone, Groq, and Tavily. Ask anything about Agentic RAG,
        LangGraph workflows, or retrieval-augmented generation.
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {suggestions.map(s => (
          <button
            key={s}
            className="px-3 py-1.5 rounded-full text-xs glass border border-white/[0.08] text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
