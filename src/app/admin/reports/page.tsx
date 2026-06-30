'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileText, CalendarX2, ChevronLeft, Filter, BarChart3, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

interface Report {
  id: string;
  user_name: string;
  report_date: string;
  activity: string;
  description: string;
}

export default function GlobalReportsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  
  const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'admin')) {
      router.push('/');
    } else if (user && userData?.role === 'admin') {
      fetchReports();
    }
  }, [user, userData, loading, router, selectedMonth, selectedYear]);

  const fetchReports = async () => {
    setFetching(true);
    const m = selectedMonth + 1;
    const start = `${selectedYear}-${String(m).padStart(2,'0')}-01`;
    const last = new Date(selectedYear, m, 0).getDate();
    const end = `${selectedYear}-${String(m).padStart(2,'0')}-${last}`;

    try {
      const snap = await getDocs(
        query(
          collection(db, 'reports'), 
          where('report_date', '>=', start),
          where('report_date', '<=', end),
          orderBy('report_date', 'desc')
        )
      );
      const list: Report[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Report));
      setReports(list);
    } catch (error) {
      console.error("Error fetching reports", error);
    } finally {
      setFetching(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Hapus laporan guru ini secara permanen?')) return;
    try {
      await deleteDoc(doc(db, 'reports', id));
      setReports((r) => r.filter((x) => x.id !== id));
    } catch { alert('Gagal menghapus.'); }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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
          <h1 className="text-lg font-bold">Rekap Laporan</h1>
        </div>
      </div>

      <div className="main-content px-5 pt-5 pb-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-3">
            <BarChart3 size={28} className="text-white" />
          </div>
          <p className="text-sm text-base-content/60 text-center mt-1">Pantau semua laporan harian guru</p>
        </div>
        
        <div className="flex gap-2 mb-4 items-center bg-base-100 p-2 rounded-xl shadow-sm border border-base-200">
          <Filter size={18} className="text-base-content/50 ml-2" />
          <select 
            className="select select-ghost select-sm flex-1 focus:bg-base-200"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            className="select select-ghost select-sm flex-1 focus:bg-base-200 border-l border-base-200 rounded-none"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {fetching ? (
          <div className="flex justify-center mt-16">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center text-center mt-16 px-6 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-base-100 flex items-center justify-center mb-4 shadow-sm border border-base-200">
              <CalendarX2 size={32} className="text-base-content/30" />
            </div>
            <h2 className="font-bold text-base-content text-lg">Belum ada data</h2>
            <p className="text-sm text-base-content/60 mt-2 leading-relaxed">Tidak ada guru yang mengirim laporan pada periode ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="badge badge-primary badge-outline mb-2 self-end">{reports.length} Laporan</div>
            {reports.map((r) => {
              const open = expandedId === r.id;
              return (
                <div
                  key={r.id}
                  className={`collapse collapse-arrow bg-base-100 border transition-all duration-200 ${
                    open ? 'collapse-open border-violet-500/40 shadow-md' : 'collapse-close border-base-200/60 shadow-sm hover:border-base-300'
                  }`}
                >
                  <div 
                    className="collapse-title flex items-center gap-3 p-4 pr-12 min-h-0 cursor-pointer"
                    onClick={() => setExpandedId(open ? null : r.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-violet-600 mb-0.5">{r.user_name || 'Guru'}</p>
                      <p className="text-[11px] text-base-content/60">{formatDate(r.report_date)}</p>
                    </div>
                  </div>

                  <div className="collapse-content px-4 pb-4">
                    <div className="pl-13" style={{ paddingLeft: '52px' }}>
                      <div className="divider my-0 mb-3 opacity-50"></div>
                      <div className="mb-4">
                        <p className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide mb-1.5">Kegiatan</p>
                        <p className="text-sm text-base-content/80 leading-relaxed whitespace-pre-wrap">{r.activity}</p>
                      </div>
                      {r.description && (
                        <div className="mb-4">
                          <p className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide mb-1.5">Keterangan</p>
                          <p className="text-sm text-base-content/80 leading-relaxed whitespace-pre-wrap">{r.description}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-3 border-t border-base-200/50">
                        <button
                          onClick={(e) => handleDelete(r.id, e)}
                          className="btn btn-sm btn-outline border-error text-error hover:bg-error hover:text-white hover:border-error flex-1"
                        >
                          <Trash2 size={14} /> Hapus Laporan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
