'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, updateLastLogin } from '@/services/userService';
import { User } from '@/types';


interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string, displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    // Create user profile in Firestore with isActive: false
    if (userCredential.user) {
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email || '',
        displayName: displayName || userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL ?? null,
        role: 'member',
        isActive: false
      });
    }
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last login time
    if (userCredential.user) {
      await updateLastLogin(userCredential.user.uid);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    // Create or update user profile in Firestore
    if (userCredential.user) {
      // Only create profile if it doesn't exist, don't overwrite existing data
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL ?? null,
        isActive: false
        // Don't set role here - let it default to 'member' only for new users
      });
      await updateLastLogin(userCredential.user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await createUserProfile(user.uid, {
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL ?? null,
            isActive: false
          });
        } catch (error) {
          console.log('User profile already exists or error creating profile:', error);
        }
        try {
          const { getUserProfile } = await import('@/services/userService');
          const userProfile = await getUserProfile(user.uid);
          setCurrentUser(userProfile || null);
        } catch (error) {
          setCurrentUser(null);
          console.error('Error fetching user profile:', error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// In your admin panel, call a cloud function or backend API:
// await createUserAsAdmin({ email, password, displayName, role: 'member' });
// Do NOT sign in as the new user!
