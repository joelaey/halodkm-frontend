'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Event, EventTransaction, EventRecipient } from '@/types';
import { ArrowLeft, Plus, X, TrendingUp, TrendingDown, CheckCircle, Download, Edit2, Trash2, Calendar, Users, DollarSign, UserPlus, Phone, MapPin } from 'lucide-react';

type TabType = 'keuangan' | 'penerima';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const eventId = parseInt(params.id as string);

    const [event, setEvent] = useState<Event | null>(null);
    const [transactions, setTransactions] = useState<EventTransaction[]>([]);
    const [recipients, setRecipients] = useState<EventRecipient[]>([]);
    const [summary, setSummary] = useState({ total_masuk: 0, total_keluar: 0, saldo: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('keuangan');

    // Transaction form states
    const [showTransForm, setShowTransForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<EventTransaction | null>(null);
    const [transFormData, setTransFormData] = useState({
        type: 'masuk' as 'masuk' | 'keluar',
        amount: '',
        description: '',
        tanggal: new Date().toISOString().split('T')[0],
    });

    // Recipient form states
    const [showRecipientForm, setShowRecipientForm] = useState(false);
    const [editingRecipient, setEditingRecipient] = useState<EventRecipient | null>(null);
    const [recipientFormData, setRecipientFormData] = useState({
        nama: '',
        alamat: '',
        no_hp: '',
        jenis_bantuan: '',
        jumlah: '',
        keterangan: '',
    });

    const [isCompleting, setIsCompleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchEventDetail();
        fetchRecipients();
    }, [eventId]);

    const fetchEventDetail = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getEvent(eventId);
            if (response.success && response.data) {
                setEvent(response.data.event);
                setTransactions(response.data.transactions);
                setSummary(response.data.summary);
            }
        } catch (error) {
            console.error('Error fetching event:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRecipients = async () => {
        try {
            const response = await apiService.getEventRecipients(eventId);
            if (response.success && response.data) {
                setRecipients(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching recipients:', error);
        }
    };

    // Transaction handlers
    const resetTransForm = () => {
        setTransFormData({ type: 'masuk', amount: '', description: '', tanggal: new Date().toISOString().split('T')[0] });
        setEditingTransaction(null);
    };

    const handleEditTransaction = (trans: EventTransaction) => {
        setEditingTransaction(trans);
        setTransFormData({ type: trans.type, amount: trans.amount.toString(), description: trans.description, tanggal: trans.tanggal.split('T')[0] });
        setShowTransForm(true);
    };

    const handleSubmitTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = { ...transFormData, amount: parseFloat(transFormData.amount) };
            if (editingTransaction) {
                await apiService.updateEventTransaction(eventId, editingTransaction.id, data);
            } else {
                await apiService.createEventTransaction(eventId, data);
            }
            resetTransForm();
            setShowTransForm(false);
            fetchEventDetail();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Gagal menyimpan transaksi.');
        }
    };

    const handleDeleteTransaction = async (transId: number) => {
        if (!confirm('Hapus transaksi ini?')) return;
        try {
            await apiService.deleteEventTransaction(eventId, transId);
            fetchEventDetail();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Gagal menghapus transaksi.');
        }
    };

    // Recipient handlers
    const resetRecipientForm = () => {
        setRecipientFormData({ nama: '', alamat: '', no_hp: '', jenis_bantuan: '', jumlah: '', keterangan: '' });
        setEditingRecipient(null);
    };

    const handleEditRecipient = (rec: EventRecipient) => {
        setEditingRecipient(rec);
        setRecipientFormData({
            nama: rec.nama,
            alamat: rec.alamat || '',
            no_hp: rec.no_hp || '',
            jenis_bantuan: rec.jenis_bantuan || '',
            jumlah: rec.jumlah || '',
            keterangan: rec.keterangan || '',
        });
        setShowRecipientForm(true);
    };

    const handleSubmitRecipient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRecipient) {
                await apiService.updateEventRecipient(eventId, editingRecipient.id, recipientFormData);
            } else {
                await apiService.createEventRecipient(eventId, recipientFormData);
            }
            resetRecipientForm();
            setShowRecipientForm(false);
            fetchRecipients();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Gagal menyimpan penerima.');
        }
    };

    const handleDeleteRecipient = async (recId: number) => {
        if (!confirm('Hapus penerima ini?')) return;
        try {
            await apiService.deleteEventRecipient(eventId, recId);
            fetchRecipients();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Gagal menghapus penerima.');
        }
    };

    const handleComplete = async () => {
        if (!event) return;
        if (summary.saldo < 0) {
            alert('Tidak dapat menyelesaikan event dengan saldo negatif.');
            return;
        }
        const msg = summary.saldo > 0
            ? `Selesaikan event "${event.nama}"? Saldo ${formatCurrency(summary.saldo)} akan ditransfer ke Kas Masjid.`
            : `Selesaikan event "${event.nama}"?`;
        if (!confirm(msg)) return;

        setIsCompleting(true);
        try {
            const response = await apiService.completeEvent(eventId);
            if (response.success) {
                alert(response.message || 'Event berhasil diselesaikan.');
                fetchEventDetail();
            }
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Gagal menyelesaikan event.');
        } finally {
            setIsCompleting(false);
        }
    };

    const exportToCSV = async () => {
        if (!event) return;
        setIsExporting(true);
        try {
            let rows: string[][] = [];

            // Export transactions
            rows.push(['=== TRANSAKSI KEUANGAN ===', '', '', '']);
            rows.push(['Tanggal', 'Tipe', 'Jumlah', 'Deskripsi']);
            transactions.forEach(t => {
                rows.push([new Date(t.tanggal).toLocaleDateString('id-ID'), t.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran', t.amount.toString(), t.description]);
            });
            rows.push(['', '', '', '']);
            rows.push(['Total Pemasukan', '', summary.total_masuk.toString(), '']);
            rows.push(['Total Pengeluaran', '', summary.total_keluar.toString(), '']);
            rows.push(['Saldo', '', summary.saldo.toString(), '']);

            // Export recipients if distribusi event
            if (event.tipe === 'distribusi' && recipients.length > 0) {
                rows.push(['', '', '', '']);
                rows.push(['=== DAFTAR PENERIMA ===', '', '', '']);
                rows.push(['Nama', 'Alamat', 'No HP', 'Jenis Bantuan', 'Jumlah', 'Keterangan']);
                recipients.forEach(r => {
                    rows.push([r.nama, r.alamat || '-', r.no_hp || '-', r.jenis_bantuan || '-', r.jumlah || '-', r.keterangan || '-']);
                });
                rows.push(['', '', '', '']);
                rows.push([`Total Penerima: ${recipients.length} orang`, '', '', '']);
            }

            const csvContent = [
                `Event: ${event.nama}`,
                `Tipe: ${event.tipe === 'penggalangan_dana' ? 'Penggalangan Dana' : 'Distribusi/Bantuan'}`,
                `Status: ${event.status === 'aktif' ? 'Aktif' : 'Selesai'}`,
                '',
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const safeName = event.nama.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `event_${safeName}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Gagal mengekspor data.');
        } finally {
            setIsExporting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                    <p className="mt-4 text-gray-600">Memuat data event...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!event) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-gray-600">Event tidak ditemukan</p>
                    <Button onClick={() => router.push('/event-keuangan')} className="mt-4">Kembali</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/event-keuangan')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-bold text-gray-900">{event.nama}</h2>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${event.status === 'aktif' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {event.status === 'aktif' ? 'Aktif' : 'Selesai'}
                            </span>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${event.tipe === 'distribusi' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                                {event.tipe === 'distribusi' ? '📦 Distribusi' : '💰 Penggalangan Dana'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{event.deskripsi || 'Mulai: ' + new Date(event.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className={`grid gap-4 ${event.tipe === 'distribusi' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                    <Card className="!p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-500 rounded-lg"><TrendingUp className="w-5 h-5 text-white" /></div>
                            <span className="text-sm font-medium text-green-700">Total Pemasukan</span>
                        </div>
                        <p className="text-2xl font-bold text-green-800">{formatCurrency(summary.total_masuk)}</p>
                    </Card>
                    <Card className="!p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-500 rounded-lg"><TrendingDown className="w-5 h-5 text-white" /></div>
                            <span className="text-sm font-medium text-red-700">Total Pengeluaran</span>
                        </div>
                        <p className="text-2xl font-bold text-red-800">{formatCurrency(summary.total_keluar)}</p>
                    </Card>
                    <Card className={`!p-6 ${summary.saldo >= 0 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${summary.saldo >= 0 ? 'bg-emerald-500' : 'bg-orange-500'}`}><DollarSign className="w-5 h-5 text-white" /></div>
                            <span className={`text-sm font-medium ${summary.saldo >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>Saldo Event</span>
                        </div>
                        <p className={`text-2xl font-bold ${summary.saldo >= 0 ? 'text-emerald-800' : 'text-orange-800'}`}>{formatCurrency(summary.saldo)}</p>
                    </Card>
                    {event.tipe === 'distribusi' && (
                        <Card className="!p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-500 rounded-lg"><Users className="w-5 h-5 text-white" /></div>
                                <span className="text-sm font-medium text-purple-700">Total Penerima</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-800">{recipients.length} orang</p>
                        </Card>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    <Button onClick={exportToCSV} variant="secondary" icon={Download} disabled={isExporting}>
                        {isExporting ? 'Mengekspor...' : 'Export CSV'}
                    </Button>
                    {isAdmin && event.status === 'aktif' && (
                        <Button onClick={handleComplete} variant="secondary" icon={CheckCircle} disabled={isCompleting} className="!bg-green-500 !text-white hover:!bg-green-600">
                            {isCompleting ? 'Memproses...' : 'Selesaikan Event'}
                        </Button>
                    )}
                </div>

                {/* Tabs for distribusi events */}
                {event.tipe === 'distribusi' && (
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('keuangan')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'keuangan' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            <DollarSign className="w-4 h-4" /> Keuangan
                        </button>
                        <button
                            onClick={() => setActiveTab('penerima')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'penerima' ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            <Users className="w-4 h-4" /> Penerima ({recipients.length})
                        </button>
                    </div>
                )}

                {/* Keuangan Tab */}
                {(event.tipe === 'penggalangan_dana' || activeTab === 'keuangan') && (
                    <div className="space-y-4">
                        {isAdmin && event.status === 'aktif' && (
                            <Button onClick={() => { resetTransForm(); setShowTransForm(!showTransForm); }} icon={showTransForm ? X : Plus}>
                                {showTransForm ? 'Tutup' : 'Tambah Transaksi'}
                            </Button>
                        )}

                        {showTransForm && isAdmin && event.status === 'aktif' && (
                            <Card className="border-emerald-200 ring-4 ring-emerald-50">
                                <h3 className="font-bold text-lg mb-4">{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
                                <form onSubmit={handleSubmitTransaction} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Tipe</label>
                                            <select className="input" value={transFormData.type} onChange={(e) => setTransFormData({ ...transFormData, type: e.target.value as any })}>
                                                <option value="masuk">Pemasukan</option>
                                                <option value="keluar">Pengeluaran</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal</label>
                                            <input type="date" className="input" value={transFormData.tanggal} onChange={(e) => setTransFormData({ ...transFormData, tanggal: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah (Rp)</label>
                                            <input type="number" className="input" value={transFormData.amount} onChange={(e) => setTransFormData({ ...transFormData, amount: e.target.value })} placeholder="0" min="1" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi</label>
                                            <input type="text" className="input" value={transFormData.description} onChange={(e) => setTransFormData({ ...transFormData, description: e.target.value })} placeholder="Keterangan transaksi" required />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button type="submit" className="flex-1">{editingTransaction ? 'Update' : 'Simpan'}</Button>
                                        <Button type="button" variant="secondary" onClick={() => { setShowTransForm(false); resetTransForm(); }}>Batal</Button>
                                    </div>
                                </form>
                            </Card>
                        )}

                        <Card>
                            <h3 className="font-bold text-lg mb-4">Riwayat Transaksi</h3>
                            {transactions.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Belum ada transaksi</p>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((trans) => (
                                        <div key={trans.id} className={`p-4 rounded-xl border ${trans.type === 'masuk' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${trans.type === 'masuk' ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        {trans.type === 'masuk' ? <TrendingUp className="w-4 h-4 text-white" /> : <TrendingDown className="w-4 h-4 text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{trans.description}</p>
                                                        <p className="text-sm text-gray-500">{new Date(trans.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-lg font-bold ${trans.type === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {trans.type === 'masuk' ? '+' : '-'}{formatCurrency(trans.amount)}
                                                    </span>
                                                    {isAdmin && event.status === 'aktif' && (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleEditTransaction(trans)} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-gray-400 hover:text-blue-600" /></button>
                                                            <button onClick={() => handleDeleteTransaction(trans.id)} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* Penerima Tab */}
                {event.tipe === 'distribusi' && activeTab === 'penerima' && (
                    <div className="space-y-4">
                        {isAdmin && event.status === 'aktif' && (
                            <Button onClick={() => { resetRecipientForm(); setShowRecipientForm(!showRecipientForm); }} icon={showRecipientForm ? X : UserPlus}>
                                {showRecipientForm ? 'Tutup' : 'Tambah Penerima'}
                            </Button>
                        )}

                        {showRecipientForm && isAdmin && (
                            <Card className="border-purple-200 ring-4 ring-purple-50">
                                <h3 className="font-bold text-lg mb-4">{editingRecipient ? 'Edit Penerima' : 'Tambah Penerima'}</h3>
                                <form onSubmit={handleSubmitRecipient} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Nama Penerima *</label>
                                            <input type="text" className="input" value={recipientFormData.nama} onChange={(e) => setRecipientFormData({ ...recipientFormData, nama: e.target.value })} placeholder="Nama lengkap" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">No. HP</label>
                                            <input type="text" className="input" value={recipientFormData.no_hp} onChange={(e) => setRecipientFormData({ ...recipientFormData, no_hp: e.target.value })} placeholder="08xxxxxxxxxx" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Alamat</label>
                                        <input type="text" className="input" value={recipientFormData.alamat} onChange={(e) => setRecipientFormData({ ...recipientFormData, alamat: e.target.value })} placeholder="Alamat penerima" />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Bantuan</label>
                                            <input type="text" className="input" value={recipientFormData.jenis_bantuan} onChange={(e) => setRecipientFormData({ ...recipientFormData, jenis_bantuan: e.target.value })} placeholder="Misal: Daging Sapi, Beras, dll" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah</label>
                                            <input type="text" className="input" value={recipientFormData.jumlah} onChange={(e) => setRecipientFormData({ ...recipientFormData, jumlah: e.target.value })} placeholder="Misal: 2 kg, 1 paket" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Keterangan</label>
                                        <input type="text" className="input" value={recipientFormData.keterangan} onChange={(e) => setRecipientFormData({ ...recipientFormData, keterangan: e.target.value })} placeholder="Keterangan tambahan (opsional)" />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button type="submit" className="flex-1">{editingRecipient ? 'Update' : 'Simpan'}</Button>
                                        <Button type="button" variant="secondary" onClick={() => { setShowRecipientForm(false); resetRecipientForm(); }}>Batal</Button>
                                    </div>
                                </form>
                            </Card>
                        )}

                        <Card>
                            <h3 className="font-bold text-lg mb-4">Daftar Penerima</h3>
                            {recipients.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Belum ada penerima</p>
                            ) : (
                                <div className="space-y-3">
                                    {recipients.map((rec) => (
                                        <div key={rec.id} className="p-4 rounded-xl border border-purple-100 bg-purple-50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900">{rec.nama}</p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                                                        {rec.alamat && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {rec.alamat}</span>}
                                                        {rec.no_hp && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {rec.no_hp}</span>}
                                                    </div>
                                                    {(rec.jenis_bantuan || rec.jumlah) && (
                                                        <div className="mt-2 flex gap-2">
                                                            {rec.jenis_bantuan && <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs font-medium rounded">{rec.jenis_bantuan}</span>}
                                                            {rec.jumlah && <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs font-medium rounded">{rec.jumlah}</span>}
                                                        </div>
                                                    )}
                                                    {rec.keterangan && <p className="mt-2 text-sm text-gray-500">{rec.keterangan}</p>}
                                                </div>
                                                {isAdmin && event.status === 'aktif' && (
                                                    <div className="flex items-center gap-1 ml-2">
                                                        <button onClick={() => handleEditRecipient(rec)} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-gray-400 hover:text-blue-600" /></button>
                                                        <button onClick={() => handleDeleteRecipient(rec.id)} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* Completed event info */}
                {event.status === 'selesai' && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-800">Event Selesai</p>
                                <p className="text-sm text-green-600">
                                    Event ini telah diselesaikan{event.tanggal_selesai ? ` pada ${new Date(event.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}.
                                    {summary.saldo > 0 && ` Sisa dana sebesar ${formatCurrency(summary.saldo)} telah ditransfer ke Kas Masjid.`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
