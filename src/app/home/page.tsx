'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { PenLine, History, User, Download, ChevronRight, FileText } from 'lucide-react';

export default function HomePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/');
    else if (!loading && userData?.role === 'admin') router.push('/admin');
  }, [user, userData, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-base-200">
      <div className="main-content">
        <div className="bg-gradient-to-br from-primary to-primary-focus px-6 pt-8 pb-16 rounded-b-[36px] relative overflow-hidden animate-fade-in shadow-md shadow-primary/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 backdrop-blur-sm" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 backdrop-blur-sm" />
          <p className="text-white/90 text-sm font-medium mb-1">Assalamu'alaikum,</p>
          <h1 className="text-[22px] font-bold text-white leading-tight">
            Ust. {userData?.name || 'Guru'}
          </h1>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            Selamat datang kembali. Semangat mengajar hari ini!
          </p>
        </div>

        <div className="px-5 -mt-10 animate-fade-in-scale">
          <div className="card bg-base-100 shadow-xl border border-base-200/60">
            <div className="card-body p-4 sm:p-5">
              <Link href="/report/create" className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-focus rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 shrink-0 group-active:scale-95 transition-transform">
                  <PenLine size={22} className="text-primary-content" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base-content text-[15px]">Isi Laporan Hari Ini</p>
                  <p className="text-xs text-base-content/60 mt-0.5">Catat kegiatan mengajar Anda sekarang</p>
                </div>
                <div className="text-base-content/30 group-hover:text-base-content/50 transition-colors">
                  <ChevronRight size={24} />
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="px-5 mt-8 animate-stagger" style={{ animationDelay: '0.1s' }}>
          <p className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-4 px-1">Menu Utama</p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { href: '/history', icon: History, label: 'Riwayat', subtitle: 'Lihat semua catatan', bgClass: 'bg-blue-500' },
              { href: '/profile', icon: User, label: 'Profil Saya', subtitle: 'Data diri & kop', bgClass: 'bg-orange-500' },
              { href: '/insentif', icon: FileText, label: 'Surat Insentif', subtitle: 'Pencairan insentif', bgClass: 'bg-emerald-500' },
              { href: '/export', icon: Download, label: 'Export Laporan', subtitle: 'Unduh Excel/PDF', bgClass: 'bg-violet-500' },
            ].map(({ href, icon: Icon, label, subtitle, bgClass }) => (
              <Link key={href} href={href} className="card bg-base-100 shadow-sm hover:shadow-md border border-base-200 active:scale-[0.97] transition-all duration-200">
                <div className="card-body p-4">
                  <div className={`w-10 h-10 ${bgClass} rounded-xl flex items-center justify-center text-white mb-3 shadow-sm`}>
                    <Icon size={20} />
                  </div>
                  <p className="font-bold text-base-content text-sm">{label}</p>
                  <p className="text-[11px] text-base-content/50 mt-1 line-clamp-1">{subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
