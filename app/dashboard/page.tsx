'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users as UsersIcon } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiService } from '@/lib/api';
import type { DashboardStats, ChartData } from '@/types';

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        total_jamaah: 0,
        saldo_kas: 0,
        pemasukan_bulan_ini: 0,
        pengeluaran_bulan_ini: 0,
    });
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await apiService.getDashboardStats();
                if (response.success && response.data) {
                    // Map backend field names to frontend state
                    setStats({
                        total_jamaah: response.data.stats.total_jamaah || 0,
                        saldo_kas: response.data.stats.saldo_kas || 0,
                        pemasukan_bulan_ini: response.data.stats.total_pemasukan || 0,
                        pengeluaran_bulan_ini: response.data.stats.total_pengeluaran || 0,
                    });
                    setChartData(response.data.chart);
                }
            } catch (error) {
                console.error('Failed to load dashboard:', error);
                // Using dummy data for demo
                setStats({
                    total_jamaah: 245,
                    saldo_kas: 45000000,
                    pemasukan_bulan_ini: 8500000,
                    pengeluaran_bulan_ini: 3200000,
                });
                setChartData([
                    { label: 'RT 01', value: 78 },
                    { label: 'RT 02', value: 65 },
                    { label: 'RT 03', value: 52 },
                    { label: 'RT 04', value: 50 },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Dashboard</h2>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">Sistem Transparansi Kas & Data Jamaah Dusun</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    <StatCard
                        title="Saldo Kas Masjid"
                        value={`Rp ${stats.saldo_kas.toLocaleString('id-ID')}`}
                        icon={DollarSign}
                        color="bg-emerald-600"
                        highlight={true}
                    />
                    <StatCard
                        title="Pemasukan (Bulan Ini)"
                        value={`Rp ${stats.pemasukan_bulan_ini.toLocaleString('id-ID')}`}
                        icon={TrendingUp}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Pengeluaran (Bulan Ini)"
                        value={`Rp ${stats.pengeluaran_bulan_ini.toLocaleString('id-ID')}`}
                        icon={TrendingDown}
                        color="bg-orange-500"
                    />
                    <StatCard
                        title="Total Jamaah"
                        value={stats.total_jamaah}
                        icon={UsersIcon}
                        color="bg-blue-500"
                    />
                </div>

                {/* Chart Section */}
                <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
                    <div className="lg:col-span-2 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
                        <div className="mb-4 sm:mb-8">
                            <h3 className="font-bold text-lg sm:text-xl text-gray-900">Distribusi Jamaah per RT</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                Menampilkan perbandingan jumlah jamaah antar RT
                            </p>
                        </div>

                        {loading ? (
                            <div className="h-64 flex items-center justify-center text-gray-400">
                                Memuat data...
                            </div>
                        ) : (
                            <div className="h-64 flex items-end gap-6 px-4 pb-4 border-b border-gray-100 relative">
                                {chartData.map((item, i) => {
                                    const maxValue = Math.max(...chartData.map(d => d.value), 10);
                                    const heightPct = (item.value / maxValue) * 100;

                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 flex flex-col items-center gap-3 group cursor-pointer h-full justify-end"
                                        >
                                            <div
                                                className="w-full bg-emerald-500 rounded-t-xl group-hover:bg-emerald-600 transition-all relative flex justify-center shadow-sm"
                                                style={{ height: `${Math.max(heightPct, 5)}%` }}
                                            >
                                                <div className="absolute -top-10 bg-gray-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0 z-10 shadow-xl whitespace-nowrap">
                                                    {item.value} Jamaah
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                {item.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Info Panel */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-fit">
                        <h3 className="font-bold text-lg text-gray-900 mb-6">Informasi</h3>
                        <div className="space-y-6">
                            <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                                    <UsersIcon size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800">Transparansi Kas</h4>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        Semua data kas masjid dikelola oleh DKM dan dapat diakses secara real-time
                                        untuk transparansi penuh.
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-700">
                                <strong>HaloDKM:</strong> Sistem transparansi kas & data jamaah dusun untuk
                                meningkatkan kepercayaan dan keterbukaan.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
