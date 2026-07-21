import React, { useState } from 'react';
import { View, StyleSheet, Text, Dimensions, SafeAreaView, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: t('onboarding.slide1Title'),
      subtitle: t('onboarding.slide1Sub'),
      icon: 'book-outline',
    },
    {
      title: t('onboarding.slide2Title'),
      subtitle: t('onboarding.slide2Sub'),
      icon: 'help-circle-outline',
    },
    {
      title: t('onboarding.slide3Title'),
      subtitle: t('onboarding.slide3Sub'),
      icon: 'trending-up-outline',
    },
  ];

  const handleNext = async () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      try {
        await AsyncStorage.setItem('onboarding-completed', 'true');
      } catch (e) {
        console.error(e);
      }
      onComplete();
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('onboarding-completed', 'true');
    } catch (e) {
      console.error(e);
    }
    onComplete();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {activeSlide < slides.length - 1 ? (
          <Pressable onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t('common.skip')}</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <View style={styles.slideContainer}>
        {/* Animated icon wrapper with circular branding design */}
        <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
          <Ionicons name={slides[activeSlide].icon as any} size={80} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{slides[activeSlide].title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{slides[activeSlide].subtitle}</Text>
      </View>

      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === activeSlide ? colors.primary : colors.backgroundSelected,
                  width: index === activeSlide ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button
          title={activeSlide === slides.length - 1 ? t('common.getStarted') : t('common.next')}
          onPress={handleNext}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
    width: '100%',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  btn: {
    width: '100%',
  },
});
