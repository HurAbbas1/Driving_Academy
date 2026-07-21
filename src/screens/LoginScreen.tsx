import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView, Pressable, Platform, ImageBackground, KeyboardAvoidingView } from 'react-native';
import { Alert } from '../utils/alert';
import { authenticateOrRegisterUser } from '../services/supabase/auth';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useLanguageStore, LanguageCode } from '../stores/languageStore';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';

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
  const colors = Colors[theme];
  const currentLang = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

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
    <ImageBackground 
      source={require('../../assets/images/hero_fuji_night.jpg')} 
      style={styles.backgroundImage}
      blurRadius={Platform.OS === 'ios' ? 2 : 1}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            style={styles.keyboardAvoid} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              
              {/* Top Control Bar */}
              <View style={styles.topControlBar}>
                <View style={{ position: 'relative', zIndex: 100 }}>
                  <Pressable 
                    style={[styles.langSelector, { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.2)' }]}
                    onPress={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  >
                    <Ionicons name="globe-outline" size={16} color="#FFF" />
                    <Text style={[styles.langText, { color: '#FFF' }]}>{currentLang.toUpperCase()}</Text>
                    <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
                  </Pressable>
                  
                  {isLangMenuOpen && (
                    <View style={[styles.langDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {['en', 'ja', 'zh', 'pt'].map((lang) => (
                        <Pressable
                          key={lang}
                          style={[styles.langDropdownItem, currentLang === lang && { backgroundColor: `${colors.primary}15` }]}
                          onPress={() => {
                            setLanguage(lang as LanguageCode);
                            setIsLangMenuOpen(false);
                          }}
                        >
                          <Text style={[styles.langDropdownText, { color: currentLang === lang ? colors.primary : colors.text }]}>
                            {lang.toUpperCase()}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Logo & Welcome Area */}
              <View style={styles.headerArea}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
                  <Text style={styles.logoLetter}>N<Text style={{color: '#fff'}}>S</Text></Text>
                </View>
                <Text style={styles.welcomeTitle}>{t("auth.welcomeBack")}</Text>
                <Text style={styles.welcomeSubtitle}>{t("auth.academyName")}</Text>
              </View>

              {/* Glassmorphic Login Form */}
              <View style={[styles.formCard, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)' }]}>
                
                <TextInput
                  label={t("auth.yourName")}
                  placeholder={t("auth.enterName")}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  error={errors.name}
                  style={styles.input}
                />

                <TextInput
                  label={t("auth.password")}
                  placeholder={t("auth.enterPassword")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  error={errors.password}
                  style={styles.input}
                />
                <Text style={[styles.passwordHint, { color: 'rgba(255,255,255,0.6)' }]}>
                  {t("auth.passwordHint")}
                </Text>

                <Pressable onPress={onNavigateToForgotPassword} style={styles.forgotPassword}>
                  <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>{t("auth.forgotPassword")}</Text>
                </Pressable>

                <Button
                  title={loading ? t('auth.login') + '...' : t('auth.signInRegister')}
                  onPress={handleLogin}
                  disabled={loading}
                  style={styles.loginBtn}
                />

                <View style={styles.dividerContainer}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{t("auth.or")}</Text>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                </View>

                <Button
                  title={t("auth.googleSignInComingSoon")}
                  onPress={handleGoogleSignIn}
                  variant="secondary"
                  style={styles.socialBtn}
                />

                <Button
                  title={t("auth.appleSignInComingSoon")}
                  onPress={handleAppleSignIn}
                  variant="secondary"
                  style={styles.socialBtn}
                />

                <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                  Type any name and password. If the name is new, we will automatically register a new profile for you!
                </Text>

              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // Dim the background to make the form pop
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
    marginTop: Platform.OS === 'ios' ? 0 : 20,
    zIndex: 1000,
    elevation: 1000,
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
  },
  langDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    width: 80,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 999,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 20 },
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } as any,
    }),
  },
  langDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  langDropdownText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#E31837', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12 },
      android: { elevation: 10 },
      web: { boxShadow: '0px 4px 12px rgba(227, 24, 55, 0.5)' } as any
    }),
  },
  logoLetter: {
    color: '#000',
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    ...Platform.select({
      ios: { textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
      android: { textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
      web: { textShadow: '0px 2px 10px rgba(0,0,0,0.75)' } as any
    }),
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  formCard: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 15 },
    }),
  },
  input: {
    marginBottom: 16,
  },
  passwordHint: {
    fontSize: 11,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loginBtn: {
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  socialBtn: {
    marginBottom: 12,
  },
  hintText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
