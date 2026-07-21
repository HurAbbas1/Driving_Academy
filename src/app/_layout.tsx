import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initAuthListener } from '../services/supabase/auth';
import { useThemeStore } from '../stores/themeStore';
import { useLanguageStore } from '../stores/languageStore';
import IndexScreen from './index';
import '../services/i18n'; // Initialize i18n

export default function RootLayout() {
  const theme = useThemeStore((state) => state.theme);
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const loadLanguage = useLanguageStore((state) => state.loadLanguage);

  useEffect(() => {
    // Load persisted configurations
    loadTheme();
    loadLanguage();
    
    // Listen to authentication changes
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <IndexScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
