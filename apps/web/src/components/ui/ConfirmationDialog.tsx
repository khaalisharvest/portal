'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const CONFIG = {
  danger: {
    iconBg:  'bg-error-50',
    iconColor: 'text-error-500',
    confirmCls: 'bg-error-500 hover:bg-error-600 text-white',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
    ),
  },
  warning: {
    iconBg:  'bg-secondary-50',
    iconColor: 'text-secondary-500',
    confirmCls: 'bg-secondary-500 hover:bg-secondary-600 text-white',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
    ),
  },
  info: {
    iconBg:  'bg-primary-50',
    iconColor: 'text-primary-600',
    confirmCls: 'bg-primary-600 hover:bg-primary-700 text-white',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
} as const;

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  type        = 'danger',
  isLoading   = false,
  children,
}: ConfirmationDialogProps) {
  const cfg = CONFIG[type];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Centering wrapper */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
              key="cd-panel"
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{ opacity: 0,   scale: 0.96, y: 8  }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <div className="flex justify-end px-4 pt-4">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="px-6 pb-6">
                {/* Icon */}
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor}`}>
                  {cfg.icon}
                </div>

                {/* Text — centred */}
                <div className="text-center">
                  <h3 className="text-base font-bold text-neutral-900 leading-snug">{title}</h3>
                  <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{message}</p>
                </div>

                {/* Optional slot (e.g. textarea for cancellation reason) */}
                {children && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 text-left">
                    {children}
                  </div>
                )}

                {/* Actions — full-width stacked */}
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors focus:outline-none disabled:opacity-60 ${cfg.confirmCls}`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Processing…
                      </span>
                    ) : confirmText}
                  </button>
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors focus:outline-none disabled:opacity-50"
                  >
                    {cancelText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
