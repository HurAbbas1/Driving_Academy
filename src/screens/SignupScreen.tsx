import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView, Pressable, Platform } from 'react-native';
import { Alert } from '../utils/alert';
import { createUserWithEmailAndPassword, createUserProfile, loginAsMockUser } from '../services/supabase/auth';
const auth = {};
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useLanguageStore, LanguageCode } from '../stores/languageStore';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';

interface SignupScreenProps {
  onNavigateToLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onNavigateToLogin }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const currentLang = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getPasswordStrength = () => {
    if (!password) return { label: '', color: 'transparent', score: 0 };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) {
      return { label: t('auth.weak'), color: colors.error, score };
    } else if (score <= 4) {
      return { label: t('auth.medium'), color: colors.warning, score };
    } else {
      return { label: t('auth.strong'), color: colors.success, score };
    }
  };

  const strength = getPasswordStrength();

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!fullName) {
      tempErrors.fullName = t('auth.required');
    }
    if (!email) {
      tempErrors.email = t('auth.required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = t('auth.invalidEmail');
    }
    if (!password) {
      tempErrors.password = t('auth.required');
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      tempErrors.confirmPassword = t('auth.required');
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = t('auth.passwordMismatch');
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await createUserProfile(user.uid, email.trim(), fullName.trim(), currentLang);
    } catch (error: any) {
      console.error(error);
      Alert.alert(t('auth.signup'), error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Language Selector Bar */}
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

        <View style={styles.header}>
          {/* Circular logo shape matching branding accent red */}
          <View style={[styles.logoIcon, { backgroundColor: colors.primary, ...Platform.select({ web: { boxShadow: `0 4px 8px ${colors.primary}66` } as any, default: { shadowColor: colors.primary } }) }]}>
            <Text style={styles.logoText}>NCS</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('auth.createWelcome')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('common.appName')}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label={t('auth.fullName')}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) setErrors({ ...errors, fullName: '' });
            }}
            error={errors.fullName}
          />

          <TextInput
            label={t('auth.email')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <TextInput
            label={t('auth.password')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            secureTextEntry
            autoCapitalize="none"
            error={errors.password}
          />

          {password ? (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthHeader}>
                <Text style={[styles.strengthLabel, { color: colors.textSecondary }]}>
                  {t('auth.passwordStrength')}:
                </Text>
                <Text style={[styles.strengthValue, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
              <View style={[styles.strengthBarBg, { backgroundColor: colors.backgroundSelected }]}>
                <View
                  style={[
                    styles.strengthBarFill,
                    {
                      backgroundColor: strength.color,
                      width: `${(strength.score / 5) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ) : null}

          <TextInput
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
            }}
            secureTextEntry
            autoCapitalize="none"
            error={errors.confirmPassword}
          />

          <Button
            title={t('auth.signupButton')}
            onPress={handleSignup}
            loading={loading}
            style={styles.signupBtn}
          />

          <Button
            title="Bypass Signup (Developer Mode)"
            onPress={loginAsMockUser}
            variant="secondary"
            style={{ marginTop: 12, width: '100%' }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {t('auth.haveAccount')}{' '}
          </Text>
          <Pressable onPress={onNavigateToLogin}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>
              {t('auth.login')}
            </Text>
          </Pressable>
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
    marginTop: 10,
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
  strengthContainer: {
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  strengthBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  signupBtn: {
    marginTop: 24,
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
  loginLink: {
    fontSize: 15,
    fontWeight: '700',
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
    flexWrap: 'wrap',
    width: '100%',
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  langText: {
    fontSize: 13,
  },
});
