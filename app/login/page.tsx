'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Loader, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import { apiService } from '@/lib/api';

export default function LoginPage() {
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    // Login state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Register state
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [regFullName, setRegFullName] = useState('');
    const [regNoHp, setRegNoHp] = useState('');
    const [showRegPassword, setShowRegPassword] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            await login(username, password);
            // Redirect handled by AuthContext
        } catch (err: any) {
            setError(err.message || 'Login gagal. Periksa username dan password Anda.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (regPassword !== regConfirmPassword) {
            setError('Password dan konfirmasi password tidak sama');
            return;
        }

        if (regPassword.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        if (regUsername.length < 4) {
            setError('Username minimal 4 karakter');
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiService.register({
                username: regUsername,
                password: regPassword,
                full_name: regFullName,
                no_hp: regNoHp || undefined
            });

            if (response.success) {
                setSuccess('Pendaftaran berhasil! Silakan login dengan akun Anda.');
                // Clear register form
                setRegUsername('');
                setRegPassword('');
                setRegConfirmPassword('');
                setRegFullName('');
                setRegNoHp('');
                // Switch to login mode after short delay
                setTimeout(() => {
                    setIsRegisterMode(false);
                    setUsername(regUsername); // Pre-fill username for convenience
                }, 2000);
            } else {
                setError(response.message || 'Pendaftaran gagal');
            }
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Pendaftaran gagal. Silakan coba lagi.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = () => {
        setIsRegisterMode(!isRegisterMode);
        setError('');
        setSuccess('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-emerald-700 mb-2">HaloDKM</h1>
                    <p className="text-gray-600">Transparansi Kas & Data Jamaah</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                    {!isRegisterMode ? (
                        /* Login Form */
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Masuk ke Sistem</h2>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="input w-full"
                                        placeholder="Masukkan username"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="input w-full pr-12"
                                            placeholder="Masukkan password"
                                            required
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                    icon={isLoading ? Loader : LogIn}
                                >
                                    {isLoading ? 'Memproses...' : 'Masuk'}
                                </Button>
                            </form>

                            {/* Forgot Password */}
                            <div className="mt-4 text-center">
                                <a
                                    href="https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20lupa%20password%20akun%20HaloDKM.%20Username%20saya%3A%20"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-gray-500 hover:text-emerald-600 transition"
                                >
                                    Lupa password? Hubungi Admin
                                </a>
                            </div>

                            <div className="mt-4 text-center">
                                <p className="text-gray-600">
                                    Belum punya akun?{' '}
                                    <button
                                        onClick={switchMode}
                                        className="text-emerald-600 font-semibold hover:text-emerald-700 transition"
                                    >
                                        Daftar Sekarang
                                    </button>
                                </p>
                            </div>
                        </>
                    ) : (
                        /* Register Form */
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={switchMode}
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                >
                                    <ArrowLeft size={20} className="text-gray-600" />
                                </button>
                                <h2 className="text-2xl font-bold text-gray-900">Daftar Akun Jamaah</h2>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleRegister} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Nama Lengkap <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={regFullName}
                                        onChange={(e) => setRegFullName(e.target.value)}
                                        className="input w-full"
                                        placeholder="Masukkan nama lengkap"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Username <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={regUsername}
                                        onChange={(e) => setRegUsername(e.target.value)}
                                        className="input w-full"
                                        placeholder="Minimal 4 karakter"
                                        required
                                        disabled={isLoading}
                                        minLength={4}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        No. HP (Opsional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={regNoHp}
                                        onChange={(e) => setRegNoHp(e.target.value)}
                                        className="input w-full"
                                        placeholder="Contoh: 08123456789"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showRegPassword ? 'text' : 'password'}
                                            value={regPassword}
                                            onChange={(e) => setRegPassword(e.target.value)}
                                            className="input w-full pr-12"
                                            placeholder="Minimal 6 karakter"
                                            required
                                            disabled={isLoading}
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowRegPassword(!showRegPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                        >
                                            {showRegPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Konfirmasi Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={regConfirmPassword}
                                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                                        className="input w-full"
                                        placeholder="Ulangi password"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                    icon={isLoading ? Loader : UserPlus}
                                >
                                    {isLoading ? 'Memproses...' : 'Daftar'}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-gray-600">
                                    Sudah punya akun?{' '}
                                    <button
                                        onClick={switchMode}
                                        className="text-emerald-600 font-semibold hover:text-emerald-700 transition"
                                    >
                                        Masuk
                                    </button>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
