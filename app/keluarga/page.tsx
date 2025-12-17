'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Family, FamilyMember } from '@/types';
import { Users, ChevronDown, ChevronUp, Phone, MapPin, IdCard, Plus, Trash2, X, Download, UserPlus, Edit2 } from 'lucide-react';

export default function KeluargaPage() {
    const { user } = useAuth();
    const [families, setFamilies] = useState<Family[]>([]);
    const [expandedFamilies, setExpandedFamilies] = useState<Set<number>>(new Set());
    const [familyMembers, setFamilyMembers] = useState<Map<number, FamilyMember[]>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showMemberForm, setShowMemberForm] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [editingFamily, setEditingFamily] = useState<Family | null>(null);
    const [editingMember, setEditingMember] = useState<{ familyId: number; member: FamilyMember } | null>(null);

    // Form state for family
    const [formData, setFormData] = useState({
        no_kk: '',
        kepala_keluarga: '',
        rt: 'RT 01',
        alamat: '',
        no_hp: '',
    });

    // Form state for family member
    const [memberFormData, setMemberFormData] = useState({
        nik: '',
        nama: '',
        hubungan: 'Anak',
        jenis_kelamin: 'Laki-laki',
        tanggal_lahir: '',
    });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchFamilies();
    }, []);

    const fetchFamilies = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getFamilies();
            if (response.success && response.data) {
                setFamilies(response.data);
            }
        } catch (error) {
            console.error('Error fetching families:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFamilyMembers = async (familyId: number) => {
        try {
            const response = await apiService.getFamilyMembers(familyId);
            if (response.success && response.data) {
                const newMembers = new Map(familyMembers);
                newMembers.set(familyId, response.data);
                setFamilyMembers(newMembers);
            }
        } catch (error) {
            console.error('Error fetching family members:', error);
        }
    };

    const exportToCSV = async () => {
        if (families.length === 0) {
            alert('Tidak ada data untuk di-export');
            return;
        }

        setIsExporting(true);

        try {
            // Fetch all family members first
            const allMembersPromises = families.map(async (family) => {
                try {
                    const response = await apiService.getFamilyMembers(family.id);
                    return { familyId: family.id, members: response.success ? response.data : [] };
                } catch {
                    return { familyId: family.id, members: [] };
                }
            });

            const allMembersData = await Promise.all(allMembersPromises);
            const membersMap = new Map<number, FamilyMember[]>();
            allMembersData.forEach(({ familyId, members }) => {
                membersMap.set(familyId, members || []);
            });

            // Create CSV with family headers and members
            const headers = ['No KK', 'Kepala Keluarga', 'RT', 'Alamat', 'No HP', 'NIK Anggota', 'Nama Anggota', 'Hubungan', 'Jenis Kelamin', 'Tanggal Lahir'];
            const rows: string[][] = [];

            families.forEach((family) => {
                const members = membersMap.get(family.id) || [];

                if (members.length === 0) {
                    // Family without members
                    rows.push([
                        family.no_kk,
                        family.kepala_keluarga,
                        family.rt,
                        family.alamat || '-',
                        family.no_hp || '-',
                        '-',
                        '-',
                        '-',
                        '-',
                        '-'
                    ]);
                } else {
                    // Each member gets a row with family info
                    members.forEach((member) => {
                        rows.push([
                            family.no_kk,
                            family.kepala_keluarga,
                            family.rt,
                            family.alamat || '-',
                            family.no_hp || '-',
                            member.nik,
                            member.nama,
                            member.hubungan,
                            member.jenis_kelamin,
                            member.tanggal_lahir || '-'
                        ]);
                    });
                }
            });

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `data_keluarga_lengkap_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Gagal mengekspor data. Silakan coba lagi.');
        } finally {
            setIsExporting(false);
        }
    };

    const resetFamilyForm = () => {
        setFormData({
            no_kk: '',
            kepala_keluarga: '',
            rt: 'RT 01',
            alamat: '',
            no_hp: '',
        });
        setEditingFamily(null);
    };

    const resetMemberForm = () => {
        setMemberFormData({
            nik: '',
            nama: '',
            hubungan: 'Anak',
            jenis_kelamin: 'Laki-laki',
            tanggal_lahir: '',
        });
        setEditingMember(null);
    };

    const handleEditFamily = (family: Family) => {
        setEditingFamily(family);
        setFormData({
            no_kk: family.no_kk,
            kepala_keluarga: family.kepala_keluarga,
            rt: family.rt,
            alamat: family.alamat || '',
            no_hp: family.no_hp || '',
        });
        setShowForm(true);
    };

    const handleEditMember = (familyId: number, member: FamilyMember) => {
        setEditingMember({ familyId, member });
        setMemberFormData({
            nik: member.nik,
            nama: member.nama,
            hubungan: member.hubungan,
            jenis_kelamin: member.jenis_kelamin,
            tanggal_lahir: member.tanggal_lahir || '',
        });
        setShowMemberForm(familyId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFamily) {
                await apiService.updateFamily(editingFamily.id, formData);
            } else {
                await apiService.createFamily(formData);
            }
            resetFamilyForm();
            setShowForm(false);
            fetchFamilies();
        } catch (error) {
            console.error('Failed to save family:', error);
            alert('Gagal menyimpan keluarga. Silakan coba lagi.');
        }
    };

    const handleAddMember = async (e: React.FormEvent, familyId: number) => {
        e.preventDefault();
        try {
            if (editingMember) {
                await apiService.updateFamilyMember(familyId, editingMember.member.id, memberFormData);
            } else {
                await apiService.addFamilyMember(familyId, memberFormData);
            }
            resetMemberForm();
            setShowMemberForm(null);
            // Refresh family members
            await fetchFamilyMembers(familyId);
            // Refresh families to update member count
            fetchFamilies();
        } catch (error: any) {
            console.error('Failed to save family member:', error);
            if (error?.response?.data?.message) {
                alert(error.response.data.message);
            } else {
                alert('Gagal menyimpan anggota keluarga. Silakan coba lagi.');
            }
        }
    };

    const handleDeleteMember = async (familyId: number, memberId: number, memberName: string) => {
        if (!confirm(`Hapus anggota keluarga "${memberName}"?`)) return;
        try {
            await apiService.deleteFamilyMember(familyId, memberId);
            // Refresh family members
            await fetchFamilyMembers(familyId);
            // Refresh families to update member count
            fetchFamilies();
        } catch (error) {
            console.error('Failed to delete family member:', error);
            alert('Gagal menghapus anggota keluarga.');
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Hapus keluarga ${name}?`)) return;
        try {
            await apiService.deleteFamily(id);
            fetchFamilies();
        } catch (error) {
            console.error('Failed to delete family:', error);
            alert('Gagal menghapus keluarga.');
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        resetFamilyForm();
    };

    const handleCloseMemberForm = () => {
        setShowMemberForm(null);
        resetMemberForm();
    };

    const toggleFamily = async (familyId: number) => {
        const newExpanded = new Set(expandedFamilies);

        if (newExpanded.has(familyId)) {
            newExpanded.delete(familyId);
            setExpandedFamilies(newExpanded);
        } else {
            newExpanded.add(familyId);
            setExpandedFamilies(newExpanded);

            if (!familyMembers.has(familyId)) {
                await fetchFamilyMembers(familyId);
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Data Keluarga</h2>
                        <p className="text-gray-600 mt-1">Daftar kepala keluarga dan anggota</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={exportToCSV}
                            variant="secondary"
                            icon={Download}
                            disabled={isExporting}
                        >
                            {isExporting ? 'Mengekspor...' : 'Export CSV'}
                        </Button>
                        {isAdmin && (
                            <Button onClick={() => { resetFamilyForm(); setShowForm(!showForm); }} icon={showForm ? X : Plus}>
                                {showForm ? 'Tutup' : 'Tambah Keluarga'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Add/Edit Family Form */}
                {showForm && isAdmin && (
                    <Card className="border-emerald-200 ring-4 ring-emerald-50">
                        <h3 className="font-bold text-lg mb-4">
                            {editingFamily ? 'Edit Data Keluarga' : 'Tambah Keluarga Baru'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">No. KK</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.no_kk}
                                        onChange={(e) => {
                                            // Only allow numeric input, max 16 characters
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                                            setFormData({ ...formData, no_kk: value });
                                        }}
                                        placeholder="1234567890123456"
                                        maxLength={16}
                                        pattern="[0-9]{16}"
                                        title="No. KK harus 16 digit angka"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Kepala Keluarga</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.kepala_keluarga}
                                        onChange={(e) => setFormData({ ...formData, kepala_keluarga: e.target.value })}
                                        placeholder="Nama lengkap"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">RT</label>
                                    <select
                                        className="input"
                                        value={formData.rt}
                                        onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                                    >
                                        <option value="RT 01">RT 01</option>
                                        <option value="RT 02">RT 02</option>
                                        <option value="RT 03">RT 03</option>
                                        <option value="RT 04">RT 04</option>
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
                                    placeholder="Alamat lengkap"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" className="flex-1">
                                    {editingFamily ? 'Update' : 'Simpan'}
                                </Button>
                                <Button type="button" variant="secondary" onClick={handleCloseForm}>Batal</Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                        <p className="mt-4 text-gray-600">Memuat data keluarga...</p>
                    </div>
                ) : families.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Belum ada data keluarga</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {families.map((family) => {
                            const isExpanded = expandedFamilies.has(family.id);
                            const members = familyMembers.get(family.id) || [];

                            return (
                                <div
                                    key={family.id}
                                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <div
                                        onClick={() => toggleFamily(family.id)}
                                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="bg-emerald-100 p-2 rounded-lg">
                                                        <Users className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900">
                                                            {family.kepala_keluarga}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">No KK: {family.no_kk}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{family.rt}</span>
                                                    </div>
                                                    {family.no_hp && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-4 h-4" />
                                                            <span>{family.no_hp}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        <span>{family.member_count || 0} Anggota</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isAdmin && (
                                                <div className="flex items-center gap-1 mr-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditFamily(family);
                                                        }}
                                                        className="p-2 hover:bg-emerald-50 rounded-lg transition-colors group"
                                                        title="Edit Keluarga"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(family.id, family.kepala_keluarga);
                                                        }}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                                        title="Hapus Keluarga"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                                                    </button>
                                                </div>
                                            )}

                                            <div>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-6 h-6 text-emerald-600" />
                                                ) : (
                                                    <ChevronDown className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-gray-100 bg-gray-50 p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-gray-700">
                                                    Anggota Keluarga ({members.length})
                                                </h4>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => {
                                                            if (showMemberForm === family.id) {
                                                                handleCloseMemberForm();
                                                            } else {
                                                                resetMemberForm();
                                                                setShowMemberForm(family.id);
                                                            }
                                                        }}
                                                        className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                                                    >
                                                        {showMemberForm === family.id && !editingMember ? (
                                                            <>
                                                                <X className="w-4 h-4" />
                                                                Batal
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserPlus className="w-4 h-4" />
                                                                Tambah Anggota
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Add/Edit Member Form */}
                                            {showMemberForm === family.id && isAdmin && (
                                                <div className="bg-white p-4 rounded-xl border border-emerald-200 mb-4">
                                                    <h5 className="font-semibold text-gray-800 mb-3">
                                                        {editingMember ? 'Edit Anggota' : 'Tambah Anggota Baru'}
                                                    </h5>
                                                    <form onSubmit={(e) => handleAddMember(e, family.id)} className="space-y-3">
                                                        <div className="grid md:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-600 mb-1">NIK</label>
                                                                <input
                                                                    type="text"
                                                                    className="input text-sm"
                                                                    value={memberFormData.nik}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                                                                        setMemberFormData({ ...memberFormData, nik: value });
                                                                    }}
                                                                    placeholder="16 digit NIK"
                                                                    maxLength={16}
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-600 mb-1">Nama Lengkap</label>
                                                                <input
                                                                    type="text"
                                                                    className="input text-sm"
                                                                    value={memberFormData.nama}
                                                                    onChange={(e) => setMemberFormData({ ...memberFormData, nama: e.target.value })}
                                                                    placeholder="Nama lengkap"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid md:grid-cols-3 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-600 mb-1">Hubungan</label>
                                                                <select
                                                                    className="input text-sm"
                                                                    value={memberFormData.hubungan}
                                                                    onChange={(e) => setMemberFormData({ ...memberFormData, hubungan: e.target.value })}
                                                                >
                                                                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                                                                    <option value="Istri">Istri</option>
                                                                    <option value="Anak">Anak</option>
                                                                    <option value="Orang Tua">Orang Tua</option>
                                                                    <option value="Lainnya">Lainnya</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-600 mb-1">Jenis Kelamin</label>
                                                                <select
                                                                    className="input text-sm"
                                                                    value={memberFormData.jenis_kelamin}
                                                                    onChange={(e) => setMemberFormData({ ...memberFormData, jenis_kelamin: e.target.value })}
                                                                >
                                                                    <option value="Laki-laki">Laki-laki</option>
                                                                    <option value="Perempuan">Perempuan</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal Lahir</label>
                                                                <input
                                                                    type="date"
                                                                    className="input text-sm"
                                                                    value={memberFormData.tanggal_lahir}
                                                                    onChange={(e) => setMemberFormData({ ...memberFormData, tanggal_lahir: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-2">
                                                            <Button type="submit" className="flex-1 text-sm py-2">
                                                                {editingMember ? 'Update Anggota' : 'Simpan Anggota'}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                className="text-sm py-2"
                                                                onClick={handleCloseMemberForm}
                                                            >
                                                                Batal
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}

                                            {members.length === 0 ? (
                                                <p className="text-sm text-gray-500 text-center py-4">
                                                    Belum ada data anggota keluarga
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {members.map((member) => (
                                                        <div key={member.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <IdCard className="w-4 h-4 text-gray-400" />
                                                                    <span className="font-semibold text-gray-900">{member.nama}</span>
                                                                    <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                                                        {member.hubungan}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
                                                                    <span>NIK: {member.nik}</span>
                                                                    <span>•</span>
                                                                    <span>{member.jenis_kelamin}</span>
                                                                    {member.tanggal_lahir && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>{new Date(member.tanggal_lahir).toLocaleDateString('id-ID')}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {isAdmin && (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => handleEditMember(family.id, member)}
                                                                        className="p-2 hover:bg-emerald-50 rounded-lg transition-colors group"
                                                                        title="Edit Anggota"
                                                                    >
                                                                        <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteMember(family.id, member.id, member.nama)}
                                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                                                        title="Hapus Anggota"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
