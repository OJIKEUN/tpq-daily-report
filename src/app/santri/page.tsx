'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
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
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileText,
  User,
  Phone,
  MapPin,
  CalendarCheck,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { generateSantriExcel, generateSantriPDF } from '@/lib/exportSantriUtils';
import { useToast } from '@/context/ToastContext';

export interface Santri {
  id: string;
  name: string;
  birth_date: string;
  gender: 'L' | 'P';
  father_name: string;
  mother_name: string;
  grade: string;
  entry_date?: string;
  status?: string;
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
  const { showToast } = useToast();
  const router = useRouter();

  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [filteredList, setFilteredList] = useState<Santri[]>([]);
  const [fetching, setFetching] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Semua Kelas');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [selectedCreator, setSelectedCreator] = useState('ALL');

  // User Profile Data (for export auto-fill)
  const [userProfile, setUserProfile] = useState<{ name: string; address: string; phone: string }>({
    name: '',
    address: '',
    phone: '',
  });

  // Export States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<'ALL' | 'CREATOR' | 'FILTERED'>('ALL');
  const [exportCreator, setExportCreator] = useState<string>('ALL');
  const [exportTeacherName, setExportTeacherName] = useState('');
  const [exportTeacherAddress, setExportTeacherAddress] = useState('');
  const [exportTeacherPhone, setExportTeacherPhone] = useState('');
  const [exportTahunAjaran, setExportTahunAjaran] = useState('2026/2027');
  const [includeGrade, setIncludeGrade] = useState(false);
  const [tanggalPengesahan, setTanggalPengesahan] = useState(new Date().toISOString().split('T')[0]);
  const [penandaTangan, setPenandaTangan] = useState('Sugiarti');
  const [exporting, setExporting] = useState(false);

  // Delete Confirmation States
  const [santriToDelete, setSantriToDelete] = useState<Santri | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Unique list of creators
  const creatorOptions = useMemo(() => {
    const set = new Set<string>();
    santriList.forEach((s) => {
      if (s.created_by_name && s.created_by_name.trim()) {
        set.add(s.created_by_name.trim());
      }
    });
    return Array.from(set).sort();
  }, [santriList]);

  // Load user profile
  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid))
        .then((snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setUserProfile({
              name: d.name || userData?.name || user.displayName || '',
              address: d.address || '',
              phone: d.phone || '',
            });
          } else if (userData?.name) {
            setUserProfile({
              name: userData.name,
              address: '',
              phone: '',
            });
          }
        })
        .catch(console.error);
    }
  }, [user, userData]);

  const handleOpenExportModal = () => {
    // If empty, auto-populate from user profile
    setExportTeacherName((prev) => prev || userProfile.name || userData?.name || user?.displayName || '');
    setExportTeacherAddress((prev) => prev || userProfile.address || '');
    setExportTeacherPhone((prev) => prev || userProfile.phone || '');

    // Setup initial scope
    if (selectedCreator !== 'ALL') {
      setExportScope('CREATOR');
      setExportCreator(selectedCreator === 'ME' ? (userData?.name || user?.displayName || 'Saya') : selectedCreator);
    } else if (selectedGrade !== 'Semua Kelas' || selectedGender !== 'ALL' || search) {
      setExportScope('FILTERED');
    } else {
      setExportScope('ALL');
    }

    setShowExportModal(true);
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    let dataToExport: Santri[] = [];
    let subtitle = 'Semua Tingkat / Kelas';

    if (exportScope === 'ALL') {
      dataToExport = santriList;
      subtitle = 'Semua Santri';
    } else if (exportScope === 'CREATOR') {
      if (exportCreator === 'ALL') {
        dataToExport = santriList;
        subtitle = 'Semua Guru / Pembuat';
      } else {
        dataToExport = santriList.filter(
          (s) => s.created_by_name === exportCreator || (exportCreator === 'Saya' && s.created_by_uid === user?.uid)
        );
        subtitle = `Guru: ${exportCreator}`;
      }
    } else {
      // FILTERED
      dataToExport = filteredList;
      const filters: string[] = [];
      if (selectedGrade !== 'Semua Kelas') filters.push(selectedGrade);
      if (selectedGender === 'L') filters.push('Santriwan');
      if (selectedGender === 'P') filters.push('Santriwati');
      if (selectedCreator !== 'ALL') filters.push(selectedCreator === 'ME' ? 'Santri Saya' : selectedCreator);
      if (search) filters.push(`Pencarian: "${search}"`);
      subtitle = filters.length > 0 ? filters.join(' - ') : 'Data Terfilter';
    }

    if (dataToExport.length === 0) {
      showToast('Tidak ada data santri untuk diekspor.', 'error');
      return;
    }

    setExporting(true);
    try {
      const options = {
        santriList: dataToExport,
        tanggalPengesahan,
        penandaTangan,
        subtitle,
        namaGuru: exportTeacherName.trim(),
        alamatGuru: exportTeacherAddress.trim(),
        noHpGuru: exportTeacherPhone.trim(),
        tahunAjaran: exportTahunAjaran.trim() || '2026/2027',
        includeGrade,
      };

      if (type === 'pdf') {
        await generateSantriPDF(options);
      } else {
        await generateSantriExcel(options);
      }
      setShowExportModal(false);
      showToast(`Berhasil mengekspor dokumen ${type.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Gagal mengekspor data santri.', 'error');
    } finally {
      setExporting(false);
    }
  };

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
      showToast('Gagal mengambil data santri.', 'error');
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
      const matchCreator =
        selectedCreator === 'ALL'
          ? true
          : selectedCreator === 'ME'
          ? s.created_by_uid === user?.uid || s.created_by_name === (userData?.name || user?.displayName)
          : s.created_by_name === selectedCreator;

      return matchSearch && matchGrade && matchGender && matchCreator;
    });

    setFilteredList(result);
  }, [search, selectedGrade, selectedGender, selectedCreator, santriList, user, userData]);

  const confirmDelete = async () => {
    if (!santriToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'students', santriToDelete.id));
      setSantriList((prev) => prev.filter((item) => item.id !== santriToDelete.id));
      showToast(`Data santri "${santriToDelete.name}" berhasil dihapus.`, 'success');
      setSantriToDelete(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      showToast('Gagal menghapus data santri.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-base-200 pb-20">
      {/* Top Navbar */}
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-40 border-b border-base-200">
        <div className="flex-none">
          <Link href="/home" className="btn btn-square btn-ghost">
            <ChevronLeft size={24} />
          </Link>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Data Santriwan & Santriwati</h1>
        </div>
      </div>

      <div className="px-4 py-5 max-w-[480px] mx-auto w-full">
        {/* Banner Statistik Total Santri */}
        <div className="card bg-gradient-to-r from-primary to-indigo-600 text-primary-content shadow-lg mb-4">
          <div className="card-body p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  Total Santri Terdaftar
                </p>
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

        {/* Tombol Aksi: Tambah & Export */}
        <div className="flex gap-2.5 mb-4">
          <Link
            href="/santri/create"
            className="btn btn-primary text-white flex-1 shadow-md shadow-primary/30 text-[14px]"
          >
            <UserPlus size={18} /> Tambah Santri
          </Link>
          <button
            type="button"
            onClick={handleOpenExportModal}
            className="btn bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 text-[14px] px-4 shrink-0 gap-1.5 border-none"
          >
            <Download size={18} /> Export
          </button>
        </div>

        {/* Filter & Search Card */}
        <div className="card bg-base-100 shadow-sm border border-base-200 mb-5 p-4 flex flex-col gap-3.5 animate-fade-in">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari nama santri / orang tua..."
              className="input input-bordered w-full pl-10 pr-9 text-xs sm:text-sm bg-base-100 rounded-xl h-11 border-base-200 focus:input-primary"
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

          {/* Filter Guru Pembuat (Created User Dropdown) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">
                Guru Pembuat (Input By)
              </span>
              {selectedCreator !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedCreator('ALL')}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary">
                <UserCheck size={18} />
              </div>
              <select
                className="select select-bordered w-full pl-10 focus:select-primary bg-base-100 text-xs sm:text-sm font-medium rounded-xl h-11 border-base-200"
                value={selectedCreator}
                onChange={(e) => setSelectedCreator(e.target.value)}
              >
                <option value="ALL">👥 Semua Guru / Pembuat</option>
                {user && (
                  <option value="ME">
                    👤 Santri Saya ({userData?.name || user.displayName || 'Saya'})
                  </option>
                )}
                {creatorOptions.map((c) => (
                  <option key={c} value={c}>
                    👨‍🏫 {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Info & Reset Button */}
          {(selectedGrade !== 'Semua Kelas' || selectedGender !== 'ALL' || selectedCreator !== 'ALL' || search) && (
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
                  setSelectedCreator('ALL');
                }}
                className="btn btn-ghost btn-xs text-error gap-1 px-2 font-semibold"
              >
                <RotateCcw size={12} /> Reset Semua Filter
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
              {search || selectedGrade !== 'Semua Kelas' || selectedGender !== 'ALL' || selectedCreator !== 'ALL'
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
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between px-1 text-xs text-base-content/60">
              <span>Menampilkan {filteredList.length} dari {santriList.length} santri</span>
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
                            <span
                              className={`badge badge-sm font-semibold text-white ${
                                (s.status || 'Aktif') === 'Aktif'
                                  ? 'bg-emerald-600'
                                  : s.status === 'Lulus'
                                  ? 'bg-blue-600'
                                  : s.status === 'Pindah'
                                  ? 'bg-amber-600'
                                  : 'bg-slate-500'
                              }`}
                            >
                              {s.status || 'Aktif'}
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

                      {s.entry_date && (
                        <div className="flex items-center gap-2">
                          <CalendarCheck size={14} className="text-emerald-600 shrink-0" />
                          <span className="text-base-content/50">Mulai Masuk:</span>
                          <span className="font-semibold text-base-content">{formatDate(s.entry_date)}</span>
                        </div>
                      )}

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
                        onClick={() => setSantriToDelete(s)}
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

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 sm:px-4 animate-fade-in backdrop-blur-xs">
          <div className="bg-base-100 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-scale border border-base-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between shrink-0 bg-base-100">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-base-content">Export Data Santri</h3>
                <p className="text-xs text-base-content/60 mt-0.5">Format Berkas Resmi Badko TPQ Batam</p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="btn btn-ghost btn-circle btn-sm text-base-content/50"
                disabled={exporting}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto flex-1 text-xs">
              {/* Cakupan Data */}
              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
                    Cakupan Santri yang Diexport
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setExportScope('ALL')}
                    className={`p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      exportScope === 'ALL'
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-base-200 text-base-content/70 hover:bg-base-200/50'
                    }`}
                  >
                    <span>Semua Santri</span>
                    <span className="text-[10px] opacity-75 font-normal">({santriList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportScope('CREATOR');
                      if (exportCreator === 'ALL' && creatorOptions.length > 0) {
                        const myName = userData?.name || user?.displayName;
                        const defaultC = creatorOptions.includes(myName || '') ? myName! : creatorOptions[0];
                        setExportCreator(defaultC);
                        setExportTeacherName(defaultC);
                      }
                    }}
                    className={`p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      exportScope === 'CREATOR'
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-base-200 text-base-content/70 hover:bg-base-200/50'
                    }`}
                  >
                    <span>By Guru</span>
                    <span className="text-[10px] opacity-75 font-normal">Pilih Guru</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportScope('FILTERED')}
                    className={`p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      exportScope === 'FILTERED'
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-base-200 text-base-content/70 hover:bg-base-200/50'
                    }`}
                  >
                    <span>Sesuai Filter</span>
                    <span className="text-[10px] opacity-75 font-normal">({filteredList.length})</span>
                  </button>
                </div>

                {/* Dropdown Pemilih Guru (Jika By Guru) */}
                {exportScope === 'CREATOR' && (
                  <div className="mt-2.5 p-2.5 bg-base-200/60 rounded-xl border border-base-200 flex flex-col gap-1.5 animate-fade-in">
                    <label className="text-[11px] font-bold text-base-content/70">
                      Pilih Guru Pembuat:
                    </label>
                    <select
                      className="select select-bordered select-sm w-full bg-base-100 text-xs rounded-lg"
                      value={exportCreator}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExportCreator(val);
                        if (val !== 'ALL') {
                          if (val === (userData?.name || user?.displayName) || val === 'Saya') {
                            setExportTeacherName(userProfile.name || userData?.name || '');
                            setExportTeacherAddress(userProfile.address || '');
                            setExportTeacherPhone(userProfile.phone || '');
                          } else {
                            setExportTeacherName(val);
                          }
                        }
                      }}
                    >
                      <option value="ALL">Semua Guru ({santriList.length} Santri)</option>
                      {creatorOptions.map((c) => {
                        const count = santriList.filter((s) => s.created_by_name === c).length;
                        return (
                          <option key={c} value={c}>
                            👨‍🏫 {c} ({count} Santri)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Data Identitas Guru */}
              <div className="p-3 bg-base-200/40 rounded-2xl border border-base-200 flex flex-col gap-2.5">
                <span className="font-bold text-[11px] uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
                  <User size={13} className="text-primary" /> Identitas Guru (Pada Dokumen)
                </span>

                {/* Nama Guru */}
                <div className="form-control">
                  <label className="label py-0.5">
                    <span className="label-text font-semibold text-[11px] text-base-content/70">
                      Nama Guru
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full focus:input-primary text-xs rounded-lg"
                    value={exportTeacherName}
                    onChange={(e) => setExportTeacherName(e.target.value)}
                    placeholder="Contoh: Sugiarti, S.Pd"
                    disabled={exporting}
                  />
                </div>

                {/* Alamat Guru */}
                <div className="form-control">
                  <label className="label py-0.5">
                    <span className="label-text font-semibold text-[11px] text-base-content/70">
                      Alamat
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full focus:input-primary text-xs rounded-lg"
                    value={exportTeacherAddress}
                    onChange={(e) => setExportTeacherAddress(e.target.value)}
                    placeholder="Contoh: Perum Merlion Square Blok L No. 10"
                    disabled={exporting}
                  />
                </div>

                {/* No HP Guru */}
                <div className="form-control">
                  <label className="label py-0.5">
                    <span className="label-text font-semibold text-[11px] text-base-content/70">
                      Nomor HP / WhatsApp
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full focus:input-primary text-xs rounded-lg"
                    value={exportTeacherPhone}
                    onChange={(e) => setExportTeacherPhone(e.target.value)}
                    placeholder="Contoh: 0852-8310-4789"
                    disabled={exporting}
                  />
                </div>
              </div>

              {/* Data Administrasi Dokumen */}
              <div className="grid grid-cols-2 gap-2">
                {/* Tahun Ajaran */}
                <div className="form-control">
                  <label className="label py-0.5">
                    <span className="label-text font-semibold text-[11px] text-base-content/70">
                      Tahun Ajaran
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full focus:input-primary text-xs rounded-lg"
                    value={exportTahunAjaran}
                    onChange={(e) => setExportTahunAjaran(e.target.value)}
                    placeholder="2026/2027"
                    disabled={exporting}
                  />
                </div>

                {/* Tanggal Surat / Pengesahan */}
                <div className="form-control">
                  <label className="label py-0.5">
                    <span className="label-text font-semibold text-[11px] text-base-content/70">
                      Tanggal Pengesahan
                    </span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered input-sm w-full focus:input-primary text-xs rounded-lg"
                    value={tanggalPengesahan}
                    onChange={(e) => setTanggalPengesahan(e.target.value)}
                    disabled={exporting}
                  />
                </div>
              </div>

              {/* Nama Kepala TPQ (Penandatangan) */}
              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text font-semibold text-[11px] text-base-content/70">
                    Nama Penandatangan (Kepala TPQ)
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full focus:input-primary text-xs rounded-lg"
                  value={penandaTangan}
                  onChange={(e) => setPenandaTangan(e.target.value)}
                  placeholder="Contoh: Sugiarti"
                  disabled={exporting}
                />
              </div>

              {/* Opsi Kolom Kelas */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-base-200 bg-base-100 cursor-pointer hover:bg-base-200/40 transition-colors">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-xs rounded-md"
                  checked={includeGrade}
                  onChange={(e) => setIncludeGrade(e.target.checked)}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-base-content">Sertakan Kolom Kelas</span>
                  <span className="text-[10px] text-base-content/50">Centang jika ingin menyisipkan kolom Tingkat / Kelas di tabel dokumen</span>
                </div>
              </label>

              {/* Tombol Export */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  className="btn bg-red-600 hover:bg-red-700 text-white border-none w-full shadow-md shadow-red-600/25 h-11 text-sm font-semibold gap-2 rounded-xl"
                >
                  {exporting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <FileText size={18} /> Download Dokumen PDF
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleExport('excel')}
                  disabled={exporting}
                  className="btn bg-green-600 hover:bg-green-700 text-white border-none w-full shadow-md shadow-green-600/25 h-11 text-sm font-semibold gap-2 rounded-xl"
                >
                  {exporting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <FileSpreadsheet size={18} /> Download Berkas Excel
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  disabled={exporting}
                  className="btn btn-ghost btn-sm w-full text-base-content/60"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {santriToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-fade-in backdrop-blur-xs">
          <div className="bg-base-100 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-base-200 animate-fade-in-scale p-5">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-base-content text-center">
              Hapus Data Santri?
            </h3>
            <p className="text-xs sm:text-sm text-base-content/70 text-center mt-1.5 leading-relaxed">
              Apakah Anda yakin ingin menghapus data santri <strong className="text-base-content font-bold">"{santriToDelete.name}"</strong>? Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                type="button"
                onClick={() => setSantriToDelete(null)}
                disabled={isDeleting}
                className="btn btn-ghost btn-sm h-10 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="btn btn-error btn-sm h-10 rounded-xl text-white font-semibold"
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
