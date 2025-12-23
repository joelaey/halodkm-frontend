'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'jamaah';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }

        if (!isLoading && user && requiredRole && user.role !== requiredRole && requiredRole === 'admin') {
            // If admin required but user is not admin, redirect to dashboard
            router.replace('/dashboard');
        }
    }, [user, isLoading, router, requiredRole]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (requiredRole === 'admin' && user.role !== 'admin') {
        return null;
    }

    return <>{children}</>;
}
