'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { BookOpen, Mail, Lock, User, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, role: 'guru', name, email, created_at: new Date().toISOString(),
      });
      router.push('/home');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('Email sudah digunakan.');
      else if (err.code === 'auth/weak-password') setError('Password minimal 6 karakter.');
      else setError('Gagal mendaftar. Periksa kembali data Anda.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-40 border-b border-base-200">
        <div className="flex-none">
          <Link href="/" className="btn btn-square btn-ghost">
            <ChevronLeft size={24} />
          </Link>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Daftar</h1>
        </div>
      </div>

      <main className="flex-1 px-5 py-6 animate-fade-in flex flex-col items-center">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-focus rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-3 rotate-3">
              <BookOpen size={26} className="text-primary-content" />
            </div>
            <h2 className="text-xl font-bold text-base-content">Daftar Akun Guru</h2>
            <p className="text-sm text-base-content/70 mt-1">Buat akun untuk mulai mengisi laporan harian</p>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-200/50">
            <div className="card-body p-6">
              {error && (
                <div className="alert alert-error text-sm rounded-lg py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="mt-2">
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-semibold">Nama Lengkap</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      className="input input-bordered w-full pl-10 focus:input-primary"
                      placeholder="Contoh: Ust. Ahmad Fauzi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-semibold">Email</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      className="input input-bordered w-full pl-10 focus:input-primary"
                      placeholder="email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-control mb-6">
                  <label className="label">
                    <span className="label-text font-semibold">Password</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input input-bordered w-full pl-10 pr-12 focus:input-primary"
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content/70 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full shadow-lg shadow-primary/30"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : 'Daftar Sekarang'}
                </button>
              </form>

              <div className="divider text-xs text-base-content/50 mt-6 mb-2">Atau</div>
              
              <div className="text-center">
                <p className="text-sm text-base-content/70">
                  Sudah punya akun?{' '}
                  <Link href="/" className="link link-primary font-semibold no-underline hover:underline">
                    Login di sini
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
