'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth-context';
import { apiService } from '@/lib/api';
import { ClipboardList, Shield, Clock, User } from 'lucide-react';

interface AuditLog {
    id: number;
    user_id: number;
    username?: string;
    action: string;
    created_at: string;
}

export default function LogsPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (isAdmin) {
            fetchLogs();
        }
    }, [isAdmin]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getAuditLogs();
            if (response.success && response.data) {
                setLogs(response.data);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Akses Ditolak</h2>
                    <p className="text-gray-600 mt-2">Halaman ini hanya untuk Admin</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
                    <p className="text-gray-600 mt-1">Semua aktivitas perubahan dalam aplikasi</p>
                </div>

                {/* Logs List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                        <p className="mt-4 text-gray-600">Memuat logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl">
                        <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Belum ada activity log</p>
                    </div>
                ) : (
                    <Card>
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900">{log.action}</p>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {log.username || `User ID: ${log.user_id}`}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.created_at).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
