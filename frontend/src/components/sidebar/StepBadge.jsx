/**
 * StepBadge — colour-coded pill badge for a LangGraph node name.
 * Maps each known node to a theme colour and a short display label.
 */

import React from 'react'
import {
  GitBranch, Database, CheckCircle, Globe,
  RefreshCw, Zap, MessageSquare, AlertTriangle, Search
} from 'lucide-react'

const NODE_CONFIG = {
  route_question: {
    label: 'Route Question',
    shortLabel: 'Route',
    color: 'violet',
    Icon: GitBranch,
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    text: 'text-violet-300',
    dot: 'bg-violet-400',
    ring: 'ring-violet-500/40',
  },
  retrieve_kb: {
    label: 'Retrieve KB',
    shortLabel: 'KB Retrieval',
    color: 'blue',
    Icon: Database,
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
    ring: 'ring-blue-500/40',
  },
  grade_kb_evidence: {
    label: 'Grade KB Evidence',
    shortLabel: 'Grade KB',
    color: 'cyan',
    Icon: CheckCircle,
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
    text: 'text-cyan-300',
    dot: 'bg-cyan-400',
    ring: 'ring-cyan-500/40',
  },
  search_web: {
    label: 'Web Search',
    shortLabel: 'Web Search',
    color: 'amber',
    Icon: Globe,
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    ring: 'ring-amber-500/40',
  },
  grade_web_evidence: {
    label: 'Grade Web Evidence',
    shortLabel: 'Grade Web',
    color: 'orange',
    Icon: CheckCircle,
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/30',
    text: 'text-orange-300',
    dot: 'bg-orange-400',
    ring: 'ring-orange-500/40',
  },
  rewrite_query: {
    label: 'Rewrite Query',
    shortLabel: 'Rewrite',
    color: 'rose',
    Icon: RefreshCw,
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
    ring: 'ring-rose-500/40',
  },
  generate_from_kb: {
    label: 'Generate from KB',
    shortLabel: 'KB Answer',
    color: 'emerald',
    Icon: Zap,
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-500/40',
  },
  generate_from_web: {
    label: 'Generate from Web',
    shortLabel: 'Web Answer',
    color: 'teal',
    Icon: Zap,
    bg: 'bg-teal-500/15',
    border: 'border-teal-500/30',
    text: 'text-teal-300',
    dot: 'bg-teal-400',
    ring: 'ring-teal-500/40',
  },
  direct_answer: {
    label: 'Direct Answer',
    shortLabel: 'Direct',
    color: 'slate',
    Icon: MessageSquare,
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/30',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
    ring: 'ring-slate-500/40',
  },
  answer_insufficient: {
    label: 'Insufficient Evidence',
    shortLabel: 'Insufficient',
    color: 'red',
    Icon: AlertTriangle,
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    text: 'text-red-300',
    dot: 'bg-red-400',
    ring: 'ring-red-500/40',
  },
}

const FALLBACK_CONFIG = {
  label: 'Unknown Step',
  shortLabel: 'Unknown',
  Icon: Search,
  bg: 'bg-slate-700/30',
  border: 'border-slate-600/30',
  text: 'text-slate-400',
  dot: 'bg-slate-500',
  ring: 'ring-slate-500/30',
}

/**
 * @param {{ node: string, variant?: 'pill'|'icon', className?: string }} props
 *
 * variant 'pill'  → compact coloured chip (default for sidebar steps)
 * variant 'icon'  → just the icon with background circle
 */
export function StepBadge({ node, variant = 'pill', className = '' }) {
  const cfg = NODE_CONFIG[node] || FALLBACK_CONFIG
  const { Icon, label, shortLabel } = cfg

  if (variant === 'icon') {
    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${cfg.bg} border ${cfg.border} ${className}`}
        title={label}
      >
        <Icon size={12} className={cfg.text} />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${cfg.bg} ${cfg.border} ${cfg.text} ${className}`}
      title={label}
    >
      <Icon size={10} />
      {shortLabel}
    </span>
  )
}

/** Export the config map for use in other components */
export { NODE_CONFIG, FALLBACK_CONFIG }
