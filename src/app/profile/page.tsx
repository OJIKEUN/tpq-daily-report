'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Save, User, MapPin, Phone, School, Users, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export default function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [headmasterName, setHeadmasterName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/');
    else if (user) {
      getDoc(doc(db, 'users', user.uid)).then((d) => {
        if (d.exists()) {
          const data = d.data();
          setName(data.name || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
          setHeadmasterName(data.headmaster_name || '');
          setSupervisorName(data.supervisor_name || '');
        } else if (userData?.name) {
          setName(userData.name);
        }
      });
    }
  }, [user, userData, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, role: userData?.role || 'guru',
        name, address, phone, headmaster_name: headmasterName, supervisor_name: supervisorName,
        updated_at: new Date().toISOString(),
      }, { merge: true });
      setMessage('Profil berhasil diperbarui!');
    } catch { setMessage('Gagal menyimpan profil.'); }
    finally { setIsSubmitting(false); }
  };

  if (loading || !user) {
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
          <Link href="/home" className="btn btn-square btn-ghost">
            <ChevronLeft size={24} />
          </Link>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Profil Saya</h1>
        </div>
      </div>

      <div className="main-content px-5 py-6 animate-fade-in">
        <div className="card bg-base-100 shadow-md border border-base-200 mb-6">
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <User size={24} className="text-primary-content" />
            </div>
            <div>
              <p className="font-bold text-base-content text-[15px]">{name || userData?.name || 'Guru'}</p>
              <p className="text-xs text-base-content/60 mt-0.5">Data ini ditampilkan pada kop surat saat cetak laporan</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`alert ${message.includes('Gagal') ? 'alert-error' : 'alert-success'} shadow-sm mb-5 text-sm py-3 rounded-xl`}>
            {message.includes('Gagal') ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <p className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-3 px-1">Data Pribadi</p>
          <div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
            <div className="card-body p-5">
              <div className="form-control mb-4">
                <label className="label py-1">
                  <span className="label-text font-semibold">Nama Lengkap</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                    <User size={18} />
                  </div>
                  <input type="text" className="input input-bordered w-full pl-10 focus:input-primary" placeholder="Ust. Ahmad Fauzi" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="form-control mb-4">
                <label className="label py-1">
                  <span className="label-text font-semibold">Alamat</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                    <MapPin size={18} />
                  </div>
                  <input type="text" className="input input-bordered w-full pl-10 focus:input-primary" placeholder="Merlion Square, No. 10" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
              </div>
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold">Nomor HP / WhatsApp</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                    <Phone size={18} />
                  </div>
                  <input type="tel" className="input input-bordered w-full pl-10 focus:input-primary" placeholder="0812-3456-7890" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-3 px-1">Data Pengesahan</p>
          <div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
            <div className="card-body p-5">
              <div className="form-control mb-4">
                <label className="label py-1">
                  <span className="label-text font-semibold">Nama Kepala TPQ</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                    <School size={18} />
                  </div>
                  <input type="text" className="input input-bordered w-full pl-10 focus:input-primary" placeholder="Nama Kepala TPQ" value={headmasterName} onChange={(e) => setHeadmasterName(e.target.value)} required />
                </div>
              </div>
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold">Guru TPQ Pembimbing</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                    <Users size={18} />
                  </div>
                  <input type="text" className="input input-bordered w-full pl-10 focus:input-primary" placeholder="Nama Guru Pembimbing" value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} required />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full shadow-lg shadow-primary/30" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (<><Save size={18} /> Simpan Profil</>)}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
