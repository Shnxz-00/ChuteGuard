import * as React from "react"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({ checked, onCheckedChange, disabled = false, className = "" }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-5 w-9 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-[var(--color-status-normal)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)]
        ${checked ? 'bg-[var(--color-status-normal)]' : 'bg-[var(--color-border-color)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{ transitionDuration: '200ms' }}
    >
      <span
        className="inline-block h-3 w-3 rounded-full bg-white transition-transform"
        style={{
          transform: checked ? 'translateX(1.25rem)' : 'translateX(0.25rem)',
          transitionDuration: '200ms'
        }}
      />
    </button>
  )
}
