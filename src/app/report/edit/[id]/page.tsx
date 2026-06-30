'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar, FileText, AlignLeft, Save, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditReportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [date, setDate] = useState('');
  const [activity, setActivity] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/');
    else if (user && reportId) {
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'reports', reportId));
          if (snap.exists() && snap.data().user_id === user.uid) {
            const d = snap.data();
            setDate(d.report_date);
            setActivity(d.activity);
            setDescription(d.description || '');
          } else {
            alert('Laporan tidak ditemukan.');
            router.push('/history');
          }
        } catch { alert('Gagal mengambil data.'); }
        finally { setFetching(false); }
      })();
    }
  }, [user, loading, reportId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        report_date: date, activity, description, updated_at: new Date().toISOString(),
      });
      router.push('/history');
    } catch { alert('Gagal memperbarui.'); setIsSubmitting(false); }
  };

  if (fetching) {
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
          <Link href="/history" className="btn btn-square btn-ghost">
            <ChevronLeft size={24} />
          </Link>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Edit Laporan</h1>
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
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
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
                  <div className="absolute top-3 left-3 text-base-content/40 pointer-events-none">
                    <FileText size={18} />
                  </div>
                  <textarea
                    className="textarea textarea-bordered w-full pl-10 min-h-[120px] focus:textarea-primary text-base"
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
                  <div className="absolute top-3 left-3 text-base-content/40 pointer-events-none">
                    <AlignLeft size={18} />
                  </div>
                  <textarea
                    className="textarea textarea-bordered w-full pl-10 min-h-[80px] focus:textarea-primary text-base"
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
                  <><Save size={18} /> Perbarui Laporan</>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
