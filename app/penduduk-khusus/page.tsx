'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { PendudukKhusus } from '@/types';
import { UserCheck, Plus, Trash2, X, Download, Edit2, Phone, MapPin, Tag, FileText } from 'lucide-react';

const LABEL_OPTIONS = [
    { value: 'kontrak', label: 'Kontrak', color: 'bg-blue-100 text-blue-700' },
    { value: 'pedagang', label: 'Pedagang', color: 'bg-amber-100 text-amber-700' },
    { value: 'warga_dusun_lain', label: 'Warga Dusun Lain', color: 'bg-purple-100 text-purple-700' },
];

export default function PendudukKhususPage() {
    const { user } = useAuth();
    const [pendudukList, setPendudukList] = useState<PendudukKhusus[]>([]);
    const [labelCounts, setLabelCounts] = useState({ kontrak: 0, pedagang: 0, warga_dusun_lain: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterLabel, setFilterLabel] = useState<string>('');
    const [editingPenduduk, setEditingPenduduk] = useState<PendudukKhusus | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [formData, setFormData] = useState({
        nik: '',
        nama: '',
        jenis_kelamin: 'Laki-laki',
        alamat: '',
        no_hp: '',
        label: 'kontrak' as 'kontrak' | 'pedagang' | 'warga_dusun_lain',
        keterangan: '',
    });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchPenduduk();
    }, [filterLabel]);

    const fetchPenduduk = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getPendudukKhusus(filterLabel || undefined);
            if (response.success && response.data) {
                setPendudukList(response.data.data);
                setLabelCounts(response.data.labelCounts);
            }
        } catch (error) {
            console.error('Error fetching penduduk khusus:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nik: '',
            nama: '',
            jenis_kelamin: 'Laki-laki',
            alamat: '',
            no_hp: '',
            label: 'kontrak',
            keterangan: '',
        });
        setEditingPenduduk(null);
    };

    const handleEdit = (penduduk: PendudukKhusus) => {
        setEditingPenduduk(penduduk);
        setFormData({
            nik: penduduk.nik,
            nama: penduduk.nama,
            jenis_kelamin: penduduk.jenis_kelamin,
            alamat: penduduk.alamat || '',
            no_hp: penduduk.no_hp || '',
            label: penduduk.label,
            keterangan: penduduk.keterangan || '',
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPenduduk) {
                await apiService.updatePendudukKhusus(editingPenduduk.id, formData);
            } else {
                await apiService.createPendudukKhusus(formData);
            }
            resetForm();
            setShowForm(false);
            fetchPenduduk();
        } catch (error: any) {
            console.error('Failed to save penduduk khusus:', error);
            if (error?.response?.data?.message) {
                alert(error.response.data.message);
            } else {
                alert('Gagal menyimpan data. Silakan coba lagi.');
            }
        }
    };

    const handleDelete = async (id: number, nama: string) => {
        if (!confirm(`Hapus data "${nama}"?`)) return;
        try {
            await apiService.deletePendudukKhusus(id);
            fetchPenduduk();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Gagal menghapus data.');
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        resetForm();
    };

    // Export function with options for "Penduduk Khusus saja" or "Semua Penduduk"
    const exportToCSV = async (exportType: 'khusus' | 'semua') => {
        setIsExporting(true);
        try {
            let rows: string[][] = [];
            const headers = ['Tipe', 'NIK', 'Nama', 'Jenis Kelamin', 'Alamat', 'No HP', 'Label/RT', 'Keterangan'];

            if (exportType === 'khusus' || exportType === 'semua') {
                // Get penduduk khusus data
                const pkResponse = await apiService.getPendudukKhusus();
                if (pkResponse.success && pkResponse.data) {
                    pkResponse.data.data.forEach((p) => {
                        const labelInfo = LABEL_OPTIONS.find(l => l.value === p.label);
                        rows.push([
                            'Penduduk Khusus',
                            p.nik,
                            p.nama,
                            p.jenis_kelamin,
                            p.alamat || '-',
                            p.no_hp || '-',
                            labelInfo?.label || p.label,
                            p.keterangan || '-'
                        ]);
                    });
                }
            }

            if (exportType === 'semua') {
                // Get penduduk tetap (family members)
                const familiesResponse = await apiService.getFamilies();
                if (familiesResponse.success && familiesResponse.data) {
                    for (const family of familiesResponse.data) {
                        const membersResponse = await apiService.getFamilyMembers(family.id);
                        if (membersResponse.success && membersResponse.data) {
                            membersResponse.data.forEach((m) => {
                                rows.push([
                                    'Penduduk Tetap',
                                    m.nik,
                                    m.nama,
                                    m.jenis_kelamin,
                                    family.alamat || '-',
                                    family.no_hp || '-',
                                    family.rt,
                                    m.hubungan
                                ]);
                            });
                        }
                    }
                }
            }

            if (rows.length === 0) {
                alert('Tidak ada data untuk di-export');
                return;
            }

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = exportType === 'semua' ? 'semua_penduduk' : 'penduduk_khusus';
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            setShowExportModal(false);
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Gagal mengekspor data.');
        } finally {
            setIsExporting(false);
        }
    };

    const getLabelStyle = (label: string) => {
        const option = LABEL_OPTIONS.find(l => l.value === label);
        return option?.color || 'bg-gray-100 text-gray-700';
    };

    const getLabelText = (label: string) => {
        const option = LABEL_OPTIONS.find(l => l.value === label);
        return option?.label || label;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Data Penduduk Khusus</h2>
                        <p className="text-gray-600 mt-1">Data penduduk kontrak, pedagang, dan warga dusun lain</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setShowExportModal(true)}
                            variant="secondary"
                            icon={Download}
                        >
                            Export CSV
                        </Button>
                        {isAdmin && (
                            <Button onClick={() => { resetForm(); setShowForm(!showForm); }} icon={showForm ? X : Plus}>
                                {showForm ? 'Tutup' : 'Tambah Data'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Label Filter Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div
                        onClick={() => setFilterLabel('')}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${filterLabel === '' ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-gray-50 border border-gray-100'}`}
                    >
                        <p className={`text-sm font-medium ${filterLabel === '' ? 'text-emerald-100' : 'text-gray-500'}`}>Semua</p>
                        <p className="text-2xl font-bold">{labelCounts.kontrak + labelCounts.pedagang + labelCounts.warga_dusun_lain}</p>
                    </div>
                    {LABEL_OPTIONS.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => setFilterLabel(filterLabel === option.value ? '' : option.value)}
                            className={`p-4 rounded-xl cursor-pointer transition-all ${filterLabel === option.value ? 'ring-2 ring-emerald-500' : ''} bg-white hover:bg-gray-50 border border-gray-100`}
                        >
                            <p className="text-sm font-medium text-gray-500">{option.label}</p>
                            <p className="text-2xl font-bold">{labelCounts[option.value as keyof typeof labelCounts]}</p>
                        </div>
                    ))}
                </div>

                {/* Add/Edit Form */}
                {showForm && isAdmin && (
                    <Card className="border-emerald-200 ring-4 ring-emerald-50">
                        <h3 className="font-bold text-lg mb-4">
                            {editingPenduduk ? 'Edit Data Penduduk Khusus' : 'Tambah Penduduk Khusus Baru'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">NIK</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.nik}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                                            setFormData({ ...formData, nik: value });
                                        }}
                                        placeholder="16 digit NIK"
                                        maxLength={16}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        placeholder="Nama lengkap"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Kelamin</label>
                                    <select
                                        className="input"
                                        value={formData.jenis_kelamin}
                                        onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                                    >
                                        <option value="Laki-laki">Laki-laki</option>
                                        <option value="Perempuan">Perempuan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Label/Kategori</label>
                                    <select
                                        className="input"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value as any })}
                                    >
                                        {LABEL_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">No. HP</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.no_hp}
                                        onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Alamat</label>
                                <textarea
                                    className="input h-20 resize-none"
                                    value={formData.alamat}
                                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                                    placeholder="Alamat tinggal"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Keterangan</label>
                                <textarea
                                    className="input h-16 resize-none"
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                    placeholder="Keterangan tambahan (opsional)"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" className="flex-1">
                                    {editingPenduduk ? 'Update' : 'Simpan'}
                                </Button>
                                <Button type="button" variant="secondary" onClick={handleCloseForm}>Batal</Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Data List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                        <p className="mt-4 text-gray-600">Memuat data penduduk khusus...</p>
                    </div>
                ) : pendudukList.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl">
                        <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Belum ada data penduduk khusus</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pendudukList.map((penduduk) => (
                            <div
                                key={penduduk.id}
                                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{penduduk.nama}</h3>
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getLabelStyle(penduduk.label)}`}>
                                                {getLabelText(penduduk.label)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-3">NIK: {penduduk.nik}</p>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            <span>{penduduk.jenis_kelamin}</span>
                                            {penduduk.alamat && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{penduduk.alamat}</span>
                                                </div>
                                            )}
                                            {penduduk.no_hp && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="w-4 h-4" />
                                                    <span>{penduduk.no_hp}</span>
                                                </div>
                                            )}
                                        </div>
                                        {penduduk.keterangan && (
                                            <div className="mt-2 flex items-start gap-1 text-sm text-gray-500">
                                                <FileText className="w-4 h-4 mt-0.5" />
                                                <span>{penduduk.keterangan}</span>
                                            </div>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEdit(penduduk)}
                                                className="p-2 hover:bg-emerald-50 rounded-lg transition-colors group"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(penduduk.id, penduduk.nama)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Export Modal */}
                {showExportModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                            <h3 className="text-lg font-bold mb-4">Export Data Penduduk</h3>
                            <p className="text-gray-600 mb-6">Pilih data yang ingin di-export:</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => exportToCSV('khusus')}
                                    disabled={isExporting}
                                    className="w-full p-4 text-left rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                                >
                                    <p className="font-semibold">Penduduk Khusus Saja</p>
                                    <p className="text-sm text-gray-500">Export data kontrak, pedagang, warga dusun lain</p>
                                </button>
                                <button
                                    onClick={() => exportToCSV('semua')}
                                    disabled={isExporting}
                                    className="w-full p-4 text-left rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                                >
                                    <p className="font-semibold">Semua Penduduk</p>
                                    <p className="text-sm text-gray-500">Export penduduk tetap + penduduk khusus</p>
                                </button>
                            </div>
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
