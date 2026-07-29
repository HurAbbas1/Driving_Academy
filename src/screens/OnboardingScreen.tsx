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
   SUPERCAR — Built Entirely from Views
   ───────────────────────────────────────────── */
const SuperCar: React.FC = () => (
  <View style={carStyles.wrapper}>
    {/* Rear spoiler */}
    <View style={carStyles.spoiler} />
    <View style={carStyles.spoilerPillar} />

    {/* Main body */}
    <View style={carStyles.body}>
      {/* Body accent stripe */}
      <View style={carStyles.bodyStripe} />
    </View>

    {/* Windshield / Cockpit */}
    <View style={carStyles.cockpit}>
      <View style={carStyles.windshield} />
      <View style={carStyles.rearWindow} />
    </View>

    {/* Hood (long front) */}
    <View style={carStyles.hood} />

    {/* Front splitter */}
    <View style={carStyles.frontSplitter} />

    {/* Rear diffuser */}
    <View style={carStyles.rearDiffuser} />

    {/* Headlights */}
    <View style={carStyles.headlightOuter} />
    <View style={carStyles.headlightInner} />

    {/* Taillights */}
    <View style={carStyles.taillightTop} />
    <View style={carStyles.taillightBottom} />

    {/* Front wheel */}
    <View style={carStyles.wheelFront}>
      <View style={carStyles.wheelRim} />
      <View style={carStyles.wheelHub} />
    </View>

    {/* Rear wheel */}
    <View style={carStyles.wheelRear}>
      <View style={carStyles.wheelRim} />
      <View style={carStyles.wheelHub} />
    </View>

    {/* Side intake */}
    <View style={carStyles.sideIntake} />

    {/* Door line */}
    <View style={carStyles.doorLine} />
  </View>
);

const carStyles = StyleSheet.create({
  wrapper: {
    width: 180,
    height: 65,
    position: 'relative',
  },
  body: {
    position: 'absolute',
    bottom: 14,
    left: 10,
    right: 5,
    height: 24,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  bodyStripe: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#E31837',
    opacity: 0.7,
  },
  cockpit: {
    position: 'absolute',
    bottom: 33,
    left: 55,
    width: 55,
    height: 22,
    backgroundColor: '#222',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderColor: '#444',
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  windshield: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: 28,
    height: 18,
    borderTopRightRadius: 12,
    backgroundColor: 'rgba(227, 24, 55, 0.2)',
    borderLeftWidth: 1,
    borderColor: '#555',
  },
  rearWindow: {
    position: 'absolute',
    left: 2,
    top: 3,
    width: 22,
    height: 16,
    borderTopLeftRadius: 3,
    backgroundColor: 'rgba(227, 24, 55, 0.15)',
    borderRightWidth: 1,
    borderColor: '#555',
  },
  hood: {
    position: 'absolute',
    bottom: 22,
    right: 5,
    width: 65,
    height: 14,
    backgroundColor: '#2A2A2A',
    borderTopRightRadius: 6,
    borderTopLeftRadius: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  frontSplitter: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    width: 18,
    height: 6,
    backgroundColor: '#333',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 2,
  },
  rearDiffuser: {
    position: 'absolute',
    bottom: 10,
    left: 2,
    width: 14,
    height: 5,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  spoiler: {
    position: 'absolute',
    bottom: 50,
    left: 6,
    width: 30,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
  },
  spoilerPillar: {
    position: 'absolute',
    bottom: 38,
    left: 18,
    width: 3,
    height: 14,
    backgroundColor: '#444',
  },
  headlightOuter: {
    position: 'absolute',
    bottom: 24,
    right: 4,
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFE066',
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(255, 224, 102, 0.9)' } as any,
      default: { shadowColor: '#FFE066', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 12 },
    }),
  },
  headlightInner: {
    position: 'absolute',
    bottom: 25,
    right: 6,
    width: 5,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  taillightTop: {
    position: 'absolute',
    bottom: 28,
    left: 10,
    width: 7,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF1744',
    ...Platform.select({
      web: { boxShadow: '0 0 8px rgba(255, 23, 68, 0.8)' } as any,
      default: { shadowColor: '#FF1744', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 },
    }),
  },
  taillightBottom: {
    position: 'absolute',
    bottom: 22,
    left: 10,
    width: 7,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FF5252',
    opacity: 0.7,
  },
  wheelFront: {
    position: 'absolute',
    bottom: 3,
    right: 22,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A1A1A',
    borderWidth: 3,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelRear: {
    position: 'absolute',
    bottom: 3,
    left: 22,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A1A1A',
    borderWidth: 3,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelRim: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#888',
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelHub: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#AAA',
  },
  sideIntake: {
    position: 'absolute',
    bottom: 18,
    left: 48,
    width: 12,
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#444',
  },
  doorLine: {
    position: 'absolute',
    bottom: 18,
    left: 65,
    width: 1,
    height: 26,
    backgroundColor: '#444',
  },
});

/* ─────────────────────────────────────────────
   ANIMATED INTRO SPLASH
   ───────────────────────────────────────────── */
const AnimatedIntroSplash: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  // Background
  const bgFade = useRef(new Animated.Value(0)).current;

  // Phase 1: Red sun
  const sunScale = useRef(new Animated.Value(0)).current;
  const sunGlow = useRef(new Animated.Value(0)).current;

  // Ambient glow ring
  const glowRingScale = useRef(new Animated.Value(0.4)).current;
  const glowRingOpacity = useRef(new Animated.Value(0)).current;

  // Phase 2: Car
  const carX = useRef(new Animated.Value(-SCREEN_W * 0.8)).current;
  const carOpacity = useRef(new Animated.Value(0)).current;

  // Speed lines
  const speedLine1 = useRef(new Animated.Value(0)).current;
  const speedLine2 = useRef(new Animated.Value(0)).current;
  const speedLine3 = useRef(new Animated.Value(0)).current;

  // Phase 3: NS letters
  const nX = useRef(new Animated.Value(-80)).current;
  const nOpacity = useRef(new Animated.Value(0)).current;
  const sX = useRef(new Animated.Value(80)).current;
  const sOpacity = useRef(new Animated.Value(0)).current;

  // Road
  const roadScaleX = useRef(new Animated.Value(0)).current;

  // Phase 4: Particles
  const particles = Array.from({ length: 6 }, () => ({
    progress: useRef(new Animated.Value(0)).current,
  }));
  const particleOpacity = useRef(new Animated.Value(0)).current;

  // Phase 5: Everything scales down & morphs
  const sceneScale = useRef(new Animated.Value(1)).current;
  const sceneOpacity = useRef(new Animated.Value(1)).current;

  // Final logo
  const finalOpacity = useRef(new Animated.Value(0)).current;
  const finalScale = useRef(new Animated.Value(0.7)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(24)).current;

  // Underline
  const underlineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // BG fade in
      Animated.timing(bgFade, { toValue: 1, duration: 300, useNativeDriver: useNative }),

      // ── Phase 1: Red Sun rises with glow ring ──
      Animated.parallel([
        Animated.spring(sunScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: useNative }),
        Animated.timing(sunGlow, { toValue: 1, duration: 500, useNativeDriver: useNative }),
      ]),
      // Glow ring expands
      Animated.parallel([
        Animated.timing(glowRingOpacity, { toValue: 0.5, duration: 250, useNativeDriver: useNative }),
        Animated.timing(glowRingScale, { toValue: 3, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),
      ]),
      Animated.timing(glowRingOpacity, { toValue: 0, duration: 400, useNativeDriver: useNative }),

      // ── Phase 2: Supercar races in ──
      Animated.parallel([
        Animated.timing(carOpacity, { toValue: 1, duration: 80, useNativeDriver: useNative }),
        Animated.timing(carX, { toValue: 0, duration: 700, easing: Easing.out(Easing.back(1.1)), useNativeDriver: useNative }),
        // Speed lines
        Animated.sequence([
          Animated.delay(100),
          Animated.parallel([
            Animated.timing(speedLine1, { toValue: 1, duration: 400, useNativeDriver: useNative }),
            Animated.timing(speedLine2, { toValue: 1, duration: 500, useNativeDriver: useNative }),
            Animated.timing(speedLine3, { toValue: 1, duration: 350, useNativeDriver: useNative }),
          ]),
        ]),
      ]),

      // ── Phase 3: NS letters fly in from opposite sides ──
      Animated.parallel([
        Animated.spring(nX, { toValue: 0, friction: 6, tension: 60, useNativeDriver: useNative }),
        Animated.timing(nOpacity, { toValue: 1, duration: 250, useNativeDriver: useNative }),
        Animated.spring(sX, { toValue: 0, friction: 6, tension: 60, useNativeDriver: useNative }),
        Animated.timing(sOpacity, { toValue: 1, duration: 250, useNativeDriver: useNative }),
      ]),

      // Road extends
      Animated.timing(roadScaleX, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),

      // ── Phase 4: Particle burst ──
      Animated.parallel([
        Animated.timing(particleOpacity, { toValue: 1, duration: 150, useNativeDriver: useNative }),
        ...particles.map((p, i) =>
          Animated.timing(p.progress, { toValue: 1, duration: 500 + i * 60, easing: Easing.out(Easing.cubic), useNativeDriver: useNative })
        ),
      ]),
      Animated.timing(particleOpacity, { toValue: 0, duration: 350, useNativeDriver: useNative }),

      // ── Dramatic Pause ──
      Animated.delay(500),

      // ── Phase 5: Scene shrinks, final logo appears ──
      Animated.parallel([
        Animated.timing(sceneScale, { toValue: 0.6, duration: 600, easing: Easing.inOut(Easing.cubic), useNativeDriver: useNative }),
        Animated.timing(sceneOpacity, { toValue: 0, duration: 500, useNativeDriver: useNative }),
        Animated.timing(finalOpacity, { toValue: 1, duration: 500, delay: 250, useNativeDriver: useNative }),
        Animated.spring(finalScale, { toValue: 1, friction: 7, tension: 40, delay: 250, useNativeDriver: useNative }),
      ]),

      // ── Phase 6: Tagline + underline ──
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: useNative }),
        Animated.spring(taglineY, { toValue: 0, friction: 8, tension: 50, useNativeDriver: useNative }),
      ]),
      Animated.timing(underlineWidth, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),

      // Hold
      Animated.delay(700),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[splash.container, { opacity: bgFade }]}>
      {/* Ambient red gradient background glow */}
      <View style={splash.ambientGlow} />

      {/* ── Scene Container (start logo) ── */}
      <Animated.View style={[splash.scene, { opacity: sceneOpacity, transform: [{ scale: sceneScale }] }]}>
        {/* Dark card */}
        <View style={splash.card}>
          {/* Red Sun */}
          <Animated.View style={[splash.sun, { opacity: sunGlow, transform: [{ scale: sunScale }] }]} />

          {/* Glow ring */}
          <Animated.View style={[splash.glowRing, { opacity: glowRingOpacity, transform: [{ scale: glowRingScale }] }]} />

          {/* Speed lines */}
          {[speedLine1, speedLine2, speedLine3].map((sl, i) => (
            <Animated.View
              key={`sl-${i}`}
              style={[
                splash.speedLine,
                { top: 90 + i * 16, right: 160 + i * 10 },
                {
                  opacity: sl.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
                  transform: [{ scaleX: sl }, { translateX: sl.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) }],
                },
              ]}
            />
          ))}

          {/* Supercar */}
          <Animated.View style={[splash.carWrap, { opacity: carOpacity, transform: [{ translateX: carX }] }]}>
            <SuperCar />
          </Animated.View>

          {/* Road */}
          <Animated.View style={[splash.road, { transform: [{ scaleX: roadScaleX }] }]} />
          <Animated.View style={[splash.roadDash, { transform: [{ scaleX: roadScaleX }] }]} />

          {/* N letter */}
          <Animated.View style={[splash.letterWrap, { left: '23%' }, { opacity: nOpacity, transform: [{ translateX: nX }] }]}>
            <Text style={splash.letterN}>N</Text>
          </Animated.View>

          {/* S letter */}
          <Animated.View style={[splash.letterWrap, { left: '52%' }, { opacity: sOpacity, transform: [{ translateX: sX }] }]}>
            <Text style={splash.letterS}>S</Text>
          </Animated.View>

          {/* Particles */}
          {particles.map((p, i) => {
            const angle = (i * 60 + 15) * (Math.PI / 180);
            const dist = 60 + (i % 3) * 25;
            return (
              <Animated.View
                key={`p-${i}`}
                style={[
                  splash.particle,
                  i % 2 === 0 ? splash.particleRed : splash.particleGold,
                  {
                    opacity: particleOpacity,
                    transform: [
                      { translateX: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] }) },
                      { translateY: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * dist] }) },
                      { scale: p.progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1.3, 0.2] }) },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>
      </Animated.View>

      {/* ── Final Logo (end logo) ── */}
      <Animated.View style={[splash.finalWrap, { opacity: finalOpacity, transform: [{ scale: finalScale }] }]}>
        <View style={splash.finalRow}>
          <Text style={splash.finalN}>N</Text>
          <Text style={splash.finalS}>S</Text>
        </View>
        <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineY }] }}>
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
  finalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  finalN: {
    fontSize: 64,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#E31837',
    letterSpacing: -4,
    ...Platform.select({
      web: { textShadow: '0 4px 24px rgba(227, 24, 55, 0.4)' } as any,
      default: {},
    }),
  },
  finalS: {
    fontSize: 64,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -4,
    ...Platform.select({
      web: { textShadow: '0 4px 24px rgba(255, 255, 255, 0.2)' } as any,
      default: {},
    }),
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
