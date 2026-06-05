import React from 'react'

/**
 * Production-friendly Error Boundary.
 * Catches unexpected React errors and shows a helpful recovery UI
 * instead of a completely broken white screen.
 *
 * In development it shows the actual error + component stack.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })

    // Log to console (and optionally to an error reporting service)
    console.error('Uncaught error in React component tree:', error, errorInfo)
  }

  handleReset = () => {
    // Attempt to recover by resetting the boundary.
    // This will re-render the children. It won't fix the root cause,
    // but it lets the user try to continue (e.g. after a bad state).
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleFullReset = () => {
    try {
      localStorage.clear()
      // Also clear any session storage just in case
      sessionStorage.clear()
    } catch {
      // Ignore storage errors
    }
    window.location.reload()
  }

  handleCopyError = async () => {
    const { error, errorInfo } = this.state
    const text = [
      'Flashcard Generator Error Report',
      '--------------------------------',
      `Time: ${new Date().toISOString()}`,
      `User Agent: ${navigator.userAgent}`,
      '',
      'Error:',
      error?.toString() || 'Unknown error',
      '',
      'Component Stack:',
      errorInfo?.componentStack || 'No component stack available',
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      // Simple visual feedback without external dependencies
      const originalText = event?.currentTarget?.textContent
      if (event?.currentTarget) {
        event.currentTarget.textContent = 'Copied!'
        setTimeout(() => {
          if (event.currentTarget) event.currentTarget.textContent = originalText || 'Copy details'
        }, 1800)
      }
    } catch {
      // Fallback: alert the text (rare)
      window.prompt('Copy the error details below:', text)
    }
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV
      const { error, errorInfo } = this.state

      return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 text-xl">⚠︎</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  The application encountered an unexpected error.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 text-sm">
                <div className="font-mono text-red-700 dark:text-red-400 break-all">
                  {error.toString()}
                </div>
                {isDev && errorInfo?.componentStack && (
                  <pre className="mt-3 text-[11px] text-red-600/80 dark:text-red-400/70 overflow-auto max-h-48">
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700 transition-colors"
              >
                Try to recover
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700 transition-colors"
              >
                Reload page
              </button>
              <button
                onClick={this.handleCopyError}
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700 transition-colors"
              >
                Copy details
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={this.handleFullReset}
                className="w-full text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline-offset-2 hover:underline"
              >
                Reset all data & reload (clears saved cards)
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
              If this keeps happening, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
