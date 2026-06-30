'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clock, UserCircle, LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/home', label: 'Beranda', icon: Home },
  { href: '/history', label: 'Riwayat', icon: Clock },
  { href: '/profile', label: 'Profil', icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <>
      {/* Spacer to prevent content from hiding behind btm-nav */}
      <div className="h-16 shrink-0" />
      
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-base-100 border-t border-base-200 z-50 flex flex-row pb-[var(--safe-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${isActive ? 'text-primary' : 'text-base-content/50 hover:bg-base-200/50'}`}>
              <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} className="mb-1 transition-all" />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
        
        <button onClick={handleLogout} className="flex-1 flex flex-col items-center justify-center py-3 text-error/70 hover:text-error hover:bg-error/10 transition-colors">
          <LogOut size={22} strokeWidth={2} className="mb-1" />
          <span className="text-[10px] font-semibold">Keluar</span>
        </button>
      </div>
    </>
  );
}
