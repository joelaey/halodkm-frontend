'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, X, Download, Edit2, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { KasTransaction, Event } from '@/types';

type PeriodType = 'bulan' | 'tahun' | 'semua';
type ExportType = 'bulan' | 'tahun' | 'semua' | 'event';

export default function KasMasjidPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<KasTransaction[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<PeriodType>('semua');
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportType, setExportType] = useState<ExportType>('semua');
    const [exportMonth, setExportMonth] = useState(new Date().getMonth());
    const [exportYear, setExportYear] = useState(new Date().getFullYear());
    const [editingTransaction, setEditingTransaction] = useState<KasTransaction | null>(null);

    const [formData, setFormData] = useState({
        type: 'masuk' as 'masuk' | 'keluar',
        amount: '',
        description: '',
        tanggal: new Date().toISOString().split('T')[0],
    });

    // Events for export by event feature
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [isExportingEvent, setIsExportingEvent] = useState(false);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchTransactions();
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await apiService.getEvents();
            if (response.success && response.data) {
                setEvents(response.data);
            }
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await apiService.getKasTransactions();
            if (response.success && response.data) {
                setTransactions(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load kas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter transactions based on selected period
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        return transactions.filter(t => {
            if (period === 'semua') return true;

            const tDate = new Date(t.tanggal);
            if (period === 'tahun') {
                return tDate.getFullYear() === currentYear;
            }
            // bulan
            return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
        });
    }, [transactions, period]);

    // Calculate summary based on filtered transactions
    const summary = useMemo(() => {
        const total_masuk = filteredTransactions
            .filter(t => t.type === 'masuk')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const total_keluar = filteredTransactions
            .filter(t => t.type === 'keluar')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // Saldo is always all-time
        const allTimeMasuk = transactions.filter(t => t.type === 'masuk').reduce((sum, t) => sum + Number(t.amount), 0);
        const allTimeKeluar = transactions.filter(t => t.type === 'keluar').reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            total_masuk,
            total_keluar,
            saldo: allTimeMasuk - allTimeKeluar
        };
    }, [filteredTransactions, transactions]);

    // Get available years from transactions
    const availableYears = useMemo(() => {
        const years = new Set(transactions.map(t => new Date(t.tanggal).getFullYear()));
        return Array.from(years).sort((a, b) => b - a); // Descending
    }, [transactions]);

    // Get available months for selected year
    const availableMonths = useMemo(() => {
        const months = new Set(
            transactions
                .filter(t => new Date(t.tanggal).getFullYear() === exportYear)
                .map(t => new Date(t.tanggal).getMonth())
        );
        return Array.from(months).sort((a, b) => a - b);
    }, [transactions, exportYear]);

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const periodLabels: Record<PeriodType, string> = {
        bulan: 'Bulan Ini',
        tahun: 'Tahun Ini',
        semua: 'Semua Waktu'
    };

    const exportToCSV = (exportPeriod: 'semua' | 'bulan' | 'tahun') => {
        if (transactions.length === 0) {
            alert('Tidak ada data untuk di-export');
            return;
        }

        // Filter transactions by selected export period
        const exportTransactions = transactions.filter(t => {
            if (exportPeriod === 'semua') return true;
            const tDate = new Date(t.tanggal);
            if (exportPeriod === 'tahun') {
                return tDate.getFullYear() === exportYear;
            }
            // bulan - use selected month and year
            return tDate.getFullYear() === exportYear && tDate.getMonth() === exportMonth;
        });

        if (exportTransactions.length === 0) {
            alert('Tidak ada data untuk periode ini');
            return;
        }

        const headers = ['Tanggal', 'Tipe', 'Deskripsi', 'Jumlah'];
        const rows = exportTransactions.map(t => [
            t.tanggal,
            t.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
            t.description,
            Number(t.amount)
        ]);

        // Add summary at the end
        const masuk = exportTransactions.filter(t => t.type === 'masuk').reduce((s, t) => s + Number(t.amount), 0);
        const keluar = exportTransactions.filter(t => t.type === 'keluar').reduce((s, t) => s + Number(t.amount), 0);
        rows.push([]);
        rows.push(['', '', 'Total Pemasukan', masuk]);
        rows.push(['', '', 'Total Pengeluaran', keluar]);
        rows.push(['', '', 'Selisih', masuk - keluar]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const periodName = exportPeriod === 'bulan' ? 'bulan_ini' : exportPeriod === 'tahun' ? 'tahun_ini' : 'semua';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kas_masjid_${periodName}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        setShowExportModal(false);
    };

    // Export event transactions
    const exportEventToCSV = async () => {
        if (!selectedEventId) {
            alert('Pilih event terlebih dahulu');
            return;
        }

        setIsExportingEvent(true);
        try {
            const response = await apiService.getEvent(selectedEventId);
            if (!response.success || !response.data) {
                alert('Gagal mengambil data event');
                return;
            }

            const { event, transactions: eventTrans, summary: eventSummary } = response.data;

            if (eventTrans.length === 0) {
                alert('Event tidak memiliki transaksi');
                return;
            }

            const headers = ['Tanggal', 'Tipe', 'Deskripsi', 'Jumlah'];
            const rows = eventTrans.map(t => [
                new Date(t.tanggal).toLocaleDateString('id-ID'),
                t.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
                t.description,
                t.amount
            ]);

            rows.push([]);
            rows.push(['', '', 'Total Pemasukan', eventSummary.total_masuk]);
            rows.push(['', '', 'Total Pengeluaran', eventSummary.total_keluar]);
            rows.push(['', '', 'Saldo', eventSummary.saldo]);

            const csvContent = [
                `Event: ${event.nama}`,
                `Status: ${event.status === 'aktif' ? 'Aktif' : 'Selesai'}`,
                '',
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            const safeName = event.nama.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `keuangan_event_${safeName}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            setShowExportModal(false);
        } catch (error) {
            console.error('Error exporting event:', error);
            alert('Gagal mengekspor data event.');
        } finally {
            setIsExportingEvent(false);
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'masuk',
            amount: '',
            description: '',
            tanggal: new Date().toISOString().split('T')[0],
        });
        setEditingTransaction(null);
    };

    const handleEdit = (transaction: KasTransaction) => {
        setEditingTransaction(transaction);
        setFormData({
            type: transaction.type,
            amount: String(transaction.amount),
            description: transaction.description,
            tanggal: transaction.tanggal,
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTransaction) {
                // Update existing transaction
                await apiService.updateKasTransaction(editingTransaction.id, {
                    ...formData,
                    amount: parseFloat(formData.amount),
                });
            } else {
                // Create new transaction
                await apiService.createKasTransaction({
                    ...formData,
                    amount: parseFloat(formData.amount),
                });
            }
            resetForm();
            setShowForm(false);
            fetchTransactions();
        } catch (error) {
            console.error('Failed to save transaction:', error);
            alert('Gagal menyimpan transaksi.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus transaksi ini?')) return;
        try {
            await apiService.deleteKasTransaction(id);
            fetchTransactions();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Gagal menghapus transaksi.');
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        resetForm();
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Transparansi Kas Masjid</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Data kas diperbarui secara real-time untuk transparansi penuh
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setShowExportModal(true)} variant="secondary" icon={Download}>
                            Export CSV
                        </Button>
                        {isAdmin && (
                            <Button onClick={() => { resetForm(); setShowForm(!showForm); }} icon={showForm ? X : Plus}>
                                {showForm ? 'Tutup' : 'Tambah Transaksi'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Export Modal */}
                {showExportModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Export Data Kas</h3>

                            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                                {(['semua', 'bulan', 'tahun', 'event'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setExportType(type as any)}
                                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition ${exportType === type
                                            ? 'bg-emerald-500 text-white shadow'
                                            : 'text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {type === 'semua' ? '📊 Semua' : type === 'bulan' ? '📅 Bulan' : type === 'tahun' ? '📆 Tahun' : '🎪 Event'}
                                    </button>
                                ))}
                            </div>

                            {/* Month Selector */}
                            {exportType === 'bulan' && (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Bulan</label>
                                        <select
                                            value={exportMonth}
                                            onChange={(e) => setExportMonth(Number(e.target.value))}
                                            className="input w-full"
                                        >
                                            {availableMonths.map((m) => (
                                                <option key={m} value={m}>{monthNames[m]}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tahun</label>
                                        <select
                                            value={exportYear}
                                            onChange={(e) => setExportYear(Number(e.target.value))}
                                            className="input w-full"
                                        >
                                            {availableYears.map((y) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Year Selector */}
                            {exportType === 'tahun' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tahun</label>
                                    <select
                                        value={exportYear}
                                        onChange={(e) => setExportYear(Number(e.target.value))}
                                        className="input w-full"
                                    >
                                        {availableYears.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Event Selector */}
                            {exportType === 'event' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Event</label>
                                    {events.length === 0 ? (
                                        <p className="text-sm text-gray-500 py-2">Tidak ada event tersedia</p>
                                    ) : (
                                        <select
                                            value={selectedEventId || ''}
                                            onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
                                            className="input w-full"
                                        >
                                            <option value="">-- Pilih Event --</option>
                                            {events.map((ev) => (
                                                <option key={ev.id} value={ev.id}>
                                                    {ev.nama} ({ev.status === 'aktif' ? 'Aktif' : 'Selesai'})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="flex-1 p-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => exportType === 'event' ? exportEventToCSV() : exportToCSV(exportType)}
                                    disabled={exportType === 'event' && (!selectedEventId || isExportingEvent)}
                                    className="flex-1 p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isExportingEvent ? 'Mengekspor...' : 'Download CSV'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="bg-emerald-50 border-emerald-200">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-emerald-600 font-bold">Total Pemasukan</p>
                                <p className="text-xl sm:text-2xl font-black text-emerald-700">
                                    Rp {summary.total_masuk.toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-orange-50 border-orange-200">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                                <TrendingDown size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-orange-600 font-bold">Total Pengeluaran</p>
                                <p className="text-xl sm:text-2xl font-black text-orange-700">
                                    Rp {summary.total_keluar.toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                        <div>
                            <p className="text-sm text-blue-600 font-bold mb-2">Sisa Saldo</p>
                            <p className="text-3xl font-black text-blue-700">
                                Rp {summary.saldo.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Add/Edit Transaction Form - Admin Only */}
                {showForm && isAdmin && (
                    <Card className="border-emerald-200 ring-4 ring-emerald-50">
                        <h3 className="font-bold text-lg mb-4">
                            {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tipe</label>
                                    <select
                                        className="input"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'masuk' | 'keluar' })}
                                    >
                                        <option value="masuk">Pemasukan</option>
                                        <option value="keluar">Pengeluaran</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.tanggal}
                                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah (Rp)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="1000000"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Keterangan</label>
                                <textarea
                                    className="input h-24 resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Contoh: Infaq Jumat, Renovasi Masjid, dll"
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" className="flex-1">
                                    {editingTransaction ? 'Update' : 'Simpan'}
                                </Button>
                                <Button type="button" variant="secondary" onClick={handleCloseForm}>Batal</Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Transaction List */}
                <Card>
                    <h3 className="font-bold text-lg mb-6">Riwayat Transaksi</h3>

                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Memuat data...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">Belum ada transaksi</div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${transaction.type === 'masuk' ? 'bg-emerald-500' : 'bg-orange-500'
                                                }`}
                                        >
                                            {transaction.type === 'masuk' ? (
                                                <TrendingUp size={20} />
                                            ) : (
                                                <TrendingDown size={20} />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{transaction.description}</h4>
                                            <p className="text-sm text-gray-500">
                                                {new Date(transaction.tanggal).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p
                                                className={`text-xl font-black ${transaction.type === 'masuk' ? 'text-emerald-600' : 'text-orange-600'
                                                    }`}
                                            >
                                                {transaction.type === 'masuk' ? '+' : '-'} Rp{' '}
                                                {Number(transaction.amount).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <div className="flex items-center gap-1 ml-4">
                                            <button
                                                onClick={() => handleEdit(transaction)}
                                                className="p-2 text-gray-400 hover:text-emerald-500 transition"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(transaction.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition"
                                                title="Hapus"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
