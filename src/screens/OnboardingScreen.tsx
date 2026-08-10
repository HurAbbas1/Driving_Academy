import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView, Pressable, Platform, Animated, Easing } from 'react-native';
import { Text } from '../components/ui/Text';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');
const useNative = Platform.OS !== 'web';

/* ─────────────────────────────────────────────
   RED NEON NISSAN GT-R R35 SILHOUETTE (Neon Sign)
   ───────────────────────────────────────────── */
const RedNeonGTRSilhouette: React.FC = () => (
  <View style={neonStyles.wrapper}>
    {/* Ambient Red Glow Halo */}
    <View style={neonStyles.ambientGlow} />

    {/* 1. Roofline Neon Tube */}
    <View style={neonStyles.roofTube} />
    <View style={neonStyles.roofCore} />

    {/* 2. GT-R Rear Wing Spoiler Neon Loop */}
    <View style={neonStyles.spoilerWing} />
    <View style={neonStyles.spoilerPillarLeft} />
    <View style={neonStyles.spoilerPillarRight} />

    {/* 3. Front Fender & Hood Tube */}
    <View style={neonStyles.hoodTube} />

    {/* 4. Side Skirt Baseline Tube */}
    <View style={neonStyles.sideSkirtTube} />

    {/* 5. Front & Rear Wheel Arches */}
    <View style={neonStyles.frontWheelArch} />
    <View style={neonStyles.rearWheelArch} />

    {/* 6. Window Frame Outline */}
    <View style={neonStyles.windowFrame} />

    {/* 7. Slanted Headlight Sweep Stroke */}
    <View style={neonStyles.headlightSweep} />

    {/* 8. Quad Afterburner Taillights */}
    <View style={neonStyles.gtrTailRing1}>
      <View style={neonStyles.gtrTailInner} />
    </View>
    <View style={neonStyles.gtrTailRing2}>
      <View style={neonStyles.gtrTailInner} />
    </View>

    {/* 9. GT-R Badge Label */}
    <View style={neonStyles.gtrBadgeTag}>
      <Text style={neonStyles.gtrBadgeText}>GT-R</Text>
    </View>
  </View>
);

const neonStyles = StyleSheet.create({
  wrapper: {
    width: 260,
    height: 100,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 240,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 23, 68, 0.22)',
    ...Platform.select({
      web: { filter: 'blur(20px)' } as any,
      default: { shadowColor: '#FF1744', shadowRadius: 30, shadowOpacity: 0.9 },
    }),
  },
  roofTube: {
    position: 'absolute',
    top: 15,
    left: 55,
    width: 125,
    height: 38,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 32,
    borderWidth: 3.5,
    borderColor: '#FF1744',
    borderBottomWidth: 0,
    borderRightWidth: 2,
    borderLeftWidth: 3.5,
    ...Platform.select({
      web: { boxShadow: '0 0 12px #FF1744, 0 0 25px #FF1744' } as any,
      default: { shadowColor: '#FF1744', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 12 },
    }),
  },
  roofCore: {
    position: 'absolute',
    top: 16,
    left: 56,
    width: 123,
    height: 36,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 31,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderBottomWidth: 0,
    opacity: 0.9,
  },
  spoilerWing: {
    position: 'absolute',
    top: 22,
    left: 10,
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF1744',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0 0 14px #FF1744' } as any,
    }),
  },
  spoilerPillarLeft: {
    position: 'absolute',
    top: 28,
    left: 20,
    width: 3,
    height: 20,
    backgroundColor: '#FF1744',
  },
  spoilerPillarRight: {
    position: 'absolute',
    top: 28,
    left: 44,
    width: 3,
    height: 20,
    backgroundColor: '#FF1744',
  },
  hoodTube: {
    position: 'absolute',
    bottom: 26,
    right: 10,
    width: 78,
    height: 20,
    borderTopRightRadius: 14,
    borderTopLeftRadius: 2,
    borderWidth: 3.5,
    borderColor: '#FF1744',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    ...Platform.select({
      web: { boxShadow: '0 0 12px #FF1744' } as any,
    }),
  },
  sideSkirtTube: {
    position: 'absolute',
    bottom: 10,
    left: 18,
    right: 16,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FF1744',
    borderWidth: 0.8,
    borderColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0 0 14px #FF1744' } as any,
    }),
  },
  frontWheelArch: {
    position: 'absolute',
    bottom: 10,
    right: 34,
    width: 40,
    height: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 3.5,
    borderColor: '#FF1744',
    borderBottomWidth: 0,
  },
  rearWheelArch: {
    position: 'absolute',
    bottom: 10,
    left: 34,
    width: 40,
    height: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 3.5,
    borderColor: '#FF1744',
    borderBottomWidth: 0,
  },
  windowFrame: {
    position: 'absolute',
    top: 21,
    left: 76,
    width: 76,
    height: 24,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 22,
    borderWidth: 2.5,
    borderColor: '#FF1744',
    borderBottomWidth: 0,
    opacity: 0.9,
  },
  headlightSweep: {
    position: 'absolute',
    bottom: 26,
    right: 12,
    width: 20,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-18deg' }],
    ...Platform.select({
      web: { boxShadow: '0 0 16px #FFFFFF' } as any,
    }),
  },
  gtrTailRing1: {
    position: 'absolute',
    bottom: 30,
    left: 18,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2.5,
    borderColor: '#FF1744',
    backgroundColor: 'rgba(255, 23, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gtrTailRing2: {
    position: 'absolute',
    bottom: 30,
    left: 34,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: '#FF1744',
    backgroundColor: 'rgba(255, 23, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gtrTailInner: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#FFFFFF',
  },
  gtrBadgeTag: {
    position: 'absolute',
    top: 0,
    right: 16,
    backgroundColor: '#FF1744',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  gtrBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});

/* ─────────────────────────────────────────────
   ANIMATED INTRO SPLASH
   ───────────────────────────────────────────── */
const AnimatedIntroSplash: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const bgFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bgFade, { toValue: 1, duration: 300, useNativeDriver: useNative }),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: useNative }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 45, useNativeDriver: useNative }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: useNative }),
      Animated.timing(underlineWidth, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),
      Animated.delay(800),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[splash.container, { opacity: bgFade }]}>
      <View style={splash.ambientGlow} />

      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: 'center' }}>
        <View style={splash.sunBadgeCircle}>
          <View style={splash.nsTextRow}>
            <Text style={splash.nsLetterN}>N</Text>
            <Text style={splash.nsLetterS}>S</Text>
          </View>
        </View>

        <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 20 }}>
          <Text style={splash.finalTitle}>NEW SUNSHINE</Text>
          <Text style={splash.finalSub}>DRIVING ACADEMY</Text>
          <Animated.View style={[splash.underline, { transform: [{ scaleX: underlineWidth }] }]} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const splash = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(227, 24, 55, 0.06)',
    top: '20%',
  },
  scene: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 260,
    height: 260,
    borderRadius: 48,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    borderWidth: 1,
    borderColor: '#222',
    ...Platform.select({
      web: { boxShadow: '0 0 60px rgba(227, 24, 55, 0.2), 0 20px 40px rgba(0,0,0,0.5)' } as any,
      default: { shadowColor: '#E31837', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 25 },
    }),
  },
  sun: {
    position: 'absolute',
    top: 22,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E31837',
    ...Platform.select({
      web: { boxShadow: '0 0 40px rgba(227, 24, 55, 0.6), inset 0 -8px 16px rgba(0,0,0,0.2)' } as any,
      default: { shadowColor: '#E31837', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 40, elevation: 20 },
    }),
  },
  glowRing: {
    position: 'absolute',
    top: 22,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#E31837',
    backgroundColor: 'transparent',
  },
  speedLine: {
    position: 'absolute',
    width: 30,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(227, 24, 55, 0.5)',
  },
  carWrap: {
    position: 'absolute',
    bottom: 55,
  },
  road: {
    position: 'absolute',
    bottom: 52,
    width: 240,
    height: 2,
    backgroundColor: '#444',
  },
  roadDash: {
    position: 'absolute',
    bottom: 47,
    width: 160,
    height: 1,
    backgroundColor: '#2A2A2A',
  },
  letterWrap: {
    position: 'absolute',
    bottom: 65,
  },
  letterN: {
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#E31837',
    letterSpacing: -2,
    ...Platform.select({
      web: { textShadow: '0 0 20px rgba(227, 24, 55, 0.5)' } as any,
      default: {},
    }),
  },
  letterS: {
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -2,
    ...Platform.select({
      web: { textShadow: '0 0 20px rgba(255, 255, 255, 0.3)' } as any,
      default: {},
    }),
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  particleRed: {
    backgroundColor: '#E31837',
  },
  particleGold: {
    backgroundColor: '#FFD700',
  },
  finalWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  sunBadgeCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E31837',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#FF1744', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 20 },
      android: { elevation: 25 },
      web: { boxShadow: '0 0 35px rgba(255, 23, 68, 0.7), 0 0 70px rgba(227, 24, 55, 0.4)' } as any
    }),
  },
  sunNsText: {
    color: '#000000',
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  nsTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2, // Fine-tunes optical centering for italic slant
  },
  nsLetterN: {
    color: '#000000',
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    includeFontPadding: false,
    textAlign: 'center',
  },
  nsLetterS: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    includeFontPadding: false,
    textAlign: 'center',
  },
  finalTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
  },
  finalSub: {
    color: '#E31837',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 5,
    textAlign: 'center',
    marginTop: 4,
  },
  underline: {
    marginTop: 10,
    height: 2,
    backgroundColor: '#E31837',
    width: '80%',
    alignSelf: 'center',
    borderRadius: 1,
  },
});

/* ─────────────────────────────────────────────
   MAIN ONBOARDING SCREEN
   ───────────────────────────────────────────── */
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const [showSlides, setShowSlides] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const slideOpacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(40)).current;

  const animateSlideIn = () => {
    slideOpacity.setValue(0);
    slideY.setValue(40);
    Animated.parallel([
      Animated.timing(slideOpacity, { toValue: 1, duration: 400, useNativeDriver: useNative }),
      Animated.spring(slideY, { toValue: 0, friction: 8, tension: 50, useNativeDriver: useNative }),
    ]).start();
  };

  useEffect(() => {
    if (showSlides) animateSlideIn();
  }, [showSlides, activeSlide]);

  const slides = [
    { title: t('onboarding.slide1Title'), subtitle: t('onboarding.slide1Sub'), icon: 'book-outline', accent: '#6366F1', bg: '#1E1B4B' },
    { title: t('onboarding.slide2Title'), subtitle: t('onboarding.slide2Sub'), icon: 'help-circle-outline', accent: '#10B981', bg: '#064E3B' },
    { title: t('onboarding.slide3Title'), subtitle: t('onboarding.slide3Sub'), icon: 'trending-up-outline', accent: '#E31837', bg: '#4C0519' },
  ];

  const handleNext = async () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      try { await AsyncStorage.setItem('onboarding-completed', 'true'); } catch {}
      onComplete();
    }
  };

  const handleSkip = async () => {
    try { await AsyncStorage.setItem('onboarding-completed', 'true'); } catch {}
    onComplete();
  };

  // Show intro splash first
  if (!showSlides) {
    return <AnimatedIntroSplash onFinish={() => setShowSlides(true)} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {activeSlide < slides.length - 1 ? (
          <Pressable onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t('common.skip')}</Text>
          </Pressable>
        ) : <View />}
      </View>

      <Animated.View style={[styles.slideContainer, { opacity: slideOpacity, transform: [{ translateY: slideY }] }]}>
        {/* Icon Card */}
        <View style={[styles.iconCard, { backgroundColor: slides[activeSlide].bg }]}>
          <View style={[styles.iconRing, { borderColor: `${slides[activeSlide].accent}40` }]}>
            <View style={[styles.iconInner, { backgroundColor: `${slides[activeSlide].accent}20` }]}>
              <Ionicons name={slides[activeSlide].icon as any} size={56} color={slides[activeSlide].accent} />
            </View>
          </View>
        </View>

        {/* Mini branding */}
        <View style={styles.miniLogo}>
          <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '900', fontStyle: 'italic', letterSpacing: -2 }}>
            N<Text style={{ color: colors.text }}>S</Text>
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{slides[activeSlide].title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{slides[activeSlide].subtitle}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, {
              backgroundColor: i === activeSlide ? colors.primary : colors.backgroundSelected,
              width: i === activeSlide ? 24 : 8,
            }]} />
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
  container: { flex: 1 },
  header: { height: 48, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 24 },
  skipText: { fontSize: 15, fontWeight: '600' },
  slideContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  iconCard: {
    width: 200, height: 200, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 32,
    ...Platform.select({
      web: { boxShadow: '0 12px 32px rgba(0,0,0,0.3)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 32, elevation: 15 },
    }),
  },
  iconRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  iconInner: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  miniLogo: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12, lineHeight: 34 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 },
  footer: { paddingHorizontal: 24, paddingBottom: 28, alignItems: 'center', width: '100%' },
  pagination: { flexDirection: 'row', marginBottom: 24 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  btn: { width: '100%' },
});
