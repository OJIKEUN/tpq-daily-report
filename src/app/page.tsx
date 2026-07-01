'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firebaseInitError } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push(userData?.role === 'admin' ? '/admin' : '/home');
    }
  }, [user, userData, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const loginEmail = email.includes('@') ? email : `${email}@tpq.com`;
      await signInWithEmailAndPassword(auth, loginEmail, password);
    } catch {
      setError('Email atau Password salah.');
      setIsSubmitting(false);
    }
  };

  if (firebaseInitError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-base-200 p-6 text-center">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <h3 className="font-bold">Error Sistem</h3>
            <div className="text-sm">Gagal menginisialisasi database: {String(firebaseInitError)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-base-200 px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-focus rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-4 rotate-3">
            <BookOpen size={30} className="text-primary-content" />
          </div>
          <h1 className="text-2xl font-bold text-base-content tracking-tight">TPQ Daruttaubah</h1>
          <p className="text-sm text-base-content/70 mt-1">Sistem Pelaporan Harian Guru</p>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-200/50">
          <div className="card-body p-6">
            {error && (
              <div className="alert alert-error text-sm rounded-lg py-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-2">
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Email / Username</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40 z-10">
                    <Mail size={18} />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10 focus:input-primary"
                    placeholder="Masukkan email"
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
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40 z-10">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input input-bordered w-full pl-10 pr-12 focus:input-primary"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                ) : 'Masuk'}
              </button>
            </form>

            <div className="divider text-xs text-base-content/50 mt-6 mb-2">Atau</div>
            
            <div className="text-center">
              <p className="text-sm text-base-content/70">
                Belum punya akun?{' '}
                <Link href="/register" className="link link-primary font-semibold no-underline hover:underline">
                  Daftar di sini
                </Link>
              </p>
              <p className="text-xs text-base-content/40 mt-3">Lupa password? Hubungi Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
