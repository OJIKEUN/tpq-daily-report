'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChevronLeft, Plus, Trash2, Save, FileText } from 'lucide-react';
import Link from 'next/link';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface RegisteredTeacher {
  id: string;
  name: string;
  no_sk: string;
  no_ktp: string;
  no_rek: string;
}

interface FormTeacher {
  type: 'registered' | 'manual';
  user_id: string;
  name: string;
  no_sk: string;
  no_ktp: string;
  no_rek: string;
}

export default function CreateInsentifPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [registeredTeachers, setRegisteredTeachers] = useState<RegisteredTeacher[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const now = new Date();
  const [nomor, setNomor] = useState(`051/TPQ DARUTTAUBAH/SPP/VI/${now.getFullYear()}`);
  const [lampiran, setLampiran] = useState('-');
  const [perihal, setPerihal] = useState('Surat Permohonan Pencairan Insentif Guru TPQ');
  const [kepada, setKepada] = useState('WALIKOTA BATAM Cq. Kabag Kesra Setdako Batam');
  const [startMonth, setStartMonth] = useState(3); // April
  const [endMonth, setEndMonth] = useState(5); // Juni
  const [periodeYear, setPeriodeYear] = useState(now.getFullYear());
  
  const [teachers, setTeachers] = useState<FormTeacher[]>([{ type: 'registered', user_id: '', name: '', no_sk: '', no_ktp: '', no_rek: '' }]);
  const [tanggalPengesahan, setTanggalPengesahan] = useState(now.toISOString().split('T')[0]);
  const [penandaTangan, setPenandaTangan] = useState('Sugiarti');

  const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    if (!loading && !user) router.push('/');
    else if (user) {
      fetchRegisteredTeachers();
    }
  }, [user, loading, router]);

  const fetchRegisteredTeachers = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'guru')));
      const list: RegisteredTeacher[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || '',
          no_sk: data.no_sk || '',
          no_ktp: data.no_ktp || '',
          no_rek: data.no_rek || '',
        });
      });
      setRegisteredTeachers(list);
    } catch (e) {
      console.error('Failed to load teachers', e);
    }
  };

  const handleTeacherTypeChange = (index: number, type: 'registered' | 'manual') => {
    const newT = [...teachers];
    newT[index] = { type, user_id: '', name: '', no_sk: '', no_ktp: '', no_rek: '' };
    setTeachers(newT);
  };

  const handleRegisteredTeacherChange = (index: number, userId: string) => {
    const newT = [...teachers];
    if (userId) {
      const found = registeredTeachers.find(t => t.id === userId);
      if (found) {
        newT[index] = { type: 'registered', user_id: userId, name: found.name, no_sk: found.no_sk, no_ktp: found.no_ktp, no_rek: found.no_rek };
      }
    } else {
      newT[index] = { type: 'registered', user_id: '', name: '', no_sk: '', no_ktp: '', no_rek: '' };
    }
    setTeachers(newT);
  };

  const handleManualTeacherChange = (index: number, field: keyof FormTeacher, value: string) => {
    const newT = [...teachers];
    newT[index] = { ...newT[index], [field]: value };
    setTeachers(newT);
  };

  const addTeacherRow = () => {
    setTeachers([...teachers, { type: 'registered', user_id: '', name: '', no_sk: '', no_ktp: '', no_rek: '' }]);
  };

  const removeTeacherRow = (index: number) => {
    const newT = [...teachers];
    newT.splice(index, 1);
    setTeachers(newT);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teachers.some(t => !t.name)) {
      alert('Nama guru tidak boleh kosong. Harap pilih guru atau isi nama manual.');
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'incentive_letters'), {
        nomor,
        lampiran,
        perihal,
        kepada,
        periode_start_month: startMonth,
        periode_end_month: endMonth,
        periode_year: periodeYear,
        tanggal_pengesahan: tanggalPengesahan,
        penanda_tangan: penandaTangan,
        teachers,
        created_at: new Date().toISOString(),
      });
      router.push('/insentif');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan surat insentif.');
    } finally {
      setIsSubmitting(false);
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
          <Link href="/insentif" className="btn btn-square btn-ghost">
            <ChevronLeft size={24} />
          </Link>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Buat Surat Baru</h1>
        </div>
      </div>

      <div className="main-content px-5 pt-6 pb-24 animate-fade-in">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Metadata Surat */}
          <div>
            <p className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-3 px-1">Informasi Surat</p>
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-5 flex flex-col gap-4">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-semibold">Nomor Surat</span></label>
                  <input type="text" className="input input-bordered w-full focus:input-primary" value={nomor} onChange={e => setNomor(e.target.value)} required />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-semibold">Lampiran</span></label>
                  <input type="text" className="input input-bordered w-full focus:input-primary" value={lampiran} onChange={e => setLampiran(e.target.value)} required />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-semibold">Perihal</span></label>
                  <input type="text" className="input input-bordered w-full focus:input-primary" value={perihal} onChange={e => setPerihal(e.target.value)} required />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-semibold">Kepada Yth.</span></label>
                  <input type="text" className="input input-bordered w-full focus:input-primary" value={kepada} onChange={e => setKepada(e.target.value)} required />
                </div>
              </div>
            </div>
          </div>

          {/* Periode */}
          <div>
            <p className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-3 px-1">Periode Insentif</p>
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-5">
                <div className="flex gap-2">
                  <select className="select select-bordered flex-1 focus:select-primary" value={startMonth} onChange={e => setStartMonth(Number(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <span className="self-center">s/d</span>
                  <select className="select select-bordered flex-1 focus:select-primary" value={endMonth} onChange={e => setEndMonth(Number(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </div>
                <div className="mt-3">
                  <select className="select select-bordered w-full focus:select-primary" value={periodeYear} onChange={e => setPeriodeYear(Number(e.target.value))}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Daftar Guru */}
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-widest">Daftar Guru</p>
              <span className="badge badge-primary badge-sm badge-outline">{teachers.length} Guru</span>
            </div>
            
            <div className="flex flex-col gap-4">
              {teachers.map((t, index) => (
                <div key={index} className="card bg-base-100 shadow-sm border border-base-200 relative overflow-visible">
                  {teachers.length > 1 && (
                    <button type="button" onClick={() => removeTeacherRow(index)} className="btn btn-circle btn-error btn-sm absolute -top-3 -right-3 shadow-md text-white border-none z-10">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="card-body p-4">
                    <div className="tabs tabs-boxed mb-4 p-1 bg-base-200/50">
                      <a className={`tab flex-1 text-xs font-semibold ${t.type === 'registered' ? 'tab-active bg-white shadow-sm' : ''}`} onClick={() => handleTeacherTypeChange(index, 'registered')}>Pilih Terdaftar</a>
                      <a className={`tab flex-1 text-xs font-semibold ${t.type === 'manual' ? 'tab-active bg-white shadow-sm' : ''}`} onClick={() => handleTeacherTypeChange(index, 'manual')}>Input Manual</a>
                    </div>

                    {t.type === 'registered' ? (
                      <div className="form-control">
                        <select 
                          className="select select-bordered w-full focus:select-primary"
                          value={t.user_id}
                          onChange={(e) => handleRegisteredTeacherChange(index, e.target.value)}
                        >
                          <option value="">-- Pilih Guru --</option>
                          {registeredTeachers.map(rt => (
                            <option key={rt.id} value={rt.id}>{rt.name || 'Tanpa Nama'}</option>
                          ))}
                        </select>
                        {t.user_id && (
                          <div className="mt-3 p-3 bg-base-200/50 rounded-xl text-xs flex flex-col gap-1.5 border border-base-200">
                            <div className="flex justify-between"><span className="text-base-content/60">NO SK</span><span className="font-semibold">{t.no_sk || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-base-content/60">NO KTP</span><span className="font-semibold">{t.no_ktp || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-base-content/60">NO REK</span><span className="font-semibold">{t.no_rek || '-'}</span></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <input type="text" placeholder="Nama Guru" className="input input-sm input-bordered w-full" value={t.name} onChange={e => handleManualTeacherChange(index, 'name', e.target.value)} required />
                        <input type="text" placeholder="NO SK" className="input input-sm input-bordered w-full" value={t.no_sk} onChange={e => handleManualTeacherChange(index, 'no_sk', e.target.value)} />
                        <input type="text" placeholder="NO KTP" className="input input-sm input-bordered w-full" value={t.no_ktp} onChange={e => handleManualTeacherChange(index, 'no_ktp', e.target.value)} />
                        <input type="text" placeholder="NO REK" className="input input-sm input-bordered w-full" value={t.no_rek} onChange={e => handleManualTeacherChange(index, 'no_rek', e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <button type="button" onClick={addTeacherRow} className="btn btn-outline btn-primary w-full border-dashed border-2">
                <Plus size={18} /> Tambah Guru Lainnya
              </button>
            </div>
          </div>

          {/* Pengesahan */}
          <div className="mb-6">
            <p className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-3 px-1">Pengesahan</p>
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-5 flex flex-col gap-4">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-semibold">Tanggal Surat</span></label>
                  <input type="date" className="input input-bordered w-full focus:input-primary" value={tanggalPengesahan} onChange={e => setTanggalPengesahan(e.target.value)} required />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-semibold">Nama Penandatangan (Kepala TPQ)</span></label>
                  <input type="text" className="input input-bordered w-full focus:input-primary" value={penandaTangan} onChange={e => setPenandaTangan(e.target.value)} required />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full text-white shadow-lg shadow-primary/30 h-12 mb-10" disabled={isSubmitting}>
            {isSubmitting ? <span className="loading loading-spinner"></span> : <><Save size={20} /> Simpan Surat Insentif</>}
          </button>

        </form>
      </div>
    </div>
  );
}
