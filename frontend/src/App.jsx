/**
 * App.jsx — Root layout shell.
 *
 * Desktop:  2-column grid (chat panel | workflow sidebar)
 * Mobile:   Full-screen chat + slide-over drawer for workflow inspector
 */

import React, { useState } from 'react'
import Header from './components/common/Header'
import ChatContainer from './components/chat/ChatContainer'
import ChatInput from './components/chat/ChatInput'
import ExecutionGraph from './components/sidebar/ExecutionGraph'
import { useAgenticRAG } from './hooks/useAgenticRAG'

export default function App() {
  const {
    messages,
    activeWorkflow,
    isLoading,
    error,
    submitQuestion,
    selectMessageWorkflow,
    clearChat,
  } = useAgenticRAG()

  // Track which assistant message is "selected" (for sidebar highlight)
  const [selectedMsgId, setSelectedMsgId] = useState(null)

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  function handleSelectMessage(msg) {
    setSelectedMsgId(msg.id)
    selectMessageWorkflow(msg)
    // Auto-open drawer on mobile when clicking a message
    setMobileDrawerOpen(true)
  }

  function handleSubmit(question) {
    setSelectedMsgId(null)
    submitQuestion(question)
  }

  const workflowStepCount = activeWorkflow?.nodesVisited?.length ?? 0

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#080910]">
      {/* Background glow blobs */}
      <div className="bg-glow w-96 h-96 bg-indigo-600 top-[-8rem] left-[-4rem]" />
      <div className="bg-glow w-80 h-80 bg-violet-700 bottom-[-4rem] right-[-2rem]" />

      {/* Header */}
      <Header
        onMobileWorkflowToggle={() => setMobileDrawerOpen(prev => !prev)}
        workflowStepCount={workflowStepCount}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Chat Panel ─────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            selectedMessageId={selectedMsgId}
            onSelectMessage={handleSelectMessage}
          />
          <ChatInput
            onSubmit={handleSubmit}
            onClear={() => { clearChat(); setSelectedMsgId(null) }}
            isLoading={isLoading}
            error={error}
            hasMessages={messages.length > 0}
          />
        </div>

        {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-[300px] lg:w-[340px] xl:w-[360px] border-l border-white/[0.06] glass flex-shrink-0">
          <ExecutionGraph workflow={activeWorkflow} />
        </aside>
      </div>

      {/* ── Mobile Drawer Overlay ────────────────────────────────────── */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="w-[85vw] max-w-sm h-full glass border-l border-white/[0.08] flex flex-col overflow-hidden animate-slide-up">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-sm font-semibold text-slate-300">Workflow Inspector</span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center glass border border-white/[0.08] text-slate-500 hover:text-white transition-colors"
                aria-label="Close drawer"
              >
                ✕
              </button>
            </div>
            <ExecutionGraph workflow={activeWorkflow} />
          </div>
        </div>
      )}
    </div>
  )
}
