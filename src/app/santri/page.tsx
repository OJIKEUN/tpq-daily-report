'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Users, 
  UserPlus, 
  Search, 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  Calendar, 
  GraduationCap, 
  UserCheck, 
  Filter,
  HeartHandshake,
  X,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export interface Santri {
  id: string;
  name: string;
  birth_date: string;
  gender: 'L' | 'P';
  father_name: string;
  mother_name: string;
  grade: string;
  created_by_uid?: string;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

const GRADE_OPTIONS = [
  'Semua Kelas',
  'TK / PAUD / Belum Sekolah',
  'Kelas 1 SD',
  'Kelas 2 SD',
  'Kelas 3 SD',
  'Kelas 4 SD',
  'Kelas 5 SD',
  'Kelas 6 SD',
  'Kelas 1 SMP',
  'Kelas 2 SMP',
  'Kelas 3 SMP',
  'Kelas 1 SMA/SMK',
  'Kelas 2 SMA/SMK',
  'Kelas 3 SMA/SMK',
];

export default function SantriListPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [filteredList, setFilteredList] = useState<Santri[]>([]);
  const [fetching, setFetching] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Semua Kelas');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'L' | 'P'>('ALL');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      fetchSantri();
    }
  }, [user, loading, router]);

  const fetchSantri = async () => {
    setFetching(true);
    try {
      const q = query(collection(db, 'students'), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      const list: Santri[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Santri);
      });
      setSantriList(list);
      setFilteredList(list);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Gagal mengambil data santri.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const q = search.toLowerCase().trim();
    let result = santriList.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.father_name && s.father_name.toLowerCase().includes(q)) ||
        (s.mother_name && s.mother_name.toLowerCase().includes(q)) ||
        (s.created_by_name && s.created_by_name.toLowerCase().includes(q));

      const matchGrade = selectedGrade === 'Semua Kelas' || s.grade === selectedGrade;
      const matchGender = selectedGender === 'ALL' || s.gender === selectedGender;

      return matchSearch && matchGrade && matchGender;
    });

    setFilteredList(result);
  }, [search, selectedGrade, selectedGender, santriList]);

  const handleDelete = async (s: Santri) => {
    const confirmMessage = `Apakah Anda yakin ingin menghapus data santri "${s.name}"?\nData yang dihapus tidak dapat dikembalikan.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'students', s.id));
      setSantriList((prev) => prev.filter((item) => item.id !== s.id));
      alert(`Data santri "${s.name}" berhasil dihapus.`);
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Gagal menghapus data santri.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const countMale = santriList.filter((s) => s.gender === 'L').length;
  const countFemale = santriList.filter((s) => s.gender === 'P').length;

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const backUrl = userData?.role === 'admin' ? '/admin' : '/home';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-base-200">
      {/* Top Navbar */}
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-40 border-b border-base-200">
        <div className="flex-none">
          <Link href={backUrl} className="btn btn-square btn-ghost">
            <ChevronLeft size={24} />
          </Link>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Data Santriwan & Santriwati</h1>
        </div>
      </div>

      <div className="main-content px-5 pt-5 pb-6">
        {/* Banner Ringkasan */}
        <div className="card bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-lg shadow-primary/20 mb-5">
          <div className="card-body p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Total Santri Terdaftar</p>
                <h2 className="text-2xl font-bold text-white mt-0.5">{santriList.length} Santri</h2>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Users size={24} className="text-white" />
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-white/20 text-xs font-medium">
              <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white flex items-center gap-1">
                👦 Santriwan: {countMale}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white flex items-center gap-1">
                👧 Santriwati: {countFemale}
              </span>
            </div>
          </div>
        </div>

        {/* Tombol Tambah Santri */}
        <Link
          href="/santri/create"
          className="btn btn-primary text-white w-full shadow-lg shadow-primary/30 mb-5 text-[15px]"
        >
          <UserPlus size={20} /> Tambah Santri Baru
        </Link>

        {/* Filter & Search Card */}
        <div className="card bg-base-100 shadow-sm border border-base-200 mb-5 p-4 flex flex-col gap-3.5 animate-fade-in">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
              <Search size={18} />
            </div>
            <input
              type="text"
              className="input input-bordered w-full pl-10 pr-9 focus:input-primary bg-base-200/50 text-sm rounded-xl h-11"
              placeholder="Cari nama santri / orang tua..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content/80 transition-colors"
                title="Hapus pencarian"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Gender (Segmented Tabs) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">
                Jenis Kelamin
              </span>
              {selectedGender !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedGender('ALL')}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-base-200/60 rounded-xl border border-base-200">
              <button
                type="button"
                onClick={() => setSelectedGender('ALL')}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all text-center ${
                  selectedGender === 'ALL'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-base-content/70 hover:bg-base-100'
                }`}
              >
                Semua ({santriList.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedGender('L')}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                  selectedGender === 'L'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-base-content/70 hover:bg-base-100'
                }`}
              >
                👦 Santriwan ({countMale})
              </button>
              <button
                type="button"
                onClick={() => setSelectedGender('P')}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                  selectedGender === 'P'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-base-content/70 hover:bg-base-100'
                }`}
              >
                👧 Santriwati ({countFemale})
              </button>
            </div>
          </div>

          {/* Filter Kelas (Full-Width Dropdown) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">
                Tingkat / Kelas
              </span>
              {selectedGrade !== 'Semua Kelas' && (
                <button
                  type="button"
                  onClick={() => setSelectedGrade('Semua Kelas')}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary">
                <GraduationCap size={18} />
              </div>
              <select
                className="select select-bordered w-full pl-10 focus:select-primary bg-base-100 text-xs sm:text-sm font-medium rounded-xl h-11 border-base-200"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g === 'Semua Kelas' ? '🎓 Semua Tingkat / Kelas' : `📚 ${g}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Info & Reset Button */}
          {(selectedGrade !== 'Semua Kelas' || selectedGender !== 'ALL' || search) && (
            <div className="flex items-center justify-between pt-2 border-t border-base-200 text-xs">
              <span className="text-base-content/60">
                Ditemukan <strong className="text-primary font-bold">{filteredList.length}</strong> santri
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedGrade('Semua Kelas');
                  setSelectedGender('ALL');
                }}
                className="btn btn-ghost btn-xs text-error gap-1 px-2 font-semibold"
              >
                <RotateCcw size={12} /> Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* List Data Santri */}
        {fetching ? (
          <div className="flex justify-center mt-16">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center text-center mt-16 px-6 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-base-100 flex items-center justify-center mb-4 shadow-sm border border-base-200">
              <Users size={32} className="text-base-content/30" />
            </div>
            <h2 className="font-bold text-base-content text-lg">Tidak ada data santri</h2>
            <p className="text-sm text-base-content/60 mt-1 leading-relaxed">
              {search || selectedGrade !== 'Semua Kelas' || selectedGender !== 'ALL'
                ? 'Tidak ditemukan santri yang sesuai filter pencarian.'
                : 'Belum ada data santri yang didaftarkan.'}
            </p>
            {santriList.length === 0 && (
              <Link href="/santri/create" className="btn btn-primary text-white mt-5 px-6 shadow-md shadow-primary/30">
                Tambah Santri Pertama
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 animate-fade-in pb-12">
            <div className="text-xs font-semibold text-base-content/60 px-1">
              Menampilkan {filteredList.length} dari {santriList.length} santri
            </div>

            {filteredList.map((s) => {
              const isMale = s.gender === 'L';
              return (
                <div
                  key={s.id}
                  className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="card-body p-4 sm:p-5">
                    {/* Header Card: Nama & Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold ${
                            isMale
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                          }`}
                        >
                          {isMale ? '👦' : '👧'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base-content text-[15px] truncate">{s.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span
                              className={`badge badge-sm font-medium ${
                                isMale
                                  ? 'badge-info badge-outline'
                                  : 'badge-secondary badge-outline'
                              }`}
                            >
                              {isMale ? 'Santriwan' : 'Santriwati'}
                            </span>
                            <span className="badge badge-sm badge-ghost font-medium">
                              {s.grade}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="divider my-2.5 opacity-40"></div>

                    {/* Detail Info */}
                    <div className="grid grid-cols-1 gap-2 text-xs text-base-content/80">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-primary shrink-0" />
                        <span className="text-base-content/50">Tgl Lahir:</span>
                        <span className="font-semibold text-base-content">{formatDate(s.birth_date)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <HeartHandshake size={14} className="text-primary shrink-0" />
                        <span className="text-base-content/50">Orang Tua:</span>
                        <span className="font-semibold text-base-content">
                          Ayah: {s.father_name || '-'} | Ibu: {s.mother_name || '-'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-base-200/50 text-[11px] text-base-content/60">
                        <UserCheck size={13} className="text-base-content/40 shrink-0" />
                        <span>
                          Dibuat oleh: <strong className="text-base-content/80">{s.created_by_name || 'Guru TPQ'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Edit & Delete */}
                    <div className="flex gap-2 pt-3 mt-1 border-t border-base-200/60">
                      <Link
                        href={`/santri/edit/${s.id}`}
                        className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 flex-1 gap-1.5"
                      >
                        <Pencil size={14} /> Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(s)}
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10 flex-1 gap-1.5"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
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
