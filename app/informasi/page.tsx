'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { InfoPublik } from '@/types';
import { Calendar, Tag, Megaphone, Landmark, Users as UsersIcon, Plus, Trash2, X, Edit2 } from 'lucide-react';

export default function InformasiPage() {
    const { user } = useAuth();
    const [infoList, setInfoList] = useState<InfoPublik[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedInfo, setSelectedInfo] = useState<InfoPublik | null>(null);
    const [editingInfo, setEditingInfo] = useState<InfoPublik | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'Kegiatan Masjid',
        tanggal: new Date().toISOString().split('T')[0],
    });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchInfo();
    }, []);

    const fetchInfo = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getInfoPublik();
            if (response.success && response.data) {
                setInfoList(response.data);
            }
        } catch (error) {
            console.error('Error fetching info:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            category: 'Kegiatan Masjid',
            tanggal: new Date().toISOString().split('T')[0],
        });
        setEditingInfo(null);
    };

    const handleEdit = (info: InfoPublik) => {
        setEditingInfo(info);
        setFormData({
            title: info.title,
            content: info.content,
            category: info.category,
            tanggal: info.tanggal,
        });
        setShowForm(true);
        setSelectedInfo(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingInfo) {
                await apiService.updateInfoPublik(editingInfo.id, formData);
            } else {
                await apiService.createInfoPublik(formData);
            }
            resetForm();
            setShowForm(false);
            fetchInfo();
        } catch (error) {
            console.error('Failed to save info:', error);
            alert('Gagal menyimpan informasi.');
        }
    };

    const handleDelete = async (id: number, title: string) => {
        if (!confirm(`Hapus "${title}"?`)) return;
        try {
            await apiService.deleteInfoPublik(id);
            fetchInfo();
        } catch (error) {
            console.error('Failed to delete info:', error);
            alert('Gagal menghapus informasi.');
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        resetForm();
    };

    const filteredInfo = selectedCategory === 'All'
        ? infoList
        : infoList.filter(info => info.category === selectedCategory);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Kegiatan Masjid':
                return <Landmark className="w-5 h-5" />;
            case 'Kegiatan Dusun':
                return <UsersIcon className="w-5 h-5" />;
            case 'Pengumuman':
                return <Megaphone className="w-5 h-5" />;
            default:
                return <Tag className="w-5 h-5" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Kegiatan Masjid':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Kegiatan Dusun':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Pengumuman':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const categories = ['All', 'Kegiatan Masjid', 'Kegiatan Dusun', 'Pengumuman'];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Informasi & Kegiatan</h2>
                        <p className="text-gray-600 mt-1">Informasi kegiatan masjid, dusun, dan pengumuman</p>
                    </div>
                    {isAdmin && (
                        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} icon={showForm ? X : Plus}>
                            {showForm ? 'Tutup' : 'Tambah Informasi'}
                        </Button>
                    )}
                </div>

                {/* Add/Edit Info Form */}
                {showForm && isAdmin && (
                    <Card className="border-emerald-200 ring-4 ring-emerald-50">
                        <h3 className="font-bold text-lg mb-4">
                            {editingInfo ? 'Edit Informasi' : 'Tambah Informasi Baru'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
                                    <select
                                        className="input"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Kegiatan Masjid">Kegiatan Masjid</option>
                                        <option value="Kegiatan Dusun">Kegiatan Dusun</option>
                                        <option value="Pengumuman">Pengumuman</option>
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
                                <label className="block text-sm font-bold text-gray-700 mb-2">Judul</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Judul informasi"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Isi</label>
                                <textarea
                                    className="input h-32 resize-none"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Isi informasi atau pengumuman"
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" className="flex-1">
                                    {editingInfo ? 'Update' : 'Simpan'}
                                </Button>
                                <Button type="button" variant="secondary" onClick={handleCloseForm}>Batal</Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${selectedCategory === category
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                        <p className="mt-4 text-gray-600">Memuat informasi...</p>
                    </div>
                ) : filteredInfo.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl">
                        <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                            {selectedCategory === 'All'
                                ? 'Belum ada informasi'
                                : `Belum ada informasi untuk kategori ${selectedCategory}`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInfo.map((info) => (
                            <div
                                key={info.id}
                                onClick={() => setSelectedInfo(info)}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                            >
                                <div className={`px-4 py-3 border-b ${getCategoryColor(info.category)}`}>
                                    <div className="flex items-center gap-2">
                                        {getCategoryIcon(info.category)}
                                        <span className="font-bold text-sm">{info.category}</span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                        {info.title}
                                    </h3>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {info.content}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {new Date(info.tanggal).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    {isAdmin && (
                                        <div className="pt-3 mt-3 border-t border-gray-100 flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(info);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(info.id, info.title);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>Hapus</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                {selectedInfo && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedInfo(null)}>
                        <div
                            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={`px-6 py-4 border-b ${getCategoryColor(selectedInfo.category)}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getCategoryIcon(selectedInfo.category)}
                                        <span className="font-bold">{selectedInfo.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleEdit(selectedInfo)}
                                                className="p-2 hover:bg-black/10 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedInfo(null)}
                                            className="p-2 hover:bg-black/10 rounded-lg transition"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                    {selectedInfo.title}
                                </h2>

                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {new Date(selectedInfo.tanggal).toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <div className="prose prose-gray max-w-none">
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {selectedInfo.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
