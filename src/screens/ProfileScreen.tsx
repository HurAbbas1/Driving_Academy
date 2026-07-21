import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, Switch, Pressable } from 'react-native';
import { Alert } from '../utils/alert';
import { signOut } from '../services/supabase/auth';
import { supabase } from '../services/supabase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
const auth = {};
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { useQuizStore } from '../stores/quizStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

interface ProfileScreenProps {
  onNavigateToLanguageSelect: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigateToLanguageSelect }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const currentLang = useLanguageStore((state) => state.language);
  const colors = Colors[theme];

  const handleLogout = async () => {
    try {
      if (user && user.uid === 'mock-user-123') {
        useAuthStore.getState().logout();
      } else {
        await signOut(auth);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('profile.logoutErrorTitle'), t('profile.logoutErrorMessage'));
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      t('profile.clearHistoryConfirmTitle'),
      t('profile.clearHistoryConfirmMessage'),
      [
        { text: t('profile.clearHistoryConfirmCancel'), style: 'cancel' },
        { 
          text: t('profile.clearHistoryConfirmOk'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              useQuizStore.setState({ history: [], wrongQuestions: [], bookmarkedQuestions: [] });
              await AsyncStorage.removeItem('quiz-history');
              await AsyncStorage.removeItem('quiz-storage'); // Depending on your persist name, usually cleared by setting state but safe to reset
              const userId = user?.uid;
              if (userId && userId !== 'mock-user-123') {
                const { data: record } = await supabase
                  .from('user_data')
                  .select('data, wrongQuestions, bookmarkedQuestions')
                  .eq('user_id', userId)
                  .single();
                  
                const existingData = record?.data || {};
                await supabase
                  .from('user_data')
                  .upsert({
                    user_id: userId,
                    data: {
                      ...existingData,
                      history: []
                    },
                    wrongQuestions: [],
                    bookmarkedQuestions: []
                  });
              }
              Alert.alert(t('profile.clearHistorySuccessTitle'), t('profile.clearHistorySuccessMessage'));
            } catch (e) {
              console.error(e);
              Alert.alert(t('profile.clearHistoryErrorTitle'), t('profile.clearHistoryErrorMessage'));
            }
          } 
        }
      ]
    );
  };

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'en': return 'English (🇬🇧)';
      case 'ja': return '日本語 (🇯🇵)';
      case 'zh': return '中文 (🇨🇳)';
      case 'pt': return 'Português (🇧🇷)';
      default: return code;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t('tabs.profile')}</Text>

        {/* User Profile Card */}
        <Card style={styles.userCard}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {profile?.displayName || t('profile.student')}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {profile?.email || user?.email || 'student@sunshine.com'}
          </Text>
        </Card>

        {/* Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.settings')}</Text>

        {/* Theme Select */}
        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={22} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile.darkMode')}</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={theme === 'dark' ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
        </Card>

        {/* Language Selection */}
        <Card onPress={onNavigateToLanguageSelect} style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={22} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile.appLanguage')}</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {getLanguageLabel(currentLang)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </View>
        </Card>

        {/* Clear Quiz History */}
        <Card onPress={handleClearHistory} style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
              <Text style={[styles.settingLabel, { color: colors.error }]}>{t('profile.clearQuizHistory')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
        </Card>

        {/* Logout */}
        <Button
          title={t('common.logout')}
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  userCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  settingCard: {
    padding: 16,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
  },
  logoutBtn: {
    marginTop: 28,
    width: '100%',
  },
});
