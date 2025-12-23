'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Users, Plus, Trash2, X, Shield, User as UserIcon, Key, Eye, EyeOff } from 'lucide-react';
import { Toast, ConfirmDialog } from '@/components/ui/Toast';

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

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
        setToast({ message, type });
    };

    // Delete confirm dialog state
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        user: UserData | null;
        isLoading: boolean;
    }>({ isOpen: false, user: null, isLoading: false });

    // Reset password state
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUser, setResetUser] = useState<UserData | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

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
            showToast('User berhasil ditambahkan', 'success');
            fetchUsers();
        } catch (error) {
            console.error('Failed to create user:', error);
            showToast('Gagal menambahkan user', 'error');
        }
    };

    const openDeleteDialog = (u: UserData) => {
        if (u.id === user?.id) {
            showToast('Tidak bisa menghapus akun sendiri!', 'warning');
            return;
        }
        setDeleteDialog({ isOpen: true, user: u, isLoading: false });
    };

    const handleConfirmDelete = async () => {
        if (!deleteDialog.user) return;

        setDeleteDialog(prev => ({ ...prev, isLoading: true }));
        try {
            await apiService.deleteUser(deleteDialog.user.id);
            showToast('User berhasil dihapus', 'success');
            setDeleteDialog({ isOpen: false, user: null, isLoading: false });
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            showToast('Gagal menghapus user', 'error');
            setDeleteDialog(prev => ({ ...prev, isLoading: false }));
        }
    };

    const openResetModal = (u: UserData) => {
        setResetUser(u);
        setNewPassword('');
        setShowNewPassword(false);
        setShowResetModal(true);
    };

    const handleResetPassword = async () => {
        if (!resetUser || !newPassword) return;

        if (newPassword.length < 6) {
            showToast('Password minimal 6 karakter', 'warning');
            return;
        }

        setIsResetting(true);
        try {
            const response = await apiService.resetPassword(resetUser.id, newPassword);
            if (response.success) {
                showToast(`Password ${resetUser.username} berhasil direset`, 'success');
                setShowResetModal(false);
                setResetUser(null);
                setNewPassword('');
            } else {
                showToast(response.message || 'Gagal reset password', 'error');
            }
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Gagal reset password', 'error');
        } finally {
            setIsResetting(false);
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

                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {u.role === 'admin' ? 'Admin' : 'Jamaah'}
                                    </span>

                                    {u.id !== user?.id && (
                                        <>
                                            <button
                                                onClick={() => openResetModal(u)}
                                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                                                title="Reset Password"
                                            >
                                                <Key className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteDialog(u)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                                title="Hapus User"
                                            >
                                                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Hapus User?"
                message={`Yakin ingin menghapus user "${deleteDialog.user?.full_name}" (@${deleteDialog.user?.username})? Aksi ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
                isLoading={deleteDialog.isLoading}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteDialog({ isOpen: false, user: null, isLoading: false })}
            />

            {/* Reset Password Modal */}
            {showResetModal && resetUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Key className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Reset Password</h3>
                                <p className="text-sm text-gray-500">@{resetUser.username}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Password Baru</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    className="input w-full pr-12"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimal 6 karakter"
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleResetPassword}
                                className="flex-1"
                                disabled={isResetting || newPassword.length < 6}
                            >
                                {isResetting ? 'Menyimpan...' : 'Reset Password'}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowResetModal(false)}
                                disabled={isResetting}
                            >
                                Batal
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </DashboardLayout>
    );
}
