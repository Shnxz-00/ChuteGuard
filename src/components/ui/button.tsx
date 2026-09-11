import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "danger" | "ghost"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
                    {
                        "bg-[var(--color-status-normal)] text-[var(--color-background)] hover:bg-[#20c193]": variant === "default",
                        "border border-[var(--color-border-color)] bg-transparent hover:bg-[var(--color-border-color)] text-[var(--color-text-primary)]": variant === "outline",
                        "bg-[var(--color-status-danger)] text-white hover:bg-[#c94541]": variant === "danger",
                        "hover:bg-[var(--color-border-color)] hover:text-[var(--color-text-primary)]": variant === "ghost",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
