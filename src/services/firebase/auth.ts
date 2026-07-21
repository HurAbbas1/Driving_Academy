import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { useAuthStore, UserProfile } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useThemeStore } from '../../stores/themeStore';
import { useStudyStore } from '../../stores/studyStore';
import { useQuizStore } from '../../stores/quizStore';

export const loginAsMockUser = () => {
  const { setUser, setProfile, setLoading, setInitialized } = useAuthStore.getState();
  const { setLanguage } = useLanguageStore.getState();
  const { setTheme } = useThemeStore.getState();
  const currentLang = useLanguageStore.getState().language;
  const currentTheme = useThemeStore.getState().theme;

  const mockUser = {
    uid: 'mock-user-123',
    email: 'developer@example.com',
    emailVerified: true,
  } as any;

  const mockProfile: UserProfile = {
    email: 'developer@example.com',
    displayName: 'Developer User',
    language: currentLang,
    theme: currentTheme,
    createdAt: new Date(),
    lastActive: new Date(),
    streak: {
      current: 3,
      longest: 10,
      lastDate: new Date().toISOString().split('T')[0]
    }
  };

  setUser(mockUser);
  setProfile(mockProfile);
  setLoading(false);
  
  // Sync local languages/themes
  setLanguage(currentLang).catch(() => {});
  setTheme(currentTheme);

  // Load local states
  useStudyStore.getState().loadStudyState().catch(() => {});
  useQuizStore.getState().loadQuizState().catch(() => {});
  setInitialized(true);
};

// Initialize and listen to Auth state changes
export const initAuthListener = () => {
  // Automatically trigger mock login for local preview
  loginAsMockUser();
  return () => {};
};

// Create user profile in Firestore
export const createUserProfile = async (
  uid: string, 
  email: string, 
  displayName: string,
  language: 'en' | 'ja' | 'zh' | 'pt' = 'en'
) => {
  const userDocRef = doc(db, 'users', uid);
  const theme = useThemeStore.getState().theme;

  const profile: UserProfile = {
    email,
    displayName,
    language,
    theme,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    streak: {
      current: 0,
      longest: 0,
      lastDate: null
    }
  };

  await setDoc(userDocRef, profile);
  useAuthStore.getState().setProfile(profile);
  return profile;
};

// Update user profile fields
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, updates);
  
  const currentProfile = useAuthStore.getState().profile;
  if (currentProfile) {
    useAuthStore.getState().setProfile({
      ...currentProfile,
      ...updates
    });
  }
};
