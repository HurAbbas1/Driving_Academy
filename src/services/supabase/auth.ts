import { supabase } from './config';
import { useAuthStore, UserProfile } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useThemeStore } from '../../stores/themeStore';
import { useStudyStore } from '../../stores/studyStore';
import { useQuizStore } from '../../stores/quizStore';

// Drop-in Firebase auth signature replacement
export const signInWithEmailAndPassword = async (authStub: any, email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  
  // Return compatible user structure
  return {
    user: {
      uid: data.user?.id || '',
      email: data.user?.email || email
    }
  };
};

export const createUserWithEmailAndPassword = async (authStub: any, email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  return {
    user: {
      uid: data.user?.id || '',
      email: data.user?.email || email
    }
  };
};

export const createUserProfile = async (
  uid: string, 
  email: string, 
  displayName: string,
  language: 'en' | 'ja' | 'zh' | 'pt' = 'en'
) => {
  const theme = useThemeStore.getState().theme;

  const profile: UserProfile = {
    email,
    displayName,
    language,
    theme,
    createdAt: new Date(),
    lastActive: new Date(),
    streak: {
      current: 0,
      longest: 0,
      lastDate: null
    }
  };

  if (uid && uid !== 'mock-user-123') {
    await supabase
      .from('user_profiles')
      .upsert({ 
        user_id: uid,
        profile: profile
      });
  }

  useAuthStore.getState().setProfile(profile);
  return profile;
};

export const signOut = async (authStub?: any) => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  // Reset store states
  useAuthStore.getState().setUser(null);
  useAuthStore.getState().setProfile(null);
};

export const sendPasswordResetEmail = async (authStub: any, email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:8081/reset-password',
  });
  if (error) throw error;
};

export const authenticateOrRegisterUser = async (name: string, password: string, language: 'en' | 'ja' | 'zh' | 'pt') => {
  const sanitizedName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (!sanitizedName) {
    throw new Error('Please enter a valid name.');
  }
  const email = `${sanitizedName}@ncsapp.com`;

  try {
    // 1. Try to sign up first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!signUpError && signUpData.user) {
      // New user registration succeeded! Create profile
      const profile = await createUserProfile(signUpData.user.id, email, name.trim(), language);
      return { user: signUpData.user, profile };
    }

    // 2. If user already registered, signUpError is thrown.
    if (signUpError) {
      const errorMsg = signUpError.message || '';
      if (
        errorMsg.toLowerCase().includes('already registered') || 
        errorMsg.toLowerCase().includes('already exists') ||
        signUpError.status === 422 || 
        signUpError.status === 400
      ) {
        // User exists, try to log in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.toLowerCase().includes('invalid login credentials')) {
            throw new Error('Incorrect password for this user.');
          }
          throw signInError;
        }

        // Login succeeded! Fetch profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('profile')
          .eq('user_id', signInData.user.id)
          .single();

        if (profileData?.profile) {
          useAuthStore.getState().setProfile(profileData.profile);
        }

        return { user: signInData.user, profile: profileData?.profile || null };
      }

      throw signUpError;
    }
    
    throw new Error('Authentication process failed.');
  } catch (err: any) {
    throw err;
  }
};

export const loginAsMockUser = () => {
  const { setUser, setProfile, setLoading, setInitialized } = useAuthStore.getState();
  const { setLanguage } = useLanguageStore.getState();
  const { setTheme } = useThemeStore.getState();
  const currentLang = useLanguageStore.getState().language;
  const currentTheme = useThemeStore.getState().theme;

  const mockUser = {
    id: 'mock-user-123',
    email: 'developer@example.com',
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
  
  setLanguage(currentLang).catch(() => {});
  setTheme(currentTheme);

  useStudyStore.getState().loadStudyState().catch(() => {});
  useQuizStore.getState().loadQuizState().catch(() => {});
  setInitialized(true);
};

export const initAuthListener = () => {
  const { setUser, setProfile, setLoading, setInitialized } = useAuthStore.getState();

  // Listen to Supabase Auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    setLoading(true);
    if (session?.user) {
      setUser(session.user);
      
      // Fetch user profile from Supabase
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile')
        .eq('user_id', session.user.id)
        .single();
        
      if (data?.profile) {
        const themeStore = useThemeStore.getState();
        const profileData = data.profile;
        if (themeStore.hasUserToggledTheme) {
          // Local theme was changed on login page, update profile and save to DB
          profileData.theme = themeStore.theme;
          await supabase
            .from('user_profiles')
            .update({ profile: profileData })
            .eq('user_id', session.user.id);
          themeStore.resetUserToggledFlag();
        } else {
          // No manual toggle, load theme from profile
          themeStore.setTheme(profileData.theme);
        }
        setProfile(profileData);
      } else {
        // Fallback profile if none exists
        const currentTheme = useThemeStore.getState().theme;
        const fallbackProfile: UserProfile = {
          email: session.user.email || '',
          displayName: session.user.email?.split('@')[0] || 'User',
          language: 'en',
          theme: currentTheme,
          createdAt: new Date(),
          lastActive: new Date(),
          streak: { current: 0, longest: 0, lastDate: null }
        };
        setProfile(fallbackProfile);
        await supabase
          .from('user_profiles')
          .upsert({ user_id: session.user.id, profile: fallbackProfile });
        useThemeStore.getState().resetUserToggledFlag();
      }
      
      // Load user states from Supabase Postgres
      await useStudyStore.getState().loadStudyState().catch(() => {});
      await useQuizStore.getState().loadQuizState().catch(() => {});
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
    setInitialized(true);
  });

  return () => {
    subscription.unsubscribe();
  };
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  const currentProfile = useAuthStore.getState().profile;
  if (!currentProfile) return;

  const merged = { ...currentProfile, ...updates };
  
  if (uid && uid !== 'mock-user-123') {
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: uid,
        profile: merged
      });
  }

  useAuthStore.getState().setProfile(merged);
};
