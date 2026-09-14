import React from 'react'

/**
 * LoadingSpinner — animated SVG spinner with optional label.
 * @param {{ size?: number, label?: string, className?: string }} props
 */
export default function LoadingSpinner({ size = 20, label, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-label={label || 'Loading'}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="rgba(99,102,241,0.25)"
          strokeWidth="3"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="url(#spinnerGrad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="spinnerGrad" x1="12" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818cf8" />
            <stop offset="1" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>
      {label && <span className="text-sm text-slate-400">{label}</span>}
    </span>
  )
}
