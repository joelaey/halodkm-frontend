import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color?: string;
    highlight?: boolean;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    color = 'bg-emerald-600',
    highlight = false
}: StatCardProps) {
    return (
        <div className={`bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-default ${highlight ? 'ring-2 ring-emerald-200' : ''}`}>
            <div className="flex justify-between items-start mb-2 sm:mb-4">
                <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${color}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                </div>
            </div>
            <div>
                <h4 className={`${highlight ? 'text-base sm:text-2xl lg:text-3xl' : 'text-sm sm:text-xl lg:text-2xl'} font-black text-gray-900 tracking-tight break-all`}>
                    {value}
                </h4>
                <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1 uppercase tracking-wide">
                    {title}
                </p>
            </div>
        </div>
    );
}
