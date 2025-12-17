import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
            {children}
        </div>
    );
}
