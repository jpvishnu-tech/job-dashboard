import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null);   // Firebase user
  const [dbUser, setDbUser]         = useState(null);   // MongoDB user (has role, name, etc.)
  const [isAdmin, setIsAdmin]       = useState(false);
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [loading, setLoading]       = useState(true);

  /**
   * fetchDbUser(firebaseUser)
   * Calls GET /api/auth/me with a fresh Firebase ID token.
   * Sets dbUser, isAdmin, isRecruiter from the MongoDB role.
   * Falls back to a Firestore admins-collection check for legacy admin accounts.
   */
  const fetchDbUser = useCallback(async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      const res   = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const role = data.user?.role;
        setDbUser(data.user ?? null);
        setIsAdmin(role === 'admin');
        setIsRecruiter(role === 'recruiter');
        return;
      }
    } catch {
      // Network error or backend unavailable — fall through to Firestore check
    }

    // Fallback: legacy Firestore admin check (for accounts not yet in MongoDB)
    try {
      const snap = await getDoc(doc(db, 'admins', firebaseUser.uid));
      setIsAdmin(snap.exists());
    } catch {
      setIsAdmin(false);
    }
    setIsRecruiter(false);
    setDbUser(null);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchDbUser(firebaseUser);
      } else {
        setDbUser(null);
        setIsAdmin(false);
        setIsRecruiter(false);
      }
      setLoading(false);
    });
    return unsub;
  }, [fetchDbUser]);

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName: displayName || '',
      email,
      createdAt: serverTimestamp(),
    }, { merge: true });
    return cred;
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName: cred.user.displayName || '',
      email:       cred.user.email || '',
      photoURL:    cred.user.photoURL || '',
      createdAt:   serverTimestamp(),
    }, { merge: true });
    return cred;
  }

  async function logout() {
    return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{
      user, dbUser, isAdmin, isRecruiter,
      loading, login, register, loginWithGoogle, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
