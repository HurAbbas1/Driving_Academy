import React, { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useLanguageStore, LanguageCode } from '../stores/languageStore';
import { useAuthStore } from '../stores/authStore';
import { updateUserProfile } from '../services/supabase/auth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface LanguageSelectScreenProps {
  onComplete: () => void;
}

export const LanguageSelectScreen: React.FC<LanguageSelectScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  
  const currentLang = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  
  const user = useAuthStore((state) => state.user);
  
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(currentLang);
  const [loading, setLoading] = useState(false);

  const languages = [
    { code: 'en' as const, label: 'English', flag: '🇬🇧' },
    { code: 'ja' as const, label: '日本語', flag: '🇯🇵' },
    { code: 'zh' as const, label: '中文', flag: '🇨🇳' },
    { code: 'pt' as const, label: 'Português', flag: '🇧🇷' },
  ];

  const handleSelect = (code: LanguageCode) => {
    setSelectedLang(code);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save language choice in local store
      await setLanguage(selectedLang);
      
      // If user is authenticated, save choice to their cloud Firestore profile
      if (user) {
        await updateUserProfile(user.uid, { language: selectedLang });
      }
      
      onComplete();
    } catch (e) {
      console.error('Failed to save language', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('language.selectLanguage')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('language.selectSub')}
          </Text>
        </View>

        <View style={styles.list}>
          {languages.map((item) => {
            const isSelected = selectedLang === item.code;
            return (
              <Card
                key={item.code}
                onPress={() => handleSelect(item.code)}
                variant={isSelected ? 'outlined' : 'default'}
                style={[
                  styles.langCard,
                  isSelected && { borderColor: colors.primary, borderWidth: 2 },
                ]}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text
                  style={[
                    styles.langLabel,
                    { color: colors.text },
                    isSelected && { fontWeight: '700', color: colors.primary },
                  ]}
                >
                  {item.label}
                </Text>
              </Card>
            );
          })}
        </View>

        <Button
          title={t('common.continue')}
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
    width: '100%',
  },
  header: {
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  list: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    marginVertical: 32,
    width: '100%',
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: '100%',
  },
  flag: {
    fontSize: 32,
    marginRight: 20,
  },
  langLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveBtn: {
    width: '100%',
  },
});
