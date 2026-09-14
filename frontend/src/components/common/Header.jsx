import React from 'react'
import { Cpu, GitBranch, ExternalLink } from 'lucide-react'

/**
 * Header — top navigation bar with branding and a GitHub link.
 *
 * @param {{ onMobileWorkflowToggle: () => void }} props
 */
export default function Header({ onMobileWorkflowToggle, workflowStepCount }) {
  return (
    <header className="relative z-20 flex items-center justify-between px-4 md:px-6 h-14 border-b border-white/[0.06] glass">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Cpu size={15} className="text-white" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-700 gradient-text tracking-tight font-bold">
            Agentic RAG
          </span>
          <span className="text-[10px] text-slate-500 tracking-wider uppercase font-medium">
            LangGraph Workflow
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Mobile workflow toggle */}
        <button
          onClick={onMobileWorkflowToggle}
          className="md:hidden relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/[0.08] text-slate-400 hover:text-indigo-400 transition-colors text-xs font-medium"
          aria-label="Toggle workflow inspector"
        >
          <GitBranch size={13} />
          <span>Workflow</span>
          {workflowStepCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold">
              {workflowStepCount}
            </span>
          )}
        </button>

        {/* GitHub link */}
        <a
          href="https://github.com/Rubal-code/Agentic-RAG"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/[0.08] text-slate-400 hover:text-white transition-colors text-xs font-medium"
        >
          <ExternalLink size={12} />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  )
}
