'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

export default function BantuanPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Bantuan & Kontak</h2>
                    <p className="text-gray-600 mt-1">Hubungi admin jika membutuhkan bantuan</p>
                </div>

                {/* Contact Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-emerald-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Phone className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Telepon / WhatsApp</h3>
                                <p className="text-lg font-semibold text-emerald-600 mt-1">0812-3456-7890</p>
                                <p className="text-sm text-gray-500 mt-1">Admin DKM Masjid</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-blue-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Email</h3>
                                <p className="text-lg font-semibold text-blue-600 mt-1">admin@halodkm.id</p>
                                <p className="text-sm text-gray-500 mt-1">Respon dalam 1x24 jam</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-amber-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Alamat Sekretariat</h3>
                                <p className="text-gray-700 mt-1">Masjid Al-Ikhlas</p>
                                <p className="text-sm text-gray-500">Jl. Masjid Raya No. 1, Dusun</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-purple-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Clock className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Jam Operasional</h3>
                                <p className="text-gray-700 mt-1">Senin - Jumat</p>
                                <p className="text-sm text-gray-500">08.00 - 16.00 WIB</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* FAQ Section */}
                <Card>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                        Pertanyaan Umum
                    </h3>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h4 className="font-semibold text-gray-900">Bagaimana cara melihat laporan kas masjid?</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Buka menu "Kas Masjid" untuk melihat semua transaksi pemasukan dan pengeluaran kas masjid secara transparan.
                            </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h4 className="font-semibold text-gray-900">Bagaimana cara mendaftar sebagai jamaah?</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Hubungi admin DKM melalui WhatsApp atau datang langsung ke sekretariat masjid untuk mendaftarkan akun.
                            </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h4 className="font-semibold text-gray-900">Lupa password?</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Hubungi admin untuk mereset password akun Anda.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
