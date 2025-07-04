'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Info } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmationModalProps) {
  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
          iconBg: 'bg-red-100',
          confirmButton: 'bg-red-500 hover:bg-red-600 text-white'
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
          iconBg: 'bg-amber-100',
          confirmButton: 'bg-amber-500 hover:bg-amber-600 text-white'
        }
      case 'info':
        return {
          icon: <Info className="w-12 h-12 text-blue-500" />,
          iconBg: 'bg-blue-100',
          confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>

            {/* Content */}
            <div className="p-6 text-center">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center mx-auto mb-4`}>
                {styles.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {title}
              </h3>

              {/* Message */}
              <p className="text-neutral-600 whitespace-pre-line">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex items-center justify-center gap-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-6 py-2.5 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 ${styles.confirmButton}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}