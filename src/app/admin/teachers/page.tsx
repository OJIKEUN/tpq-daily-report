'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Users, ChevronLeft, Shield, Mail, Search } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: 'guru' | 'admin';
  phone?: string;
  created_at: string;
}

export default function TeachersManagementPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'admin')) {
      router.push('/');
    } else if (user && userData?.role === 'admin') {
      fetchTeachers();
    }
  }, [user, userData, loading, router]);

  const fetchTeachers = async () => {
    setFetching(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: Teacher[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Teacher));
      setTeachers(list);
      setFilteredTeachers(list);
    } catch (error) {
      console.error("Error fetching teachers", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredTeachers(
      teachers.filter(t => t.name.toLowerCase().includes(q) || (t.email && t.email.toLowerCase().includes(q)))
    );
  }, [search, teachers]);

  const handleRoleToggle = async (t: Teacher) => {
    if (t.email === 'superadmin@tpq.com') {
      return alert('Tidak dapat mengubah akses Super Admin Utama.');
    }
    const newRole = t.role === 'guru' ? 'admin' : 'guru';
    if (!window.confirm(`Ubah akses ${t.name} menjadi ${newRole.toUpperCase()}?`)) return;
    
    try {
      await updateDoc(doc(db, 'users', t.id), { role: newRole });
      setTeachers(teachers.map(x => x.id === t.id ? { ...x, role: newRole } : x));
    } catch (e) {
      alert('Gagal mengubah hak akses.');
    }
  };

  const handleResetPassword = async (t: Teacher) => {
    if (!t.email) return alert('Email tidak ditemukan untuk akun ini.');
    if (!window.confirm(`Kirim email reset password ke ${t.email}?`)) return;
    
    try {
      if (!auth) throw new Error("Auth not initialized");
      await sendPasswordResetEmail(auth, t.email);
      alert(`Email reset password berhasil dikirim ke ${t.email}. Guru harus mengecek kotak masuk/spam emailnya.`);
    } catch (e) {
      alert('Gagal mengirim email reset password.');
    }
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
        <div className="flex-none">
          <Link href="/admin" className="btn btn-square btn-ghost">
            <ChevronLeft size={24} />
          </Link>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Manajemen Guru</h1>
        </div>
      </div>

      <div className="main-content px-5 py-6 animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
            <Users size={28} className="text-white" />
          </div>
          <p className="text-sm text-base-content/60 text-center mt-1">Kelola data guru dan hak akses aplikasi</p>
        </div>

        <div className="relative mb-6 shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            className="input input-bordered w-full pl-10 focus:input-primary bg-base-100" 
            placeholder="Cari nama atau email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {fetching ? (
          <div className="flex justify-center mt-10">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center mt-10 text-base-content/50">
            <p>Tidak ada data guru ditemukan.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-10">
            {filteredTeachers.map(t => (
              <div key={t.id} className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
                <div className="card-body p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base-content text-[15px] truncate">{t.name || 'Tanpa Nama'}</h3>
                      <p className="text-xs text-base-content/60 mt-0.5 truncate">{t.email || '-'}</p>
                      {t.phone && <p className="text-xs text-base-content/60">{t.phone}</p>}
                    </div>
                    <div>
                      {t.role === 'admin' ? (
                        <div className="badge badge-error badge-sm gap-1 font-semibold p-2">
                          <Shield size={12} /> ADMIN
                        </div>
                      ) : (
                        <div className="badge badge-success badge-outline badge-sm gap-1 font-semibold p-2">
                          GURU
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="divider my-2 opacity-30"></div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleRoleToggle(t)}
                      className={`btn btn-sm flex-1 ${t.role === 'guru' ? 'btn-outline border-error text-error hover:bg-error hover:text-white hover:border-error' : 'btn-outline border-success text-success hover:bg-success hover:text-white hover:border-success'}`}
                    >
                      <Shield size={14} /> {t.role === 'guru' ? 'Jadikan Admin' : 'Jadikan Guru'}
                    </button>
                    <button 
                      onClick={() => handleResetPassword(t)}
                      className="btn btn-sm btn-outline border-primary text-primary hover:bg-primary hover:text-white hover:border-primary flex-1"
                      disabled={!t.email}
                    >
                      <Mail size={14} /> Reset Sandi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
