/**
 * ExecutionGraph — animated sidebar component visualising the LangGraph
 * nodes visited during a workflow run. Shows a vertical timeline with
 * colour-coded step cards and a summary badge for the source used.
 */

import React from 'react'
import {
  GitBranch, Database, Globe, Zap, RefreshCw,
  CheckCircle2, AlertTriangle, Info
} from 'lucide-react'
import { StepBadge, NODE_CONFIG, FALLBACK_CONFIG } from './StepBadge'

/** Source-used → summary pill config */
const SOURCE_SUMMARY = {
  private_kb: {
    label: 'Answered from Knowledge Base',
    icon: Database,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
  },
  web_search: {
    label: 'Answered from Web Search',
    icon: Globe,
    color: 'text-amber-300',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
  },
  web: {
    label: 'Answered from Web Search',
    icon: Globe,
    color: 'text-amber-300',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
  },
  direct: {
    label: 'Direct Response',
    icon: Zap,
    color: 'text-slate-300',
    bg: 'bg-slate-700/30',
    border: 'border-slate-600/30',
  },
  kb: {
    label: 'Answered from Knowledge Base',
    icon: Database,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
  },
  insufficient_evidence: {
    label: 'Evidence Insufficient',
    icon: AlertTriangle,
    color: 'text-red-300',
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
  },
  unknown: {
    label: 'Unknown Source',
    icon: Info,
    color: 'text-slate-400',
    bg: 'bg-slate-700/20',
    border: 'border-slate-600/20',
  },
}

/**
 * @param {{
 *   workflow: {
 *     nodesVisited: string[],
 *     sourceUsed: string,
 *     retryCount: number,
 *     steps: Array<{node: string, status: string}>
 *   } | null
 * }} props
 */
export default function ExecutionGraph({ workflow }) {
  if (!workflow) {
    return (
      <EmptyState />
    )
  }

  const { nodesVisited, sourceUsed, retryCount, steps } = workflow
  const sourceCfg = SOURCE_SUMMARY[sourceUsed] || SOURCE_SUMMARY.unknown
  const SourceIcon = sourceCfg.icon

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch size={14} className="text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Workflow Execution
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          {nodesVisited.length} nodes executed
          {retryCount > 0 && ` · ${retryCount} retr${retryCount === 1 ? 'y' : 'ies'}`}
        </p>
      </div>

      {/* Source summary pill */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${sourceCfg.bg} ${sourceCfg.border}`}
        >
          <SourceIcon size={14} className={sourceCfg.color} />
          <span className={`text-xs font-medium ${sourceCfg.color}`}>
            {sourceCfg.label}
          </span>
        </div>
      </div>

      {/* Steps timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {nodesVisited.map((node, idx) => {
          const cfg = NODE_CONFIG[node] || FALLBACK_CONFIG
          const Icon = cfg.Icon
          const isLast = idx === nodesVisited.length - 1

          return (
            <div key={`${node}-${idx}`} className="relative flex gap-3 animate-slide-up">
              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className="absolute left-[11px] top-6 w-[2px] rounded-full"
                  style={{
                    bottom: '-4px',
                    background: `linear-gradient(to bottom, ${getCssColor(cfg.color)}, transparent)`,
                  }}
                />
              )}

              {/* Step icon */}
              <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${cfg.bg} ${cfg.border} ring-pulse`}>
                <Icon size={11} className={cfg.text} />
              </div>

              {/* Step card */}
              <div
                className={`flex-1 mb-3 px-3 py-2 rounded-lg border ${cfg.bg} ${cfg.border} transition-all`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-semibold ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-slate-600">
                    Step {idx + 1}
                  </span>
                  {node === 'rewrite_query' && (
                    <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/20">
                      retry
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Nodes" value={nodesVisited.length} />
          <StatCard label="Retries" value={retryCount} />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="glass rounded-lg px-3 py-2 text-center border border-white/[0.06]">
      <div className="text-lg font-bold gradient-text">{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
        <GitBranch size={22} className="text-indigo-400/60" />
      </div>
      <p className="text-sm font-medium text-slate-400 mb-1">No workflow yet</p>
      <p className="text-xs text-slate-600 leading-relaxed">
        Ask a question to see the LangGraph execution steps here.
      </p>
    </div>
  )
}

/** Convert Tailwind color name → approximate CSS color for inline styles */
function getCssColor(color) {
  const map = {
    violet: 'rgba(167,139,250,0.5)',
    blue:   'rgba(96,165,250,0.5)',
    cyan:   'rgba(34,211,238,0.5)',
    amber:  'rgba(251,191,36,0.5)',
    orange: 'rgba(251,146,60,0.5)',
    rose:   'rgba(251,113,133,0.5)',
    emerald:'rgba(52,211,153,0.5)',
    teal:   'rgba(45,212,191,0.5)',
    slate:  'rgba(148,163,184,0.4)',
    red:    'rgba(248,113,113,0.5)',
  }
  return map[color] || 'rgba(148,163,184,0.3)'
}
