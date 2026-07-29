import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView, Pressable, Platform } from 'react-native';
import { Text } from '../components/ui/Text';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const welcomeVideoAsset = require('../../assets/welcome.mp4');

const OnboardingVideoPlayer: React.FC = () => {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.videoContainer}>
        <video
          src={welcomeVideoAsset}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', borderRadius: 24, objectFit: 'cover' }}
        />
      </View>
    );
  }

  const player = useVideoPlayer(welcomeVideoAsset, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={styles.videoContainer}>
      <VideoView
        player={player}
        style={styles.videoNative}
        contentFit="cover"
        allowsFullscreen={false}
        showsTimecodes={false}
      />
    </View>
  );
};

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
        {/* Branding Logo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: colors.primary, fontSize: 36, fontWeight: '900', fontStyle: 'italic', letterSpacing: -2 }}>
            N<Text style={{ color: colors.text }}>S</Text>
          </Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, letterSpacing: 1.5 }}>NEW SUNSHINE</Text>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 11, letterSpacing: 2 }}>DRIVING ACADEMY</Text>
          </View>
        </View>

        {/* Hero Animation Video */}
        <OnboardingVideoPlayer />

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
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  videoContainer: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 28,
    backgroundColor: '#000000',
    ...Platform.select({
      web: { boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
    }),
  },
  videoNative: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
    width: '100%',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 24,
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
