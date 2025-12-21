'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Event } from '@/types';
import { Calendar, Plus, X, TrendingUp, TrendingDown, CheckCircle, Clock, Eye, Edit2, Trash2, Users, DollarSign } from 'lucide-react';

const EVENT_TYPES = [
    { value: 'penggalangan_dana', label: 'Penggalangan Dana', icon: DollarSign, desc: 'Hanya transaksi keuangan' },
    { value: 'distribusi', label: 'Distribusi / Bantuan', icon: Users, desc: 'Keuangan + Daftar Penerima' },
];

export default function EventKeuanganPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const [formData, setFormData] = useState({
        nama: '',
        deskripsi: '',
        tipe: 'penggalangan_dana' as 'penggalangan_dana' | 'distribusi',
        tanggal_mulai: new Date().toISOString().split('T')[0],
    });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchEvents();
    }, [filterStatus]);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getEvents(filterStatus as any || undefined);
            if (response.success && response.data) {
                setEvents(response.data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nama: '',
            deskripsi: '',
            tipe: 'penggalangan_dana',
            tanggal_mulai: new Date().toISOString().split('T')[0],
        });
        setEditingEvent(null);
    };

    const handleEdit = (event: Event) => {
        setEditingEvent(event);
        setFormData({
            nama: event.nama,
            deskripsi: event.deskripsi || '',
            tipe: event.tipe || 'penggalangan_dana',
            tanggal_mulai: event.tanggal_mulai.split('T')[0],
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingEvent) {
                await apiService.updateEvent(editingEvent.id, formData);
            } else {
                await apiService.createEvent(formData);
            }
            resetForm();
            setShowForm(false);
            fetchEvents();
        } catch (error: any) {
            console.error('Failed to save event:', error);
            alert(error?.response?.data?.message || 'Gagal menyimpan event.');
        }
    };

    const handleDelete = async (id: number, nama: string) => {
        if (!confirm(`Hapus event "${nama}"? Event yang memiliki transaksi tidak dapat dihapus.`)) return;
        try {
            await apiService.deleteEvent(id);
            fetchEvents();
        } catch (error: any) {
            console.error('Failed to delete:', error);
            alert(error?.response?.data?.message || 'Gagal menghapus event.');
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        resetForm();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getTypeInfo = (tipe: string) => {
        return EVENT_TYPES.find(t => t.value === tipe) || EVENT_TYPES[0];
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Manajemen Event</h2>
                        <p className="text-gray-600 mt-1">Kelola event dan keuangannya (pengajian, kurban, zakat, dll)</p>
                    </div>
                    {isAdmin && (
                        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} icon={showForm ? X : Plus}>
                            {showForm ? 'Tutup' : 'Buat Event Baru'}
                        </Button>
                    )}
                </div>

                {/* Status Filter */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setFilterStatus('')}
                        className={`px-4 py-2 rounded-full font-medium transition-all ${filterStatus === '' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Semua ({events.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('aktif')}
                        className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${filterStatus === 'aktif' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <Clock className="w-4 h-4" /> Aktif
                    </button>
                    <button
                        onClick={() => setFilterStatus('selesai')}
                        className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${filterStatus === 'selesai' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <CheckCircle className="w-4 h-4" /> Selesai
                    </button>
                </div>

                {/* Create Event Form */}
                {showForm && isAdmin && (
                    <Card className="border-emerald-200 ring-4 ring-emerald-50">
                        <h3 className="font-bold text-lg mb-4">
                            {editingEvent ? 'Edit Event' : 'Buat Event Baru'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Event Type Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">Tipe Event</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {EVENT_TYPES.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, tipe: type.value as any })}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.tipe === type.value
                                                        ? 'border-emerald-500 bg-emerald-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${formData.tipe === type.value ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{type.label}</p>
                                                        <p className="text-sm text-gray-500">{type.desc}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Event</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.nama}
                                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                    placeholder="Contoh: Pengajian Malam Jumat, Qurban 1446H, Zakat Fitrah 1446H"
                                    required
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Mulai</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.tanggal_mulai}
                                        onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi (opsional)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.deskripsi}
                                        onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                                        placeholder="Keterangan singkat"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button type="submit" className="flex-1">
                                    {editingEvent ? 'Update Event' : 'Buat Event'}
                                </Button>
                                <Button type="button" variant="secondary" onClick={handleCloseForm}>Batal</Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Loading / Empty State */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                        <p className="mt-4 text-gray-600">Memuat data event...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Belum ada event</p>
                        {isAdmin && (
                            <p className="text-sm text-gray-500 mt-2">Klik "Buat Event Baru" untuk memulai</p>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {events.map((event) => {
                            const typeInfo = getTypeInfo(event.tipe);
                            const TypeIcon = typeInfo.icon;
                            return (
                                <div
                                    key={event.id}
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="text-lg font-bold text-gray-900">{event.nama}</h3>
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${event.status === 'aktif' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                    {event.status === 'aktif' ? 'Aktif' : 'Selesai'}
                                                </span>
                                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                                                    <TypeIcon className="w-3 h-3" />
                                                    {typeInfo.label}
                                                </span>
                                            </div>
                                            {event.deskripsi && (
                                                <p className="text-sm text-gray-500 mb-3">{event.deskripsi}</p>
                                            )}
                                            <p className="text-sm text-gray-500 mb-4">
                                                Mulai: {new Date(event.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                {event.tanggal_selesai && (
                                                    <> • Selesai: {new Date(event.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</>
                                                )}
                                            </p>

                                            {/* Financial Summary */}
                                            <div className={`grid gap-4 ${event.tipe === 'distribusi' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                                                <div className="bg-green-50 p-3 rounded-xl">
                                                    <div className="flex items-center gap-2 text-green-600 mb-1">
                                                        <TrendingUp className="w-4 h-4" />
                                                        <span className="text-xs font-medium">Pemasukan</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-green-700">{formatCurrency(event.total_masuk || 0)}</p>
                                                </div>
                                                <div className="bg-red-50 p-3 rounded-xl">
                                                    <div className="flex items-center gap-2 text-red-600 mb-1">
                                                        <TrendingDown className="w-4 h-4" />
                                                        <span className="text-xs font-medium">Pengeluaran</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-red-700">{formatCurrency(event.total_keluar || 0)}</p>
                                                </div>
                                                <div className="bg-emerald-50 p-3 rounded-xl">
                                                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                                        <span className="text-xs font-medium">Saldo</span>
                                                    </div>
                                                    <p className={`text-lg font-bold ${(event.saldo || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                                        {formatCurrency(event.saldo || 0)}
                                                    </p>
                                                </div>
                                                {event.tipe === 'distribusi' && (
                                                    <div className="bg-purple-50 p-3 rounded-xl">
                                                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                                                            <Users className="w-4 h-4" />
                                                            <span className="text-xs font-medium">Penerima</span>
                                                        </div>
                                                        <p className="text-lg font-bold text-purple-700">{event.total_recipients || 0} orang</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-start gap-1 ml-4">
                                            <button
                                                onClick={() => router.push(`/event-keuangan/${event.id}`)}
                                                className="p-2 hover:bg-emerald-50 rounded-lg transition-colors group"
                                                title="Lihat Detail"
                                            >
                                                <Eye className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" />
                                            </button>
                                            {isAdmin && event.status === 'aktif' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(event)}
                                                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                                                        title="Edit Event"
                                                    >
                                                        <Edit2 className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(event.id, event.nama)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                                        title="Hapus Event"
                                                    >
                                                        <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
