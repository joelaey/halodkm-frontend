'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toast, ConfirmDialog, type ToastType } from '@/components/ui/Toast';
import { apiService } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Event, EventTransaction, EventRecipient, EventPanitia, PendudukSearchResult } from '@/types';
import { ArrowLeft, Plus, X, TrendingUp, TrendingDown, CheckCircle, Download, Edit2, Trash2, Calendar, Users, DollarSign, UserPlus, Phone, MapPin, FileText, Search, Crown, User } from 'lucide-react';

type TabType = 'keuangan' | 'penerima' | 'panitia';

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

    // Panitia states
    const [panitia, setPanitia] = useState<EventPanitia[]>([]);
    const [showPanitiaForm, setShowPanitiaForm] = useState(false);
    const [editingPanitia, setEditingPanitia] = useState<EventPanitia | null>(null);
    const [panitiaFormData, setPanitiaFormData] = useState({
        nama: '',
        role: 'Anggota',
        no_hp: '',
        source_type: 'manual' as 'penduduk_tetap' | 'penduduk_khusus' | 'manual',
        source_id: undefined as number | undefined,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PendudukSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    const ROLE_OPTIONS = ['Ketua', 'Sekretaris', 'Bendahara', 'Anggota'];

    // Complete event states
    const [isCompleting, setIsCompleting] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);
    const [docFormData, setDocFormData] = useState({
        title: '',
        content: '',
    });
    const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

    const [isExporting, setIsExporting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType; title?: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isLoading: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { }, isLoading: false });

    const showToast = (message: string, type: ToastType, title?: string) => {
        setToast({ message, type, title });
    };

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchEventDetail();
        fetchRecipients();
        fetchPanitia();
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
            showToast('Gagal memuat data event', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRecipients = async () => {
        try {
            const response = await apiService.getEventRecipients(eventId);
            if (response.success && response.data) {
                const recipientData = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
                setRecipients(recipientData);
            }
        } catch (error) {
            console.error('Error fetching recipients:', error);
        }
    };

    const fetchPanitia = async () => {
        try {
            const response = await apiService.getEventPanitia(eventId);
            if (response.success && response.data) {
                const panitiaData = Array.isArray(response.data) ? response.data : [];
                setPanitia(panitiaData);
            }
        } catch (error) {
            console.error('Error fetching panitia:', error);
        }
    };

    // Search penduduk for panitia selector
    const handleSearchPenduduk = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }
        setIsSearching(true);
        try {
            const response = await apiService.searchPenduduk(query);
            if (response.success && response.data) {
                const results = Array.isArray(response.data) ? response.data : [];
                setSearchResults(results);
                setShowSearchDropdown(true);
            }
        } catch (error) {
            console.error('Error searching penduduk:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectPenduduk = (person: PendudukSearchResult) => {
        setPanitiaFormData({
            ...panitiaFormData,
            nama: person.nama,
            no_hp: person.no_hp || '',
            source_type: person.source_type,
            source_id: person.id,
        });
        setSearchQuery(person.nama);
        setShowSearchDropdown(false);
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
            showToast(editingTransaction ? 'Transaksi berhasil diperbarui' : 'Transaksi berhasil ditambahkan', 'success');
            resetTransForm();
            setShowTransForm(false);
            fetchEventDetail();
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Gagal menyimpan transaksi.', 'error');
        }
    };

    const handleDeleteTransaction = async (transId: number) => {
        if (!confirm('Hapus transaksi ini?')) return;
        try {
            await apiService.deleteEventTransaction(eventId, transId);
            showToast('Transaksi berhasil dihapus', 'success');
            fetchEventDetail();
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Gagal menghapus transaksi.', 'error');
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
            showToast(editingRecipient ? 'Penerima berhasil diperbarui' : 'Penerima berhasil ditambahkan', 'success');
            resetRecipientForm();
            setShowRecipientForm(false);
            fetchRecipients();
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Gagal menyimpan penerima.', 'error');
        }
    };

    const handleDeleteRecipient = async (recId: number) => {
        if (!confirm('Hapus penerima ini?')) return;
        try {
            await apiService.deleteEventRecipient(eventId, recId);
            showToast('Penerima berhasil dihapus', 'success');
            fetchRecipients();
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Gagal menghapus penerima.', 'error');
        }
    };

    // Panitia handlers
    const resetPanitiaForm = () => {
        setPanitiaFormData({ nama: '', role: 'Anggota', no_hp: '', source_type: 'manual', source_id: undefined });
        setSearchQuery('');
        setEditingPanitia(null);
    };

    const handleEditPanitia = (p: EventPanitia) => {
        setEditingPanitia(p);
        setPanitiaFormData({
            nama: p.nama,
            role: p.role,
            no_hp: p.no_hp || '',
            source_type: p.source_type,
            source_id: p.source_id,
        });
        setSearchQuery(p.nama);
        setShowPanitiaForm(true);
    };

    const handleSubmitPanitia = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!panitiaFormData.nama || !panitiaFormData.role) {
            showToast('Nama dan role harus diisi', 'warning');
            return;
        }
        try {
            if (editingPanitia) {
                await apiService.updateEventPanitia(eventId, editingPanitia.id, panitiaFormData);
            } else {
                await apiService.createEventPanitia(eventId, panitiaFormData);
            }
            showToast(editingPanitia ? 'Panitia berhasil diperbarui' : 'Panitia berhasil ditambahkan', 'success');
            resetPanitiaForm();
            setShowPanitiaForm(false);
            fetchPanitia();
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Gagal menyimpan panitia.', 'error');
        }
    };

    const handleDeletePanitia = async (pId: number) => {
        if (!confirm('Hapus panitia ini?')) return;
        try {
            await apiService.deleteEventPanitia(eventId, pId);
            showToast('Panitia berhasil dihapus', 'success');
            fetchPanitia();
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Gagal menghapus panitia.', 'error');
        }
    };

    const handleCompleteClick = () => {
        if (!event) return;
        if (summary.saldo < 0) {
            showToast('Tidak dapat menyelesaikan event dengan saldo negatif.', 'warning');
            return;
        }

        const msg = summary.saldo > 0
            ? `Saldo ${formatCurrency(summary.saldo)} akan ditransfer ke Kas Masjid.`
            : 'Yakin ingin menyelesaikan event ini?';

        setConfirmDialog({
            isOpen: true,
            title: `Selesaikan "${event.nama}"?`,
            message: msg,
            isLoading: false,
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isLoading: true }));
                try {
                    const response = await apiService.completeEvent(eventId);
                    if (response.success) {
                        setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
                        showToast(response.message || 'Event berhasil diselesaikan!', 'success');

                        // Show documentation modal
                        // Generate comprehensive report content
                        const generateReportContent = () => {
                            let content = `📋 LAPORAN EVENT: ${event.nama}\n`;
                            content += `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;

                            // Financial Summary
                            content += `💰 RINGKASAN KEUANGAN\n`;
                            content += `Total Pemasukan: ${formatCurrency(summary.total_masuk)}\n`;
                            content += `Total Pengeluaran: ${formatCurrency(summary.total_keluar)}\n`;
                            content += `Saldo Akhir: ${formatCurrency(summary.saldo)}`;
                            content += summary.saldo > 0 ? ' (ditransfer ke Kas Masjid)\n' : '\n';
                            content += '\n';

                            // Income Details
                            const incomeItems = transactions.filter(t => t.type === 'masuk');
                            if (incomeItems.length > 0) {
                                content += `📥 RINCIAN PEMASUKAN\n`;
                                incomeItems.forEach((t, i) => {
                                    content += `${i + 1}. ${t.description} - ${formatCurrency(t.amount)} (${new Date(t.tanggal).toLocaleDateString('id-ID')})\n`;
                                });
                                content += '\n';
                            }

                            // Expense Details
                            const expenseItems = transactions.filter(t => t.type === 'keluar');
                            if (expenseItems.length > 0) {
                                content += `📤 RINCIAN PENGELUARAN\n`;
                                expenseItems.forEach((t, i) => {
                                    content += `${i + 1}. ${t.description} - ${formatCurrency(t.amount)} (${new Date(t.tanggal).toLocaleDateString('id-ID')})\n`;
                                });
                                content += '\n';
                            }

                            // Panitia List
                            if (panitia.length > 0) {
                                content += `👥 PANITIA\n`;
                                panitia.forEach((p) => {
                                    content += `• ${p.nama} (${p.role})${p.no_hp ? ` - ${p.no_hp}` : ''}\n`;
                                });
                                content += '\n';
                            }

                            // Recipients (for distribusi events)
                            if (event.tipe === 'distribusi' && recipients.length > 0) {
                                content += `📦 PENERIMA BANTUAN (${recipients.length} orang)\n`;
                                recipients.forEach((r, i) => {
                                    let recipientLine = `${i + 1}. ${r.nama}`;
                                    if (r.jenis_bantuan) recipientLine += ` - ${r.jenis_bantuan}`;
                                    if (r.jumlah) recipientLine += ` (${r.jumlah})`;
                                    content += recipientLine + '\n';
                                });
                                content += '\n';
                            }

                            content += '--- Tambahkan notulensi/dokumentasi tambahan di bawah ini ---\n';
                            return content;
                        };

                        setDocFormData({
                            title: `Laporan Event: ${event.nama}`,
                            content: generateReportContent(),
                        });
                        setShowDocModal(true);
                        fetchEventDetail();
                    }
                } catch (error: any) {
                    showToast(error?.response?.data?.message || 'Gagal menyelesaikan event.', 'error');
                } finally {
                    setConfirmDialog(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const handleSubmitDoc = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docFormData.title.trim() || !docFormData.content.trim()) {
            showToast('Judul dan isi laporan harus diisi', 'warning');
            return;
        }

        setIsSubmittingDoc(true);
        try {
            await apiService.createInfoPublik({
                title: docFormData.title,
                content: docFormData.content,
                category: 'Kegiatan Masjid',
                tanggal: new Date().toISOString().split('T')[0],
            });
            showToast('Laporan event berhasil dipublikasikan ke Informasi!', 'success');
            setShowDocModal(false);
            setDocFormData({ title: '', content: '' });
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Gagal menyimpan laporan.', 'error');
        } finally {
            setIsSubmittingDoc(false);
        }
    };

    const handleSkipDoc = () => {
        setShowDocModal(false);
        setDocFormData({ title: '', content: '' });
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
            showToast('Gagal mengekspor data.', 'error');
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
                    <Button onClick={() => router.push('/event')} className="mt-4">Kembali</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        title={toast.title}
                        onClose={() => setToast(null)}
                    />
                )}
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    isLoading={confirmDialog.isLoading}
                    type="warning"
                />
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/event')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                        <Button onClick={handleCompleteClick} variant="secondary" icon={CheckCircle} className="!bg-green-500 !text-white hover:!bg-green-600">
                            Selesaikan Event
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('keuangan')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'keuangan' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                        <DollarSign className="w-4 h-4" /> Keuangan
                    </button>
                    <button
                        onClick={() => setActiveTab('panitia')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'panitia' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                        <Crown className="w-4 h-4" /> Panitia ({panitia.length})
                    </button>
                    {event.tipe === 'distribusi' && (
                        <button
                            onClick={() => setActiveTab('penerima')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'penerima' ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            <Users className="w-4 h-4" /> Penerima ({recipients.length})
                        </button>
                    )}
                </div>

                {/* Keuangan Tab */}
                {activeTab === 'keuangan' && (
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

                {/* Panitia Tab */}
                {activeTab === 'panitia' && (
                    <div className="space-y-4">
                        {isAdmin && event.status === 'aktif' && (
                            <Button onClick={() => { resetPanitiaForm(); setShowPanitiaForm(!showPanitiaForm); }} icon={showPanitiaForm ? X : UserPlus}>
                                {showPanitiaForm ? 'Tutup' : 'Tambah Panitia'}
                            </Button>
                        )}

                        {showPanitiaForm && isAdmin && (
                            <Card className="border-blue-200 ring-4 ring-blue-50">
                                <h3 className="font-bold text-lg mb-4">{editingPanitia ? 'Edit Panitia' : 'Tambah Panitia'}</h3>
                                <form onSubmit={handleSubmitPanitia} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Cari Penduduk (opsional)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                <Search className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                className="input !pl-10"
                                                value={searchQuery}
                                                onChange={(e) => handleSearchPenduduk(e.target.value)}
                                                onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                                                placeholder="Ketik nama untuk mencari..."
                                            />
                                            {showSearchDropdown && searchResults.length > 0 && (
                                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                    {searchResults.map((person) => (
                                                        <button
                                                            key={`${person.source_type}-${person.id}`}
                                                            type="button"
                                                            onClick={() => selectPenduduk(person)}
                                                            className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between border-b last:border-b-0"
                                                        >
                                                            <div>
                                                                <p className="font-medium text-gray-900">{person.nama}</p>
                                                                <p className="text-xs text-gray-500">{person.no_hp || 'No HP tidak tersedia'}</p>
                                                            </div>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${person.source_type === 'penduduk_tetap' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                                                {person.source_type === 'penduduk_tetap' ? 'Tetap' : 'Khusus'}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Atau isi manual di bawah</p>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Nama *</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={panitiaFormData.nama}
                                                onChange={(e) => setPanitiaFormData({ ...panitiaFormData, nama: e.target.value })}
                                                placeholder="Nama panitia"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Role/Jabatan *</label>
                                            <select
                                                className="input"
                                                value={panitiaFormData.role}
                                                onChange={(e) => setPanitiaFormData({ ...panitiaFormData, role: e.target.value })}
                                                required
                                            >
                                                {ROLE_OPTIONS.map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                                <option value="__custom__">Lainnya (Custom)</option>
                                            </select>
                                        </div>
                                    </div>
                                    {panitiaFormData.role === '__custom__' && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Role Custom</label>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Masukkan role custom"
                                                onChange={(e) => setPanitiaFormData({ ...panitiaFormData, role: e.target.value || 'Anggota' })}
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">No. HP</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={panitiaFormData.no_hp}
                                            onChange={(e) => setPanitiaFormData({ ...panitiaFormData, no_hp: e.target.value })}
                                            placeholder="08xxxxxxxxxx"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button type="submit" className="flex-1">{editingPanitia ? 'Update' : 'Simpan'}</Button>
                                        <Button type="button" variant="secondary" onClick={() => { setShowPanitiaForm(false); resetPanitiaForm(); }}>Batal</Button>
                                    </div>
                                </form>
                            </Card>
                        )}

                        <Card>
                            <h3 className="font-bold text-lg mb-4">Daftar Panitia</h3>
                            {panitia.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Belum ada panitia</p>
                            ) : (
                                <div className="space-y-3">
                                    {panitia.map((p) => (
                                        <div key={p.id} className="p-4 rounded-xl border border-blue-100 bg-blue-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${p.role === 'Ketua' ? 'bg-amber-500' : p.role === 'Sekretaris' ? 'bg-blue-500' : p.role === 'Bendahara' ? 'bg-green-500' : 'bg-gray-500'}`}>
                                                        {p.role === 'Ketua' ? <Crown className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{p.nama}</p>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.role === 'Ketua' ? 'bg-amber-100 text-amber-700' : p.role === 'Sekretaris' ? 'bg-blue-100 text-blue-700' : p.role === 'Bendahara' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                                {p.role}
                                                            </span>
                                                            {p.no_hp && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.no_hp}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isAdmin && event.status === 'aktif' && (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleEditPanitia(p)} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-gray-400 hover:text-blue-600" /></button>
                                                        <button onClick={() => handleDeletePanitia(p.id)} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" /></button>
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

                {/* Documentation Modal */}
                {showDocModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up">
                            <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-6">
                                <div className="flex items-center gap-3 text-white">
                                    <FileText className="w-8 h-8" />
                                    <div>
                                        <h3 className="text-xl font-bold">Publikasikan Laporan Event</h3>
                                        <p className="text-emerald-100 text-sm">Buat notulensi/dokumentasi untuk transparansi</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitDoc} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Judul Laporan</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={docFormData.title}
                                        onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                                        placeholder="Judul laporan event"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Isi Laporan / Notulensi</label>
                                    <textarea
                                        className="input h-48 resize-none"
                                        value={docFormData.content}
                                        onChange={(e) => setDocFormData({ ...docFormData, content: e.target.value })}
                                        placeholder="Tuliskan dokumentasi kegiatan, notulensi rapat, atau catatan penting lainnya..."
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <Button type="submit" className="flex-1" disabled={isSubmittingDoc}>
                                        {isSubmittingDoc ? 'Menyimpan...' : 'Publikasikan ke Informasi'}
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={handleSkipDoc}>
                                        Lewati
                                    </Button>
                                </div>

                                <p className="text-xs text-gray-500 text-center">
                                    Laporan akan dipublikasikan ke halaman Informasi & Kegiatan
                                </p>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
