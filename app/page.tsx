'use client';

import { ArrowRight, DollarSign, Users, Shield, CheckCircle, Bell } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="relative pt-20 pb-32 bg-emerald-600 overflow-hidden rounded-b-[80px]">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-400/50 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center text-white max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur border border-white/20 text-sm font-bold mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Transparansi DKM Modern
            </div>

            <h1 className="text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
              Transparansi Kas Masjid <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-100">
                Untuk Kepercayaan
              </span>
            </h1>

            <p className="text-lg text-emerald-50 mb-10 leading-relaxed max-w-2xl mx-auto">
              Platform terintegrasi untuk transparansi kas masjid, manajemen data jamaah,
              dan informasi kegiatan dusun secara digital dan real-time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button variant="secondary" className="bg-white text-emerald-600 hover:bg-gray-50">
                  Masuk Sistem <ArrowRight size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-emerald-600 font-bold tracking-widest text-sm uppercase mb-2">
              Fitur Unggulan
            </h2>
            <h3 className="text-4xl font-black text-gray-900 mb-4">
              Solusi Lengkap Kebutuhan DKM
            </h3>
            <p className="text-gray-500">
              Kami menyediakan modul lengkap untuk transparansi kas masjid dan
              manajemen data jamaah dusun secara digital.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={DollarSign}
              title="Transparansi Kas Masjid"
              description="Laporan kas masuk dan keluar yang dapat dipantau langsung untuk menjaga kepercayaan penuh kepada DKM."
            />
            <FeatureCard
              icon={Users}
              title="Data Jamaah Terpusat"
              description="Database jamaah dusun yang aman, mudah dicari, dan selalu terupdate real-time oleh pengurus DKM."
            />
            <FeatureCard
              icon={Bell}
              title="Info Kegiatan Masjid"
              description="Papan pengumuman digital untuk menyebarkan info kegiatan masjid, kepanitiaan, kurban, dan kajian."
            />
            <FeatureCard
              icon={Shield}
              title="Keamanan Data"
              description="Sistem keamanan berlapis dengan Audit Log untuk memantau setiap perubahan data sensitif."
            />
            <FeatureCard
              icon={CheckCircle}
              title="Akses Mudah"
              description="Dapat diakses kapan saja dan di mana saja melalui perangkat desktop maupun mobile."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h4 className="text-2xl font-bold mb-4">HaloDKM</h4>
          <p className="text-gray-400 max-w-2xl mx-auto mb-6">
            Mewujudkan transparansi kas masjid dan tata kelola DKM yang modern,
            terpercaya, dan partisipatif untuk dusun yang lebih baik.
          </p>
          <p className="text-gray-600 text-sm">
            © 2025 HaloDKM System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
