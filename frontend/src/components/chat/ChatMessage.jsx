/**
 * ChatMessage — renders a single chat bubble (user or assistant).
 * Assistant messages use react-markdown for full markdown support.
 */

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Cpu, Database, Globe, Zap, AlertTriangle } from 'lucide-react'
import { StepBadge } from '../sidebar/StepBadge'

const SOURCE_ICON = {
  private_kb: { Icon: Database, label: 'KB', color: 'text-emerald-400' },
  kb:         { Icon: Database, label: 'KB', color: 'text-emerald-400' },
  web_search: { Icon: Globe,    label: 'Web', color: 'text-amber-400' },
  web:        { Icon: Globe,    label: 'Web', color: 'text-amber-400' },
  direct:     { Icon: Zap,      label: 'Direct', color: 'text-slate-400' },
  insufficient_evidence: { Icon: AlertTriangle, label: 'N/A', color: 'text-red-400' },
}

/**
 * @param {{
 *   message: import('../../hooks/useAgenticRAG').ChatMessage,
 *   onSelect: (msg: object) => void,
 *   isSelected: boolean,
 * }} props
 */
export default function ChatMessage({ message, onSelect, isSelected }) {
  const isUser = message.role === 'user'
  const sourceInfo = SOURCE_ICON[message.sourceUsed] || null

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 animate-slide-up">
        <div className="max-w-[78%] md:max-w-[65%]">
          <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          <p className="text-right text-[10px] text-slate-600 mt-1 pr-1">
            {formatTime(message.timestamp)}
          </p>
        </div>
        {/* User avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow">
          <User size={14} className="text-white" />
        </div>
      </div>
    )
  }

  // ── Assistant message ──────────────────────────────────────────────
  return (
    <div
      className={`flex gap-3 animate-slide-up group cursor-pointer`}
      onClick={() => onSelect(message)}
      title="Click to inspect workflow steps"
    >
      {/* AI avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all ${
        isSelected
          ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/40 ring-2 ring-indigo-400/50'
          : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 group-hover:from-indigo-600/40 group-hover:to-violet-600/40'
      }`}>
        <Cpu size={14} className={isSelected ? 'text-white' : 'text-slate-300'} />
      </div>

      <div className="max-w-[78%] md:max-w-[72%] flex-1">
        {/* Bubble */}
        <div className={`px-4 py-3 rounded-2xl rounded-tl-sm glass border transition-all ${
          isSelected
            ? 'border-indigo-500/40 shadow-md shadow-indigo-500/10'
            : 'border-white/[0.07] group-hover:border-white/[0.12]'
        }`}>
          <div className="prose-rag">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mt-1.5 pl-1">
          <span className="text-[10px] text-slate-600">{formatTime(message.timestamp)}</span>

          {sourceInfo && (
            <span className={`flex items-center gap-1 text-[10px] font-medium ${sourceInfo.color}`}>
              <sourceInfo.Icon size={9} />
              {sourceInfo.label}
            </span>
          )}

          {message.nodesVisited && message.nodesVisited.length > 0 && (
            <span className="text-[10px] text-slate-600">
              {message.nodesVisited.length} steps
            </span>
          )}

          {message.retryCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
              {message.retryCount} retr{message.retryCount === 1 ? 'y' : 'ies'}
            </span>
          )}

          {isSelected && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
              ✓ inspecting
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/** Format unix timestamp as HH:MM */
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
