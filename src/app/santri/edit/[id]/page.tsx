'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  User, 
  Calendar, 
  GraduationCap, 
  Users, 
  Save, 
  ChevronLeft,
  HeartHandshake,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

const GRADE_OPTIONS = [
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

export default function EditSantriPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const santriId = params?.id as string;

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [grade, setGrade] = useState(GRADE_OPTIONS[1]);
  const [createdByName, setCreatedByName] = useState('');
  const [createdAt, setCreatedAt] = useState('');

  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user && santriId) {
      fetchSantriData();
    }
  }, [user, loading, santriId, router]);

  const fetchSantriData = async () => {
    setIsFetching(true);
    try {
      const snap = await getDoc(doc(db, 'students', santriId));
      if (snap.exists()) {
        const d = snap.data();
        setName(d.name || '');
        setBirthDate(d.birth_date || '');
        setGender(d.gender === 'P' ? 'P' : 'L');
        setFatherName(d.father_name || '');
        setMotherName(d.mother_name || '');
        setGrade(d.grade || GRADE_OPTIONS[1]);
        setCreatedByName(d.created_by_name || 'Guru TPQ');
        setCreatedAt(d.created_at || '');
      } else {
        showToast('Data santri tidak ditemukan.', 'error');
        router.push('/santri');
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      showToast('Gagal mengambil data santri.', 'error');
      router.push('/santri');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      showToast('Nama santri wajib diisi.', 'error');
      return;
    }
    if (!birthDate) {
      showToast('Tanggal lahir wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'students', santriId), {
        name: name.trim(),
        birth_date: birthDate,
        gender,
        father_name: fatherName.trim(),
        mother_name: motherName.trim(),
        grade,
        updated_at: new Date().toISOString(),
      });

      showToast(`Perubahan data santri "${name.trim()}" berhasil disimpan!`, 'success');
      router.push('/santri');
    } catch (error) {
      console.error('Error updating santri:', error);
      showToast('Gagal memperbarui data santri. Silakan coba lagi.', 'error');
      setIsSubmitting(false);
    }
  };

  if (loading || !user || isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-base-200">
      {/* Top Navbar */}
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-40 border-b border-base-200">
        <div className="flex-none">
          <Link href="/santri" className="btn btn-square btn-ghost">
            <ChevronLeft size={24} />
          </Link>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Edit Data Santri</h1>
        </div>
      </div>

      <main className="flex-1 px-5 py-6 animate-fade-in pb-16">
        <div className="card bg-base-100 shadow-xl border border-base-200/60">
          <div className="card-body p-5">
            <div className="mb-4">
              <h2 className="font-bold text-base-content text-base">Perbarui Data Santri</h2>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-base-content/60">
                <UserCheck size={14} className="text-primary" />
                <span>
                  Didaftarkan oleh: <strong>{createdByName}</strong>
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Nama Santri */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold">Nama Lengkap Santri</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary z-10">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10 focus:input-primary"
                    placeholder="Contoh: Muhammad Azzam Fathoni"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tanggal Lahir */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold">Tanggal Lahir</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary z-10">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    className="input input-bordered w-full pl-10 focus:input-primary"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Jenis Kelamin (Radio Button) */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold">Jenis Kelamin</span>
                </label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      gender === 'L'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold shadow-sm'
                        : 'border-base-200 hover:bg-base-200/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      className="radio radio-primary radio-sm"
                      checked={gender === 'L'}
                      onChange={() => setGender('L')}
                    />
                    <span className="text-sm">👦 Laki-laki (Santriwan)</span>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      gender === 'P'
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 font-semibold shadow-sm'
                        : 'border-base-200 hover:bg-base-200/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      className="radio radio-secondary radio-sm"
                      checked={gender === 'P'}
                      onChange={() => setGender('P')}
                    />
                    <span className="text-sm">👧 Perempuan (Santriwati)</span>
                  </label>
                </div>
              </div>

              {/* Kelas (Dropdown) */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold">Tingkat / Kelas</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary z-10">
                    <GraduationCap size={18} />
                  </div>
                  <select
                    className="select select-bordered w-full pl-10 focus:select-primary"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    required
                  >
                    <optgroup label="Tingkat Prasekolah">
                      <option value="TK / PAUD / Belum Sekolah">TK / PAUD / Belum Sekolah</option>
                    </optgroup>
                    <optgroup label="Tingkat SD / MI">
                      <option value="Kelas 1 SD">Kelas 1 SD</option>
                      <option value="Kelas 2 SD">Kelas 2 SD</option>
                      <option value="Kelas 3 SD">Kelas 3 SD</option>
                      <option value="Kelas 4 SD">Kelas 4 SD</option>
                      <option value="Kelas 5 SD">Kelas 5 SD</option>
                      <option value="Kelas 6 SD">Kelas 6 SD</option>
                    </optgroup>
                    <optgroup label="Tingkat SMP / MTs">
                      <option value="Kelas 1 SMP">Kelas 1 SMP</option>
                      <option value="Kelas 2 SMP">Kelas 2 SMP</option>
                      <option value="Kelas 3 SMP">Kelas 3 SMP</option>
                    </optgroup>
                    <optgroup label="Tingkat SMA / SMK / MA">
                      <option value="Kelas 1 SMA/SMK">Kelas 1 SMA/SMK</option>
                      <option value="Kelas 2 SMA/SMK">Kelas 2 SMA/SMK</option>
                      <option value="Kelas 3 SMA/SMK">Kelas 3 SMA/SMK</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Nama Ayah */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold">Nama Ayah</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40 z-10">
                    <Users size={18} />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10 focus:input-primary"
                    placeholder="Contoh: Bpk. Bambang Irawan"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Nama Ibu */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold">Nama Ibu</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40 z-10">
                    <HeartHandshake size={18} />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10 focus:input-primary"
                    placeholder="Contoh: Ibu Siti Rahmah"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tombol Simpan Perubahan */}
              <button
                type="submit"
                className="btn btn-primary w-full shadow-lg shadow-primary/30 mt-3 h-12 text-[15px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <Save size={18} /> Simpan Perubahan
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
