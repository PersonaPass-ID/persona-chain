/**
 * TOAST HOOK
 * 
 * React hook for displaying toast notifications throughout the app.
 * Provides a simple interface for success, error, warning, and info messages.
 */

'use client'

import React, { useState, useCallback } from 'react'

export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

// Global state for toasts (in a real app, you'd use a context or state management)
let globalToastState: ToastState = { toasts: [] }
let globalSetToastState: ((state: ToastState) => void) | null = null

export function useToast() {
  const [toasts, setToastsLocal] = useState<Toast[]>(globalToastState.toasts)
  
  // Register this component's setState function
  if (!globalSetToastState) {
    globalSetToastState = (state: ToastState) => {
      globalToastState = state
      setToastsLocal(state.toasts)
    }
  }

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000,
      variant: 'default',
      ...props
    }

    const newState = {
      toasts: [...globalToastState.toasts, newToast]
    }

    globalSetToastState?.(newState)

    // Auto-dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const dismiss = useCallback((toastId: string) => {
    const newState = {
      toasts: globalToastState.toasts.filter(t => t.id !== toastId)
    }
    globalSetToastState?.(newState)
  }, [])

  const dismissAll = useCallback(() => {
    const newState = { toasts: [] }
    globalSetToastState?.(newState)
  }, [])

  // Convenience methods
  const success = useCallback((title: string, description?: string) => {
    return toast({ title, description, variant: 'success' })
  }, [toast])

  const error = useCallback((title: string, description?: string) => {
    return toast({ title, description, variant: 'destructive' })
  }, [toast])

  const warning = useCallback((title: string, description?: string) => {
    return toast({ title, description, variant: 'warning' })
  }, [toast])

  const info = useCallback((title: string, description?: string) => {
    return toast({ title, description, variant: 'default' })
  }, [toast])

  return {
    toast,
    toasts,
    dismiss,
    dismissAll,
    // Convenience methods
    success,
    error,
    warning,
    info
  }
}

// Toast component for rendering (optional - would use a proper toast library in production)
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToast()

  return React.createElement('div', null,
    children,
    React.createElement('div', { 
      className: "fixed top-4 right-4 z-50 space-y-2" 
    },
      toasts.map((toast) => 
        React.createElement('div', {
          key: toast.id,
          className: `max-w-sm rounded-lg shadow-lg p-4 border ${
            toast.variant === 'destructive' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : toast.variant === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : toast.variant === 'warning'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-white border-gray-200 text-gray-900'
          }`
        },
          React.createElement('div', { className: "flex justify-between items-start" },
            React.createElement('div', { className: "flex-1" },
              toast.title && React.createElement('div', { 
                className: "font-medium text-sm mb-1" 
              }, toast.title),
              toast.description && React.createElement('div', { 
                className: "text-sm opacity-90" 
              }, toast.description)
            ),
            React.createElement('button', {
              onClick: () => dismiss(toast.id),
              className: "ml-2 text-gray-400 hover:text-gray-600",
              type: "button"
            }, '×')
          )
        )
      )
    )
  )
}