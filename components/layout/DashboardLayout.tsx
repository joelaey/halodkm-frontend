'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt';

interface DashboardLayoutProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'jamaah';
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useAuth();

    return (
        <ProtectedRoute requiredRole={requiredRole}>
            <div className="flex min-h-screen bg-[#FDFDFD]">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <main className="flex-1 md:ml-64 w-full transition-all duration-300">
                    {/* Mobile Header */}
                    <div className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <Menu size={24} className="text-gray-700" />
                        </button>
                        <h1 className="text-lg font-bold text-emerald-700">HaloDKM</h1>
                        <div className="w-10" /> {/* Spacer for centering */}
                    </div>

                    {/* Page content */}
                    <div className="p-4 sm:p-6 lg:p-10 animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
        </ProtectedRoute>
    );
}
