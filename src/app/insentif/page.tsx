'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileText, ChevronLeft, Plus, Pencil, Trash2, Download } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { IncentiveLetterData, generateIncentivePDF, generateIncentiveExcel } from '@/lib/exportIncentiveUtils';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function InsentifPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [letters, setLetters] = useState<IncentiveLetterData[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportData, setSelectedExportData] = useState<IncentiveLetterData | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      fetchLetters();
    }
  }, [user, loading, router]);

  const fetchLetters = async () => {
    setFetching(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'incentive_letters'), orderBy('created_at', 'desc'))
      );
      const list: IncentiveLetterData[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as IncentiveLetterData));
      setLetters(list);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Hapus surat insentif ini secara permanen?')) return;
    try {
      await deleteDoc(doc(db, 'incentive_letters', id));
      setLetters(r => r.filter(x => x.id !== id));
    } catch {
      alert('Gagal menghapus surat.');
    }
  };

  const handleOpenExport = (data: IncentiveLetterData, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedExportData(data);
    setShowExportModal(true);
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    if (!selectedExportData) return;
    setExporting(true);
    try {
      if (type === 'pdf') {
        await generateIncentivePDF(selectedExportData);
      } else {
        await generateIncentiveExcel(selectedExportData);
      }
      setShowExportModal(false);
    } catch (e) {
      console.error(e);
      alert('Gagal mengekspor dokumen.');
    } finally {
      setExporting(false);
    }
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
          <h1 className="text-lg font-bold">Surat Insentif</h1>
        </div>
      </div>

      <div className="main-content px-5 pt-5 pb-6">
        <Link href="/insentif/create" className="btn btn-primary text-white w-full shadow-lg shadow-primary/30 mb-5 text-[15px]">
          <Plus size={20} /> Buat Surat Baru
        </Link>

        {fetching ? (
          <div className="flex justify-center mt-16">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : letters.length === 0 ? (
          <div className="flex flex-col items-center text-center mt-20 px-6 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-base-100 flex items-center justify-center mb-4 shadow-sm border border-base-200">
              <FileText size={32} className="text-base-content/30" />
            </div>
            <h2 className="font-bold text-base-content text-lg">Belum ada surat</h2>
            <p className="text-sm text-base-content/60 mt-2 leading-relaxed">Buat surat permohonan pencairan insentif pertama Anda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="badge badge-primary badge-outline mb-2 self-end">{letters.length} Surat</div>
            {letters.map((r) => {
              const open = expandedId === r.id;
              return (
                <div
                  key={r.id}
                  className={`collapse collapse-arrow bg-base-100 border transition-all duration-200 ${
                    open ? 'collapse-open border-emerald-500/40 shadow-md' : 'collapse-close border-base-200/60 shadow-sm hover:border-base-300'
                  }`}
                >
                  <div 
                    className="collapse-title flex items-center gap-3 p-4 pr-12 min-h-0 cursor-pointer"
                    onClick={() => setExpandedId(open ? null : r.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-emerald-600 mb-0.5">{r.nomor || 'Tanpa Nomor'}</p>
                      <p className="text-[11px] text-base-content/60">Periode: {MONTHS[r.periode_start_month]} - {MONTHS[r.periode_end_month]} {r.periode_year}</p>
                    </div>
                  </div>

                  <div className="collapse-content px-4 pb-4">
                    <div className="pl-13" style={{ paddingLeft: '52px' }}>
                      <div className="divider my-0 mb-3 opacity-50"></div>
                      <div className="mb-4">
                        <p className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide mb-1.5">Perihal</p>
                        <p className="text-sm text-base-content/80 leading-relaxed whitespace-pre-wrap">{r.perihal}</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide mb-1.5">Jumlah Guru</p>
                        <p className="text-sm text-base-content/80 leading-relaxed whitespace-pre-wrap">{r.teachers?.length || 0} Orang</p>
                      </div>
                      
                      <div className="flex gap-2 pt-3 border-t border-base-200/50">
                        <button
                          onClick={(e) => handleOpenExport(r, e)}
                          className="btn btn-sm btn-ghost text-emerald-600 hover:bg-emerald-50 flex-1"
                        >
                          <Download size={14} /> Export
                        </button>
                        <Link
                          href={`/insentif/edit/${r.id}`}
                          className="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50 flex-1"
                        >
                          <Pencil size={14} /> Edit
                        </Link>
                        <button
                          onClick={(e) => handleDelete(r.id!, e)}
                          className="btn btn-sm btn-ghost text-error hover:bg-error/10 flex-1"
                        >
                          <Trash2 size={14} /> Hapus
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

      {/* EXPORT MODAL */}
      {showExportModal && selectedExportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-in">
          <div className="bg-base-100 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-fade-in-scale">
            <div className="p-5 border-b border-base-200">
              <h3 className="font-bold text-lg text-base-content">Export Surat</h3>
              <p className="text-xs text-base-content/60 mt-1">Pilih format dokumen untuk diunduh</p>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <button 
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="btn bg-red-500 hover:bg-red-600 text-white border-none w-full shadow-lg shadow-red-500/30"
              >
                {exporting ? <span className="loading loading-spinner loading-sm"></span> : <><Download size={18} /> Download PDF</>}
              </button>
              <button 
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className="btn bg-green-500 hover:bg-green-600 text-white border-none w-full shadow-lg shadow-green-500/30"
              >
                {exporting ? <span className="loading loading-spinner loading-sm"></span> : <><Download size={18} /> Download Excel</>}
              </button>
              <button 
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
                className="btn btn-ghost w-full mt-2"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
