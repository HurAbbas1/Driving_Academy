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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const useNative = Platform.OS !== 'web';

/* ───────── Animated Intro Splash ───────── */
const AnimatedIntroSplash: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  // Phase 1: Red sun rises & grows
  const sunScale = useRef(new Animated.Value(0)).current;
  const sunGlow = useRef(new Animated.Value(0)).current;

  // Phase 2: Car silhouette drives in from left
  const carX = useRef(new Animated.Value(-SCREEN_W)).current;
  const carOpacity = useRef(new Animated.Value(0)).current;

  // Phase 3: "NS" letters slam in
  const nScale = useRef(new Animated.Value(3)).current;
  const nOpacity = useRef(new Animated.Value(0)).current;
  const sScale = useRef(new Animated.Value(3)).current;
  const sOpacity = useRef(new Animated.Value(0)).current;

  // Phase 4: Road lines animate
  const roadWidth = useRef(new Animated.Value(0)).current;

  // Phase 5: Transition - everything morphs to final logo
  const containerScale = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const finalLogoOpacity = useRef(new Animated.Value(0)).current;
  const finalLogoY = useRef(new Animated.Value(30)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;

  // Particles
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particleOpacity = useRef(new Animated.Value(0)).current;

  // Pulse ring
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      // ── Phase 1: Red Sun rises (0.0s - 0.8s) ──
      Animated.parallel([
        Animated.spring(sunScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: useNative }),
        Animated.timing(sunGlow, { toValue: 1, duration: 800, useNativeDriver: useNative }),
      ]),

      // ── Phase 1b: Pulse ring bursts out ──
      Animated.parallel([
        Animated.timing(ringOpacity, { toValue: 0.6, duration: 200, useNativeDriver: useNative }),
        Animated.timing(ringScale, { toValue: 2.5, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),
      ]),
      Animated.timing(ringOpacity, { toValue: 0, duration: 300, useNativeDriver: useNative }),

      // ── Phase 2: Car drives across (0.8s - 1.6s) ──
      Animated.parallel([
        Animated.timing(carOpacity, { toValue: 1, duration: 100, useNativeDriver: useNative }),
        Animated.timing(carX, { toValue: 0, duration: 800, easing: Easing.out(Easing.back(1.2)), useNativeDriver: useNative }),
      ]),

      // ── Phase 3: "N" and "S" slam in with scale bounce ──
      Animated.parallel([
        Animated.spring(nScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: useNative }),
        Animated.timing(nOpacity, { toValue: 1, duration: 200, useNativeDriver: useNative }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(sScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: useNative }),
        Animated.timing(sOpacity, { toValue: 1, duration: 200, useNativeDriver: useNative }),
      ]),

      // ── Phase 4: Road lines extend ──
      Animated.timing(roadWidth, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),

      // ── Phase 4b: Particles burst ──
      Animated.parallel([
        Animated.timing(particleOpacity, { toValue: 1, duration: 200, useNativeDriver: useNative }),
        Animated.timing(particle1, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),
        Animated.timing(particle2, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),
        Animated.timing(particle3, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),
      ]),
      Animated.timing(particleOpacity, { toValue: 0, duration: 400, useNativeDriver: useNative }),

      // ── Hold for dramatic pause ──
      Animated.delay(600),

      // ── Phase 5: Morph to final logo ──
      Animated.parallel([
        Animated.timing(containerScale, { toValue: 0.85, duration: 500, easing: Easing.inOut(Easing.cubic), useNativeDriver: useNative }),
        Animated.timing(bgOpacity, { toValue: 0, duration: 600, useNativeDriver: useNative }),
        Animated.timing(finalLogoOpacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: useNative }),
        Animated.spring(finalLogoY, { toValue: 0, friction: 8, tension: 40, delay: 200, useNativeDriver: useNative }),
      ]),

      // ── Phase 6: Tagline slides up ──
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: useNative }),
        Animated.spring(taglineY, { toValue: 0, friction: 8, tension: 50, useNativeDriver: useNative }),
      ]),

      // ── Final hold ──
      Animated.delay(800),
    ]);

    sequence.start(() => onFinish());
  }, []);

  return (
    <View style={splashStyles.container}>
      {/* ── Dark Background Card (Starting Logo) ── */}
      <Animated.View style={[
        splashStyles.darkCard,
        {
          opacity: bgOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}>
        {/* Red Sun Circle */}
        <Animated.View style={[
          splashStyles.sunCircle,
          {
            opacity: sunGlow,
            transform: [{ scale: sunScale }],
          },
        ]} />

        {/* Pulse Ring */}
        <Animated.View style={[
          splashStyles.pulseRing,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]} />

        {/* Car Silhouette */}
        <Animated.View style={[
          splashStyles.carContainer,
          {
            opacity: carOpacity,
            transform: [{ translateX: carX }],
          },
        ]}>
          {/* Car body - built with views */}
          <View style={splashStyles.carBody} />
          <View style={splashStyles.carRoof} />
          <View style={splashStyles.carWheel1} />
          <View style={splashStyles.carWheel2} />
          <View style={splashStyles.carWindow1} />
          <View style={splashStyles.carWindow2} />
          <View style={splashStyles.carHeadlight} />
        </Animated.View>

        {/* Road Lines */}
        <Animated.View style={[
          splashStyles.roadLine,
          {
            transform: [{ scaleX: roadWidth }],
          },
        ]} />
        <Animated.View style={[
          splashStyles.roadLine2,
          {
            transform: [{ scaleX: roadWidth }],
          },
        ]} />

        {/* "N" Letter */}
        <Animated.View style={[
          splashStyles.letterContainer,
          { left: '28%' },
          {
            opacity: nOpacity,
            transform: [{ scale: nScale }],
          },
        ]}>
          <Text style={splashStyles.letterN}>N</Text>
        </Animated.View>

        {/* "S" Letter */}
        <Animated.View style={[
          splashStyles.letterContainer,
          { left: '53%' },
          {
            opacity: sOpacity,
            transform: [{ scale: sScale }],
          },
        ]}>
          <Text style={splashStyles.letterS}>S</Text>
        </Animated.View>

        {/* Particles */}
        {[particle1, particle2, particle3].map((p, i) => {
          const angle = (i * 120) * (Math.PI / 180);
          return (
            <Animated.View
              key={`p-${i}`}
              style={[
                splashStyles.particle,
                {
                  opacity: particleOpacity,
                  transform: [
                    { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * 80] }) },
                    { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * 80] }) },
                    { scale: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.2, 0.3] }) },
                  ],
                },
              ]}
            />
          );
        })}
      </Animated.View>

      {/* ── Final Logo (Ending Logo) ── */}
      <Animated.View style={[
        splashStyles.finalLogoContainer,
        {
          opacity: finalLogoOpacity,
          transform: [{ translateY: finalLogoY }],
        },
      ]}>
        <View style={splashStyles.finalLogoRow}>
          <Text style={splashStyles.finalN}>N</Text>
          <Text style={splashStyles.finalS}>S</Text>
        </View>
        <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineY }] }}>
          <View style={splashStyles.finalTextBlock}>
            <Text style={splashStyles.finalTitle}>NEW SUNSHINE</Text>
            <Text style={splashStyles.finalSubtitle}>DRIVING ACADEMY</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkCard: {
    width: 220,
    height: 220,
    borderRadius: 40,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    ...Platform.select({
      web: { boxShadow: '0 0 40px rgba(227, 24, 55, 0.3)' } as any,
      default: { shadowColor: '#E31837', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 40, elevation: 20 },
    }),
  },
  sunCircle: {
    position: 'absolute',
    top: 25,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E31837',
    ...Platform.select({
      web: { boxShadow: '0 0 30px rgba(227, 24, 55, 0.6)' } as any,
      default: { shadowColor: '#E31837', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 15 },
    }),
  },
  pulseRing: {
    position: 'absolute',
    top: 25,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#E31837',
    backgroundColor: 'transparent',
  },
  carContainer: {
    position: 'absolute',
    bottom: 65,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 45,
  },
  carBody: {
    position: 'absolute',
    bottom: 8,
    width: 100,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444',
  },
  carRoof: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    width: 55,
    height: 18,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 12,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444',
    borderBottomWidth: 0,
  },
  carWheel1: {
    position: 'absolute',
    bottom: 2,
    left: 15,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#555',
    borderWidth: 2,
    borderColor: '#888',
  },
  carWheel2: {
    position: 'absolute',
    bottom: 2,
    right: 20,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#555',
    borderWidth: 2,
    borderColor: '#888',
  },
  carWindow1: {
    position: 'absolute',
    bottom: 28,
    left: 30,
    width: 20,
    height: 12,
    borderTopLeftRadius: 6,
    backgroundColor: 'rgba(227, 24, 55, 0.3)',
  },
  carWindow2: {
    position: 'absolute',
    bottom: 28,
    left: 54,
    width: 22,
    height: 12,
    borderTopRightRadius: 8,
    backgroundColor: 'rgba(227, 24, 55, 0.3)',
  },
  carHeadlight: {
    position: 'absolute',
    bottom: 14,
    right: 10,
    width: 8,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    ...Platform.select({
      web: { boxShadow: '0 0 8px rgba(255, 215, 0, 0.8)' } as any,
      default: { shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 },
    }),
  },
  roadLine: {
    position: 'absolute',
    bottom: 55,
    width: 180,
    height: 2,
    backgroundColor: '#555',
  },
  roadLine2: {
    position: 'absolute',
    bottom: 50,
    width: 120,
    height: 1,
    backgroundColor: '#333',
  },
  letterContainer: {
    position: 'absolute',
    bottom: 72,
  },
  letterN: {
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#E31837',
    letterSpacing: -2,
  },
  letterS: {
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E31837',
  },
  finalLogoContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  finalLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  finalN: {
    fontSize: 56,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#E31837',
    letterSpacing: -3,
  },
  finalS: {
    fontSize: 56,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -3,
  },
  finalTextBlock: {
    alignItems: 'center',
  },
  finalTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: 3,
  },
  finalSubtitle: {
    color: '#E31837',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 4,
    marginTop: 2,
  },
});

/* ───────── Main Onboarding Screen ───────── */
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const [showSlides, setShowSlides] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Slide transition animations
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
    {
      title: t('onboarding.slide1Title'),
      subtitle: t('onboarding.slide1Sub'),
      icon: 'book-outline',
      iconColor: '#4F46E5',
      bgGradient: '#1E1B4B',
    },
    {
      title: t('onboarding.slide2Title'),
      subtitle: t('onboarding.slide2Sub'),
      icon: 'help-circle-outline',
      iconColor: '#059669',
      bgGradient: '#064E3B',
    },
    {
      title: t('onboarding.slide3Title'),
      subtitle: t('onboarding.slide3Sub'),
      icon: 'trending-up-outline',
      iconColor: '#E31837',
      bgGradient: '#4C0519',
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
        ) : (
          <View />
        )}
      </View>

      <Animated.View style={[styles.slideContainer, { opacity: slideOpacity, transform: [{ translateY: slideY }] }]}>
        {/* Animated Icon Card */}
        <View style={[styles.iconCard, { backgroundColor: slides[activeSlide].bgGradient }]}>
          <View style={[styles.iconRing, { borderColor: `${slides[activeSlide].iconColor}40` }]}>
            <View style={[styles.iconInner, { backgroundColor: `${slides[activeSlide].iconColor}20` }]}>
              <Ionicons name={slides[activeSlide].icon as any} size={56} color={slides[activeSlide].iconColor} />
            </View>
          </View>
        </View>

        {/* Branding Mini Logo */}
        <View style={styles.miniLogoRow}>
          <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '900', fontStyle: 'italic', letterSpacing: -2 }}>
            N<Text style={{ color: colors.text }}>S</Text>
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{slides[activeSlide].title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{slides[activeSlide].subtitle}</Text>
      </Animated.View>

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
  iconCard: {
    width: 200,
    height: 200,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    ...Platform.select({
      web: { boxShadow: '0 12px 32px rgba(0,0,0,0.3)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 32, elevation: 15 },
    }),
  },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLogoRow: {
    marginBottom: 16,
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
