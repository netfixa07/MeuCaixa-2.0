import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  profileError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, extraData: Partial<UserProfile>) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VIP_EMAILS = [
  'gamerbilly898@hmail.com', 
  'gamerbilly898@gmail.com', 
  'douglastaylorinvestimentos@gmail.com', 
  'netfixa07@gmail.com',
  'atizzoneto@gmail.com'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (currentUser: User) => {
    setProfileError(null);
    try {
      const profileRef = doc(db, 'users', currentUser.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data() as UserProfile;
        let currentPlan = data.plan;
        let hasSelectedPlan = data.hasSelectedPlan ?? false;

        // Auto-upgrade VIP email
        const isVip = currentUser.email && VIP_EMAILS.includes(currentUser.email.toLowerCase());
        if (isVip && currentPlan !== 'elite') {
          currentPlan = 'elite';
          hasSelectedPlan = true;
          await setDoc(profileRef, { plan: 'elite', hasSelectedPlan: true }, { merge: true });
        }

        // Update last login
        await updateDoc(profileRef, { lastLogin: new Date().toISOString() });

        setProfile({
          ...data,
          plan: currentPlan,
          hasSelectedPlan: hasSelectedPlan
        });
      } else {
        // Create new profile if it doesn't exist (e.g., first Google login)
        const isVip = currentUser.email && VIP_EMAILS.includes(currentUser.email.toLowerCase());
        const now = new Date().toISOString();
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "",
          plan: isVip ? 'elite' : 'gratuito',
          hasSelectedPlan: isVip,
          aprendizado: [],
          createdAt: now,
          lastLogin: now
        };
        await setDoc(profileRef, newProfile);
        setProfile(newProfile);
      }
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setProfileError(errorMsg);
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
      console.error("Error fetching profile:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setIsAuthReady(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, extraData: Partial<UserProfile>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const isVip = newUser.email && VIP_EMAILS.includes(newUser.email.toLowerCase());
      const now = new Date().toISOString();
      
      const newProfile: UserProfile = {
        uid: newUser.uid,
        email: newUser.email || "",
        displayName: newUser.displayName || "",
        plan: isVip ? 'elite' : 'gratuito',
        hasSelectedPlan: isVip,
        aprendizado: [],
        createdAt: now,
        lastLogin: now,
        ...extraData
      };

      await setDoc(doc(db, 'users', newUser.uid), newProfile);
      setProfile(newProfile);
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Google login error:", error);
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, data);
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAuthReady, 
      profileError,
      login, 
      register, 
      loginWithGoogle, 
      logout,
      updateProfile: updateProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
