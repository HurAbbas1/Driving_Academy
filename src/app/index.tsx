import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { useQuizStore } from '../stores/quizStore';

// Import Screens
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { LanguageSelectScreen } from '../screens/LanguageSelectScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { StudyScreen } from '../screens/StudyScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// UI Primitive & Icons
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';

type ActiveTab = 'home' | 'study' | 'quiz' | 'progress' | 'profile';
type AuthRoute = 'login' | 'signup' | 'forgotPassword';

export default function IndexScreen() {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  // Auth Store States
  const { user, profile, loading: authLoading, isInitialized } = useAuthStore();
  const { language } = useLanguageStore();
  const quizViewMode = useQuizStore((state) => state.viewMode);

  // Local navigation states
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [authRoute, setAuthRoute] = useState<AuthRoute>('login');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [forceLangSelect, setForceLangSelect] = useState(false);

  useEffect(() => {
    // Check onboarding status
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboarding-completed');
        setIsOnboardingCompleted(completed === 'true');
      } catch (e) {
        setIsOnboardingCompleted(false);
      }
    };
    checkOnboarding();
  }, []);

  // Determine if we need to force language select
  useEffect(() => {
    if (user && isInitialized) {
      if (profile && !profile.language) {
        setForceLangSelect(true);
      } else {
        setForceLangSelect(false);
      }
    }
  }, [user, profile, isInitialized]);

  // Loading phase
  if (!isInitialized || isOnboardingCompleted === null || authLoading) {
    return <LoadingScreen />;
  }

  // 1. Onboarding Flow
  if (!isOnboardingCompleted) {
    return <OnboardingScreen onComplete={() => setIsOnboardingCompleted(true)} />;
  }

  // 2. Auth Flow (if not signed in)
  if (!user) {
    switch (authRoute) {
      case 'signup':
        return <SignupScreen onNavigateToLogin={() => setAuthRoute('login')} />;
      case 'forgotPassword':
        return <ForgotPasswordScreen onNavigateToLogin={() => setAuthRoute('login')} />;
      case 'login':
      default:
        return (
          <LoginScreen
            onNavigateToSignup={() => setAuthRoute('signup')}
            onNavigateToForgotPassword={() => setAuthRoute('forgotPassword')}
          />
        );
    }
  }

  // 3. Language Selection Flow (if user profiles lacks language choice)
  if (forceLangSelect) {
    return <LanguageSelectScreen onComplete={() => setForceLangSelect(false)} />;
  }

  // 4. Main App Tab Router Flow
  const renderTabContent = () => {
    switch (activeTab) {
      case 'study':
        return <StudyScreen onNavigateToTab={setActiveTab} />;
      case 'quiz':
        return <QuizScreen />;
      case 'progress':
        return <ProgressScreen />;
      case 'profile':
        return <ProfileScreen onNavigateToLanguageSelect={() => setForceLangSelect(true)} />;
      case 'home':
      default:
        return <HomeScreen onNavigateToTab={setActiveTab} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Active Tab Screen */}
      <View style={styles.tabContent}>{renderTabContent()}</View>

      {/* Premium Theme Tab Bar */}
      {!(activeTab === 'quiz' && (quizViewMode === 'active' || quizViewMode === 'countdown')) && (
        <SafeAreaView style={[styles.tabBar, { backgroundColor: colors.backgroundElement, borderTopColor: colors.border }]} edges={['bottom']}>
          {/* Tab: Home */}
          <Pressable onPress={() => setActiveTab('home')} style={styles.tabItem}>
            <Ionicons
              name={activeTab === 'home' ? 'home' : 'home-outline'}
              size={22}
              color={activeTab === 'home' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: activeTab === 'home' ? colors.primary : colors.textSecondary }]}>
              {t('tabs.home')}
            </Text>
          </Pressable>

          {/* Tab: Study */}
          <Pressable onPress={() => setActiveTab('study')} style={styles.tabItem}>
            <Ionicons
              name={activeTab === 'study' ? 'book' : 'book-outline'}
              size={22}
              color={activeTab === 'study' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: activeTab === 'study' ? colors.primary : colors.textSecondary }]}>
              {t('tabs.study')}
            </Text>
          </Pressable>

          {/* Tab: Quiz (Center Elevated Button) */}
          <Pressable onPress={() => setActiveTab('quiz')} style={styles.tabItem}>
            <View style={[
              styles.quizTabCircle, 
              { 
                backgroundColor: colors.primary,
                ...Platform.select({
                  web: { boxShadow: `0 4px 10px ${colors.primary}66` },
                  default: { shadowColor: colors.primary },
                }),
              }
            ]}>
              <Ionicons
                name="school"
                size={24}
                color="#FFFFFF"
              />
            </View>
            <Text style={[styles.tabLabel, { color: activeTab === 'quiz' ? colors.primary : colors.textSecondary, marginTop: 4 }]}>
              {t('tabs.quiz')}
            </Text>
          </Pressable>

          {/* Tab: Progress */}
          <Pressable onPress={() => setActiveTab('progress')} style={styles.tabItem}>
            <Ionicons
              name={activeTab === 'progress' ? 'stats-chart' : 'stats-chart-outline'}
              size={22}
              color={activeTab === 'progress' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: activeTab === 'progress' ? colors.primary : colors.textSecondary }]}>
              {t('tabs.progress')}
            </Text>
          </Pressable>

          {/* Tab: Profile */}
          <Pressable onPress={() => setActiveTab('profile')} style={styles.tabItem}>
            <Ionicons
              name={activeTab === 'profile' ? 'person' : 'person-outline'}
              size={22}
              color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: activeTab === 'profile' ? colors.primary : colors.textSecondary }]}>
              {t('tabs.profile')}
            </Text>
          </Pressable>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 84 : 64,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  quizTabCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -22,
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(0,0,0,0.4)' } as any,
      default: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 6,
      },
    }),
  },
});
