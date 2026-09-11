import * as React from "react"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)] text-white p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-heading font-bold text-[var(--color-status-danger)] mb-4">
              Something went wrong
            </h1>
            <p className="text-[var(--color-text-muted)] mb-6">
              An error occurred while rendering this page. Please refresh to try again.
            </p>
            {this.state.error && (
              <details className="text-left bg-[var(--color-panel)] border border-[var(--color-border-color)] rounded-lg p-4 text-sm font-mono text-[var(--color-text-muted)]">
                <summary className="cursor-pointer text-[var(--color-status-warning)] mb-2">
                  Error details
                </summary>
                <pre className="whitespace-pre-wrap">{this.state.error.toString()}</pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-[var(--color-status-normal)] text-black font-medium rounded-lg hover:bg-[var(--color-status-normal)]/80 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
