import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "normal" | "warning" | "danger"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                {
                    "border-transparent bg-[var(--color-border-color)] text-[var(--color-text-primary)]": variant === "default",
                    "border-transparent bg-[var(--color-status-normal)]/20 text-[var(--color-status-normal)]": variant === "normal",
                    "border-transparent bg-[var(--color-status-warning)]/20 text-[var(--color-status-warning)]": variant === "warning",
                    "border-transparent bg-[var(--color-status-danger)]/20 text-[var(--color-status-danger)]": variant === "danger",
                },
                className
            )}
            {...props}
        />
    )
}

export { Badge }
