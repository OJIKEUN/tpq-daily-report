'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserData {
  uid: string;
  role: 'guru' | 'admin';
  name: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth is undefined. Initialization failed.");
      setLoading(false);
      return;
    }

    // Failsafe timeout in case onAuthStateChanged hangs
    const failsafeTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth initialization timed out. Forcing load to finish.");
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(failsafeTimeout);
      setUser(firebaseUser);
      
      if (firebaseUser && db) {
        // Fetch user role and name from Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserData);
          } else {
            // Fallback if document doesn't exist yet
            // If it's the superadmin email, grant admin access temporarily
            if (firebaseUser.email === 'superadmin@tpq.com') {
               setUserData({ uid: firebaseUser.uid, role: 'admin', name: 'Super Admin' });
            } else {
               setUserData({ uid: firebaseUser.uid, role: 'guru', name: firebaseUser.displayName || 'Guru' });
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => {
      clearTimeout(failsafeTimeout);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
