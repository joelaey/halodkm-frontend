'use client';

import { Home, DollarSign, LogOut, Bookmark, X, Users, Shield, ClipboardList, HelpCircle, UserCheck, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const isAdmin = user?.role === 'admin';

    // Menu items based on role
    const menuItems = [
        { icon: Home, label: 'Dashboard', page: '/dashboard', adminOnly: false },
        { icon: DollarSign, label: 'Kas Masjid', page: '/kas-masjid', adminOnly: false },
        { icon: Calendar, label: 'Keuangan Event', page: '/event-keuangan', adminOnly: true },
        { icon: Users, label: 'Penduduk Tetap', page: '/keluarga', adminOnly: true },
        { icon: UserCheck, label: 'Penduduk Khusus', page: '/penduduk-khusus', adminOnly: true },
        { icon: Bookmark, label: 'Informasi', page: '/informasi', adminOnly: false },
        { icon: HelpCircle, label: 'Bantuan', page: '/bantuan', jamaahOnly: true },
        { icon: Shield, label: 'Users', page: '/users', adminOnly: true },
        { icon: ClipboardList, label: 'Logs', page: '/logs', adminOnly: true },
    ].filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.jamaahOnly && isAdmin) return false;
        return true;
    });

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen w-64 bg-[#F5F2EB] border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0`}
            >
                {/* Header */}
                <div className="pt-6 pb-6 flex justify-between items-center px-6">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black text-emerald-700">HaloDKM</h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                            Transparansi Kas & Data
                        </p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden text-gray-500 hover:text-red-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* User Info */}
                <div className="flex flex-col items-center pb-8 px-4 text-center">
                    <h3 className="font-black text-lg text-black uppercase tracking-wide truncate w-full">
                        {user?.full_name || 'User'}
                    </h3>
                    <p className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-widest">
                        {user?.role === 'admin' ? 'Admin' : 'Jamaah'}
                    </p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 w-full overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.page;
                        return (
                            <Link
                                key={item.page}
                                href={item.page}
                                onClick={() => setIsOpen(false)}
                                className={`w-full flex items-center gap-4 px-6 py-3 mb-2 transition-all duration-200 ${isActive
                                    ? 'bg-emerald-500 text-white font-bold shadow-sm rounded-r-full mr-4'
                                    : 'text-gray-700 hover:bg-black/5 font-medium'
                                    }`}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-sm tracking-wide uppercase">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-8 border-t border-gray-200/50">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 text-black hover:text-red-600 transition font-bold text-sm w-full justify-center md:justify-start"
                    >
                        <span>Logout</span>
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>
        </>
    );
}
