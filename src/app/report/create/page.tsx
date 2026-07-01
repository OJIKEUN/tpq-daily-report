'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar, FileText, AlignLeft, Send, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateReportPage() {
  const { user, userData } = useAuth();
  const router = useRouter();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activity, setActivity] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;
    setIsSubmitting(true);
    try {
      // Validasi duplikasi tanggal
      const existingSnap = await getDocs(
        query(
          collection(db, 'reports'), 
          where('user_id', '==', user.uid), 
          where('report_date', '==', date)
        )
      );

      if (!existingSnap.empty) {
        alert('Data pada tanggal tersebut sudah pernah ditambahkan!');
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'reports'), {
        user_id: user.uid, user_name: userData.name,
        report_date: date, activity, description, created_at: new Date().toISOString(),
      });
      router.push('/history');
    } catch {
      alert('Gagal menyimpan laporan.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-40 border-b border-base-200">
        <div className="flex-none">
          <Link href="/home" className="btn btn-square btn-ghost">
            <ChevronLeft size={24} />
          </Link>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Isi Laporan Harian</h1>
        </div>
      </div>

      <main className="flex-1 px-5 py-6 animate-fade-in">
        <div className="card bg-base-100 shadow-xl border border-base-200/50">
          <div className="card-body p-5">
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-5">
                <label className="label">
                  <span className="label-text font-semibold">Hari / Tanggal</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary z-10">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    className="input input-bordered w-full pl-10 focus:input-primary"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control mb-5">
                <label className="label">
                  <span className="label-text font-semibold">Kegiatan Mengajar</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 text-primary pointer-events-none">
                    <FileText size={18} />
                  </div>
                  <textarea
                    className="textarea textarea-bordered w-full pl-10 min-h-[120px] focus:textarea-primary text-base"
                    placeholder="Contoh: Mengajarkan materi aqidah dan menyimak bacaan Al-Qur'an santri..."
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control mb-7">
                <label className="label">
                  <span className="label-text font-semibold">Keterangan <span className="text-base-content/50 font-normal">(opsional)</span></span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 text-primary pointer-events-none">
                    <AlignLeft size={18} />
                  </div>
                  <textarea
                    className="textarea textarea-bordered w-full pl-10 min-h-[80px] focus:textarea-primary text-base"
                    placeholder="Contoh: Pengertian Salam / Hadist Bertasyabuh"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full shadow-lg shadow-primary/30"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <><Send size={18} /> Simpan Laporan</>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
