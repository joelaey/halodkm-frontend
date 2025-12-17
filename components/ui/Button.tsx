import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    icon?: LucideIcon;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    icon: Icon,
    children,
    className = '',
    ...props
}: ButtonProps) {
    const baseStyles = 'px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 justify-center';

    const variants = {
        primary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg',
        secondary: 'bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50',
        danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {Icon && <Icon size={20} />}
            {children}
        </button>
    );
}
