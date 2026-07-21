import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView, Pressable, Platform } from 'react-native';
import { Alert } from '../utils/alert';
import { authenticateOrRegisterUser, loginAsMockUser } from '../services/supabase/auth';
const auth = {};
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useLanguageStore, LanguageCode } from '../stores/languageStore';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

interface LoginScreenProps {
  onNavigateToSignup: () => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToSignup,
  onNavigateToForgotPassword,
}) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const colors = Colors[theme];
  const currentLang = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!name.trim()) {
      tempErrors.name = t('auth.required');
    }
    if (!password) {
      tempErrors.password = t('auth.required');
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authenticateOrRegisterUser(name, password, currentLang);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || 'Authentication failed';
      Alert.alert(t('auth.login'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert('Info', 'Google authentication is coming soon.');
  };

  const handleAppleSignIn = () => {
    Alert.alert('Info', 'Apple authentication is coming soon.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Control Bar containing Language Selector and Theme Toggle */}
        <View style={styles.topControlBar}>
          <View style={styles.languageContainer}>
            {(['en', 'ja', 'zh', 'pt'] as LanguageCode[]).map((lang) => {
              const isActive = currentLang === lang;
              const labels = {
                en: '🇬🇧 EN',
                ja: '🇯🇵 日本語',
                zh: '🇨🇳 中文',
                pt: '🇧🇷 PT',
              };
              return (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={[
                    styles.langChip,
                    { borderColor: colors.border },
                    isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                >
                  <Text
                    style={[
                      styles.langText,
                      { color: colors.text },
                      isActive && { color: '#FFFFFF', fontWeight: 'bold' }
                    ]}
                  >
                    {labels[lang]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Theme Toggle Chip */}
          <Pressable
            onPress={toggleTheme}
            style={[
              styles.themeToggleBtn,
              { borderColor: colors.border, backgroundColor: colors.backgroundElement }
            ]}
          >
            <Ionicons
              name={theme === 'light' ? 'moon-sharp' : 'sunny-sharp'}
              size={18}
              color={theme === 'light' ? colors.primary : '#FFB300'}
            />
          </Pressable>
        </View>

        <View style={styles.header}>
          {/* Circular logo shape matching branding accent red */}
          <View style={[styles.logoIcon, { backgroundColor: colors.primary, ...Platform.select({ web: { boxShadow: `0 4px 8px ${colors.primary}66` } as any, default: { shadowColor: colors.primary } }) }]}>
            <Text style={styles.logoText}>NCS</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('auth.welcomeBack')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('common.appName')}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Your Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            error={errors.name}
          />

          <TextInput
            label="Password"
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            secureTextEntry
            autoCapitalize="none"
            error={errors.password}
          />

          <Pressable onPress={onNavigateToForgotPassword} style={styles.forgotContainer}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              {t('auth.forgotPassword')}
            </Text>
          </Pressable>

          <Button
            title="Start Learning (Sign In / Register)"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          <Button
            title="Bypass Login (Developer Mode)"
            onPress={loginAsMockUser}
            variant="secondary"
            style={{ marginTop: 12, width: '100%' }}
          />
        </View>

        <View style={styles.dividerContainer}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.socialContainer}>
          <Button
            title="Sign in with Google (coming soon)"
            onPress={handleGoogleSignIn}
            variant="secondary"
            disabled={true}
            style={[styles.socialBtn, { opacity: 0.6 }]}
          />

          <Button
            title="Sign in with Apple (coming soon)"
            onPress={handleAppleSignIn}
            variant="secondary"
            disabled={true}
            style={[styles.socialBtn, { opacity: 0.6 }]}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary, textAlign: 'center', fontSize: 13, paddingHorizontal: 12 }]}>
            Type any name and password. If the name is new, we will automatically register a new profile for you!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 4px 8px rgba(0,0,0,0.4)' } as any,
      default: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    width: '100%',
    marginBottom: 24,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginVertical: 12,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: 16,
    width: '100%',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  socialContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  socialBtn: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: 15,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '700',
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    gap: 8,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  langText: {
    fontSize: 12,
  },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      } as any,
    }),
  },
});
