// contexts/ToastContext.tsx
// Simple toast notification system for user feedback

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const toast: Toast = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const success = useCallback((message: string, duration?: number) => {
        showToast(message, 'success', duration);
    }, [showToast]);

    const error = useCallback((message: string, duration?: number) => {
        showToast(message, 'error', duration);
    }, [showToast]);

    const info = useCallback((message: string, duration?: number) => {
        showToast(message, 'info', duration);
    }, [showToast]);

    const warning = useCallback((message: string, duration?: number) => {
        showToast(message, 'warning', duration);
    }, [showToast]);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

// Toast Container Component
interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            <AnimatePresence>
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => onRemove(toast.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
};

// Individual Toast Component
interface ToastItemProps {
    toast: Toast;
    onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
    const { message, type } = toast;

    const getToastStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-500',
                    icon: '✓',
                    border: 'border-green-600',
                };
            case 'error':
                return {
                    bg: 'bg-red-500',
                    icon: '✕',
                    border: 'border-red-600',
                };
            case 'warning':
                return {
                    bg: 'bg-orange-500',
                    icon: '⚠',
                    border: 'border-orange-600',
                };
            case 'info':
            default:
                return {
                    bg: 'bg-blue-500',
                    icon: 'ℹ',
                    border: 'border-blue-600',
                };
        }
    };

    const styles = getToastStyles();

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`${styles.bg} ${styles.border} border-l-4 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]`}
        >
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white/20 rounded-full font-bold">
                {styles.icon}
            </div>
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded transition-colors"
                aria-label="Close"
            >
                ✕
            </button>
        </motion.div>
    );
};
