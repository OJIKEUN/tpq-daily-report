'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileSpreadsheet, FileText, CloudDownload, Calendar, CalendarRange, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { generateExcel, generatePDF, ReportData, UserProfile } from '@/lib/exportUtils';

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

export default function ExportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!user) return;
    setIsExporting(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || !userDoc.data().name) {
        alert('Lengkapi profil Anda terlebih dahulu.');
        setIsExporting(false);
        return router.push('/profile');
      }
      const profile = userDoc.data() as UserProfile;
      const m = selectedMonth + 1;
      const start = `${selectedYear}-${String(m).padStart(2,'0')}-01`;
      const last = new Date(selectedYear, m, 0).getDate();
      const end = `${selectedYear}-${String(m).padStart(2,'0')}-${last}`;

      const snap = await getDocs(
        query(collection(db, 'reports'), where('user_id','==',user.uid), where('report_date','>=',start), where('report_date','<=',end), orderBy('report_date','asc'))
      );
      const reports: ReportData[] = [];
      snap.forEach((d) => reports.push(d.data() as ReportData));

      if (!reports.length) { alert('Tidak ada laporan pada periode ini.'); setIsExporting(false); return; }
      if (format === 'excel') await generateExcel(m, selectedYear, profile, reports);
      else await generatePDF(m, selectedYear, profile, reports);
    } catch (error: any) { 
      alert('Terjadi kesalahan saat export: ' + (error?.message || String(error))); 
    }
    finally { setIsExporting(false); }
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
          <h1 className="text-lg font-bold">Export Laporan</h1>
        </div>
      </div>

      <div className="main-content px-5 py-6 animate-fade-in">
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg shadow-primary/30 mb-3">
            <CloudDownload size={28} className="text-primary-content" />
          </div>
          <h2 className="font-bold text-base-content text-lg">Unduh Laporan</h2>
          <p className="text-sm text-base-content/60 text-center mt-1">Pilih periode lalu unduh dalam format Excel atau PDF</p>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200 mb-7">
          <div className="card-body p-5">
            <div className="form-control mb-5">
              <label className="label py-1">
                <span className="label-text font-semibold">Bulan</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                  <Calendar size={18} />
                </div>
                <select
                  className="select select-bordered w-full pl-10 focus:select-primary"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold">Tahun</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                  <CalendarRange size={18} />
                </div>
                <select
                  className="select select-bordered w-full pl-10 focus:select-primary"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="btn btn-success text-success-content h-14 w-full shadow-sm"
          >
            {isExporting
              ? <span className="loading loading-spinner loading-md"></span>
              : <><FileSpreadsheet size={22} /> Download Excel</>
            }
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="btn btn-error text-error-content h-14 w-full shadow-sm"
          >
            {isExporting
              ? <span className="loading loading-spinner loading-md"></span>
              : <><FileText size={22} /> Download PDF</>
            }
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
