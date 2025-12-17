'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Users, Plus, Trash2, X, Shield, User as UserIcon } from 'lucide-react';

interface UserData {
    id: number;
    username: string;
    full_name: string;
    role: 'admin' | 'jamaah';
    rt?: string;
    created_at: string;
}

export default function UsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'jamaah' as 'admin' | 'jamaah',
        rt: 'RT 01',
    });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getUsers();
            if (response.success && response.data) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiService.createUser(formData);
            setFormData({
                username: '',
                password: '',
                full_name: '',
                role: 'jamaah',
                rt: 'RT 01',
            });
            setShowForm(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to create user:', error);
            alert('Gagal menambahkan user.');
        }
    };

    const handleDelete = async (id: number, username: string) => {
        if (id === user?.id) {
            alert('Tidak bisa menghapus akun sendiri!');
            return;
        }
        if (!confirm(`Hapus user "${username}"?`)) return;
        try {
            await apiService.deleteUser(id);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Gagal menghapus user.');
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Manajemen User</h2>
                        <p className="text-gray-600 mt-1">Kelola akun pengguna aplikasi</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} icon={showForm ? X : Plus}>
                        {showForm ? 'Tutup' : 'Tambah User'}
                    </Button>
                </div>

                {/* Add User Form */}
                {showForm && (
                    <Card className="border-emerald-200 ring-4 ring-emerald-50">
                        <h3 className="font-bold text-lg mb-4">Tambah User Baru</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="username"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="password"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Nama lengkap"
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                                    <select
                                        className="input"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'jamaah' })}
                                    >
                                        <option value="jamaah">Jamaah</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
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
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" className="flex-1">Simpan</Button>
                                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Batal</Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* User List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                        <p className="mt-4 text-gray-600">Memuat data user...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Belum ada user</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {users.map((u) => (
                            <Card key={u.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {u.role === 'admin' ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{u.full_name}</h3>
                                        <p className="text-sm text-gray-500">@{u.username} • {u.rt || '-'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {u.role === 'admin' ? 'Admin' : 'Jamaah'}
                                    </span>

                                    {u.id !== user?.id && (
                                        <button
                                            onClick={() => handleDelete(u.id, u.username)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                        >
                                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                                        </button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
