'use client';

import { useEffect } from 'react';
import Icon from './Icon';

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

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
  children
}: ConfirmationDialogProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'exclamation-triangle',
          iconBg: 'bg-error-50',
          iconColor: 'text-error-600',
          confirmBg: 'bg-error-600 hover:bg-error-700 focus:ring-error-500'
        };
      case 'warning':
        return {
          icon: 'exclamation-triangle',
          iconBg: 'bg-secondary-100',
          iconColor: 'text-secondary-600',
          confirmBg: 'bg-secondary-500 hover:bg-secondary-600 focus:ring-secondary-500'
        };
      case 'info':
        return {
          icon: 'information-circle',
          iconBg: 'bg-primary-100',
          iconColor: 'text-primary-600',
          confirmBg: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
        };
      default:
        return {
          icon: 'exclamation-triangle',
          iconBg: 'bg-error-50',
          iconColor: 'text-error-600',
          confirmBg: 'bg-error-600 hover:bg-error-700 focus:ring-error-500'
        };
    }
  };

  const { icon, iconBg, iconColor, confirmBg } = getIconAndColors();

  return (
    <div className="fixed inset-0 bg-neutral-900/60 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-6 w-full max-w-md mx-4 shadow-sm border border-neutral-100 rounded-2xl bg-white">
        <div className="mt-3 text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconBg} mb-4`}>
            <Icon name={icon} className={`h-6 w-6 ${iconColor}`} />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            {title}
          </h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-neutral-500">
              {message}
            </p>
            {children && (
              <div className="mt-4">
                {children}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmBg}`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
