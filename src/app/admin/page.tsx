'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Users, BarChart3, ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function AdminPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'admin')) router.push('/');
  }, [user, userData, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading || !user || userData?.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-40 border-b border-base-200">
        <div className="flex-1 flex items-center gap-2 pl-2">
          <ShieldCheck size={24} className="text-primary" />
          <h1 className="text-lg font-bold">Panel Admin</h1>
        </div>
        <div className="flex-none pr-2">
          <button
            onClick={handleLogout}
            className="btn btn-square btn-ghost text-error hover:bg-error/10"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="main-content px-5 py-6 animate-fade-in">
        <div className="card bg-gradient-to-br from-primary to-primary-focus shadow-lg shadow-primary/30 mb-6">
          <div className="card-body p-6">
            <p className="text-white/90 text-xs font-bold uppercase tracking-widest mb-1">Super Admin</p>
            <h2 className="card-title text-xl font-bold text-white">Manajemen TPQ Daruttaubah</h2>
            <p className="text-white/80 text-sm mt-1">Kelola guru dan pantau laporan harian</p>
          </div>
        </div>

        <Link href="/admin/teachers" className="card bg-base-100 shadow-sm border border-base-200 mb-4 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md hover:border-base-300 group block">
          <div className="card-body p-5 flex-row gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 group-active:scale-95 transition-transform">
              <Users size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base-content text-[15px]">Manajemen Guru</h3>
              <p className="text-xs text-base-content/60 mt-1 leading-relaxed">Lihat daftar guru, atur akses, dan reset password.</p>
              <div className="text-primary text-xs font-semibold mt-3 flex items-center gap-1 group-hover:underline">Buka menu &rarr;</div>
            </div>
          </div>
        </Link>

        <Link href="/admin/reports" className="card bg-base-100 shadow-sm border border-base-200 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md hover:border-base-300 group block">
          <div className="card-body p-5 flex-row gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0 group-active:scale-95 transition-transform">
              <BarChart3 size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base-content text-[15px]">Rekap Semua Laporan</h3>
              <p className="text-xs text-base-content/60 mt-1 leading-relaxed">Pantau laporan harian dari seluruh guru TPQ.</p>
              <div className="text-violet-600 text-xs font-semibold mt-3 flex items-center gap-1 group-hover:underline">Buka menu &rarr;</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
