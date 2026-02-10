import React from 'react'
import { useToast } from '../hooks/useToast'
import clsx from 'clsx'

export default function ToastContainer() {
  const { toasts } = useToast()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={clsx(
            'pointer-events-auto px-4 py-3 rounded-lg shadow-lg max-w-sm text-sm',
            'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800',
            toast.exiting ? 'toast-out' : 'toast-in',
            toast.type === 'success' && 'border-l-4 !border-l-emerald-500',
            toast.type === 'error' && 'border-l-4 !border-l-red-500',
            toast.type === 'warning' && 'border-l-4 !border-l-amber-500',
          )}
        >
          <span className="text-zinc-600 dark:text-zinc-400">{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
