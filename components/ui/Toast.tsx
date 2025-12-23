'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
    title?: string;
}

export function Toast({ message, type, onClose, duration = 4000, title }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => {
            setIsVisible(true);
        });

        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const styles = {
        success: {
            bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
            icon: <CheckCircle className="w-6 h-6 text-white" />,
            glow: 'shadow-emerald-500/25',
            progress: 'bg-emerald-200',
            defaultTitle: 'Berhasil!'
        },
        error: {
            bg: 'bg-gradient-to-r from-red-500 to-rose-500',
            icon: <XCircle className="w-6 h-6 text-white" />,
            glow: 'shadow-red-500/25',
            progress: 'bg-red-200',
            defaultTitle: 'Gagal!'
        },
        warning: {
            bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
            icon: <AlertTriangle className="w-6 h-6 text-white" />,
            glow: 'shadow-amber-500/25',
            progress: 'bg-amber-200',
            defaultTitle: 'Peringatan!'
        },
        info: {
            bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
            icon: <Info className="w-6 h-6 text-white" />,
            glow: 'shadow-blue-500/25',
            progress: 'bg-blue-200',
            defaultTitle: 'Informasi'
        }
    };

    const currentStyle = styles[type];

    return (
        <div
            className={`
                fixed bottom-6 right-6 z-[100] max-w-sm w-full
                transform transition-all duration-300 ease-out
                ${isVisible && !isLeaving ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}
            `}
        >
            <div className={`
                relative overflow-hidden rounded-2xl shadow-2xl ${currentStyle.glow}
                ${currentStyle.bg}
            `}>
                {/* Glass overlay effect */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

                {/* Content */}
                <div className="relative p-4">
                    <div className="flex items-start gap-3">
                        {/* Icon with pulse animation */}
                        <div className="flex-shrink-0 animate-bounce-once">
                            <div className="p-1 bg-white/20 rounded-full">
                                {currentStyle.icon}
                            </div>
                        </div>

                        {/* Text content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                            <p className="font-bold text-white text-sm">
                                {title || currentStyle.defaultTitle}
                            </p>
                            <p className="text-white/90 text-sm mt-0.5 leading-relaxed">
                                {message}
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-full transition-colors group"
                        >
                            <X className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full bg-black/10">
                    <div
                        className={`h-full ${currentStyle.progress} animate-progress`}
                        style={{
                            animationDuration: `${duration}ms`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

// Confirmation Dialog Component
interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    type = 'danger',
    onConfirm,
    onCancel,
    isLoading = false
}: ConfirmDialogProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
            iconBg: 'bg-red-100',
            button: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-500/25'
        },
        warning: {
            icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
            iconBg: 'bg-amber-100',
            button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'
        },
        info: {
            icon: <Info className="w-8 h-8 text-blue-500" />,
            iconBg: 'bg-blue-100',
            button: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/25'
        }
    };

    const currentTypeStyle = typeStyles[type];

    return (
        <div className={`
            fixed inset-0 z-[200] flex items-center justify-center p-4
            transition-all duration-300
            ${isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'}
        `}>
            <div className={`
                bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden
                transform transition-all duration-300
                ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
            `}>
                {/* Header with icon */}
                <div className="p-6 text-center">
                    <div className={`inline-flex p-4 rounded-full ${currentTypeStyle.iconBg} mb-4`}>
                        {currentTypeStyle.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-4 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-all disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`
                            flex-1 py-3 px-4 rounded-xl font-semibold text-white shadow-lg
                            transition-all disabled:opacity-50 ${currentTypeStyle.button}
                        `}
                    >
                        {isLoading ? (
                            <span className="inline-flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Memproses...
                            </span>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
