import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView, Pressable, Platform } from 'react-native';
import { Alert } from '../utils/alert';
import { sendPasswordResetEmail } from '../services/supabase/auth';
const auth = {};
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';

interface ForgotPasswordScreenProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigateToLogin }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email) {
      setError(t('auth.required'));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        t('auth.forgotPassword'),
        'A password reset link has been sent to your email.',
        [{ text: 'OK', onPress: onNavigateToLogin }]
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('auth.forgotPassword'), err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          {/* Circular logo shape matching branding accent red */}
          <View style={[styles.logoIcon, { backgroundColor: colors.primary, ...Platform.select({ web: { boxShadow: `0 4px 8px ${colors.primary}66` } as any, default: { shadowColor: colors.primary } }) }]}>
            <Text style={styles.logoText}>NCS</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('auth.forgotPassword')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email address to receive a password reset link.
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label={t('auth.email')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={error}
          />

          <Button
            title={t('auth.sendReset')}
            onPress={handleReset}
            loading={loading}
            style={styles.resetBtn}
          />
        </View>

        <Pressable onPress={onNavigateToLogin} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>
            Back to {t('auth.login')}
          </Text>
        </Pressable>
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
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  form: {
    width: '100%',
    marginBottom: 24,
  },
  resetBtn: {
    marginTop: 16,
    width: '100%',
  },
  backButton: {
    marginTop: 16,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
