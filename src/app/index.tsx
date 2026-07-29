import React, { useEffect, useState } from 'react';
import {View, StyleSheet, Pressable, Platform} from 'react-native';
import { Text } from '../components/ui/Text';

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
import { AnimatedSplashScreen } from '../components/ui/AnimatedSplashScreen';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const TabButton = ({ icon, label, isActive, onPress, color, isCenter }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={[styles.tabItem, animatedStyle, isCenter ? { marginTop: -20 } : {}]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.85, { damping: 15, stiffness: 300 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
      >
        {isCenter ? (
          <View style={[
            styles.quizTabCircle, 
            { 
              backgroundColor: color,
              ...Platform.select({
                web: { boxShadow: `0 4px 12px ${color}80` },
                default: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
              }),
            }
          ]}>
            <Ionicons name={icon} size={26} color="#FFFFFF" />
          </View>
        ) : (
          <Ionicons name={icon} size={24} color={color} />
        )}
        <Text style={[styles.tabLabel, { color: color, marginTop: isCenter ? 6 : 4, fontWeight: isActive ? '800' : '600' }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

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
  const [isSplashAnimationDone, setIsSplashAnimationDone] = useState(false);
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

  // Determine if app data is fully initialized
  const isAppReady = isInitialized && isOnboardingCompleted !== null && !authLoading;

  // 1. Onboarding Flow (FIRST — skip app splash for first-time users, onboarding has its own intro)
  if (isOnboardingCompleted === false) {
    return <OnboardingScreen onComplete={() => { setIsOnboardingCompleted(true); setIsSplashAnimationDone(true); }} />;
  }

  // 0. Splash Screen Phase (only for returning users)
  if (!isSplashAnimationDone) {
    return (
      <AnimatedSplashScreen 
        isReady={isAppReady} 
        onAnimationComplete={() => setIsSplashAnimationDone(true)} 
      />
    );
  }

  // Fallback Loading phase
  if (!isAppReady) {
    return <LoadingScreen />;
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

      {/* Premium Floating Glass Tab Bar */}
      {!(activeTab === 'quiz' && (quizViewMode === 'active' || quizViewMode === 'countdown')) && (
        <View style={styles.floatingTabBarContainer}>
          <View style={[
            styles.floatingTabBar, 
            { 
              backgroundColor: theme === 'dark' ? 'rgba(26,26,26,0.85)' : 'rgba(255,255,255,0.95)',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.08)',
              ...Platform.select({
                web: { 
                  backdropFilter: 'blur(20px)', 
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: theme === 'dark' 
                    ? '0 8px 32px rgba(0,0,0,0.2)' 
                    : '0 2px 8px rgba(26,26,46,0.06), 0 8px 32px rgba(26,26,46,0.12)',
                } as any,
              })
            }
          ]}>
            <TabButton 
              icon={activeTab === 'home' ? 'home' : 'home-outline'} 
              label={t('tabs.home')} 
              isActive={activeTab === 'home'} 
              onPress={() => setActiveTab('home')} 
              color={activeTab === 'home' ? colors.primary : colors.textSecondary} 
            />
            <TabButton 
              icon={activeTab === 'study' ? 'book' : 'book-outline'} 
              label={t('tabs.study')} 
              isActive={activeTab === 'study'} 
              onPress={() => setActiveTab('study')} 
              color={activeTab === 'study' ? colors.primary : colors.textSecondary} 
            />
            <TabButton 
              icon="school" 
              label={t('tabs.quiz')} 
              isActive={activeTab === 'quiz'} 
              onPress={() => setActiveTab('quiz')} 
              color={colors.primary} 
              isCenter 
            />
            <TabButton 
              icon={activeTab === 'progress' ? 'stats-chart' : 'stats-chart-outline'} 
              label={t('tabs.progress')} 
              isActive={activeTab === 'progress'} 
              onPress={() => setActiveTab('progress')} 
              color={activeTab === 'progress' ? colors.primary : colors.textSecondary} 
            />
            <TabButton 
              icon={activeTab === 'profile' ? 'person' : 'person-outline'} 
              label={t('tabs.profile')} 
              isActive={activeTab === 'profile'} 
              onPress={() => setActiveTab('profile')} 
              color={activeTab === 'profile' ? colors.primary : colors.textSecondary} 
            />
          </View>
        </View>
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
    paddingBottom: 90, // Pad for the floating tab bar
  },
  floatingTabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 10,
    right: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTabBar: {
    flexDirection: 'row',
    height: 72,
    borderRadius: 36,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    width: '100%',
    maxWidth: 650,
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.2)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 },
    }),
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
