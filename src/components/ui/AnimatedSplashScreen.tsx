import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { Text } from './Text';
import { useThemeStore } from '../../stores/themeStore';
import { Colors } from '../../constants/theme';

interface AnimatedSplashScreenProps {
  isReady: boolean;
  onAnimationComplete: () => void;
}

/* ─────────────────────────────────────────────
   RED NEON NISSAN GT-R R35 SILHOUETTE
   Inspired by Neon Light Wall Art
   ───────────────────────────────────────────── */
const RedNeonGTRSilhouette: React.FC = () => (
  <View style={neonStyles.wrapper}>
    {/* Ambient Red Glow Halo */}
    <View style={neonStyles.ambientGlow} />

    {/* 1. Main Roofline Neon Tube (Sweeping Hood to Trunk) */}
    <View style={neonStyles.roofTube} />
    <View style={neonStyles.roofCore} />

    {/* 2. GT-R Rear Wing Spoiler Neon Loop */}
    <View style={neonStyles.spoilerWing} />
    <View style={neonStyles.spoilerPillarLeft} />
    <View style={neonStyles.spoilerPillarRight} />

    {/* 3. Front Fender Flare & Slanted Hood Tube */}
    <View style={neonStyles.hoodTube} />

    {/* 4. Side Skirt Ground Baseline Bar */}
    <View style={neonStyles.sideSkirtTube} />

    {/* 5. Front Wheel Arch Neon Tube */}
    <View style={neonStyles.frontWheelArch} />

    {/* 6. Rear Wheel Arch Neon Tube */}
    <View style={neonStyles.rearWheelArch} />

    {/* 7. GT-R Inner Window Frame Outline */}
    <View style={neonStyles.windowFrame} />

    {/* 8. Slanted Headlight Sweep Stroke */}
    <View style={neonStyles.headlightSweep} />

    {/* 9. Iconic GT-R Twin Circular Afterburner Taillights (Glowing Red Rings) */}
    <View style={neonStyles.gtrTailRing1}>
      <View style={neonStyles.gtrTailInner} />
    </View>
    <View style={neonStyles.gtrTailRing2}>
      <View style={neonStyles.gtrTailInner} />
    </View>

    {/* 10. GT-R NISMO Badge Label */}
    <View style={neonStyles.gtrBadgeTag}>
      <Text style={neonStyles.gtrBadgeText}>GT-R</Text>
    </View>
  </View>
);

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ isReady, onAnimationComplete }) => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  // Neon GTR Car Animation Values
  const carOpacity = useRef(new Animated.Value(0)).current;
  const carScale = useRef(new Animated.Value(0.75)).current;
  const carX = useRef(new Animated.Value(-25)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Logo Transition Values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    // Continuous Neon Glow Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: false }),
      ])
    ).start();

    // Sequence: Red Neon GTR -> Morph & End on Logo
    Animated.sequence([
      // Step 1: Red Neon GTR Ignites and Moves in
      Animated.parallel([
        Animated.timing(carOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.spring(carScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: false }),
        Animated.timing(carX, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]),
      // Hold GTR Neon Glow
      Animated.delay(1000),

      // Step 2: GTR Morphs smoothly into NEW SUNSHINE Logo
      Animated.parallel([
        Animated.timing(carOpacity, { toValue: 0, duration: 500, useNativeDriver: false }),
        Animated.timing(carScale, { toValue: 1.25, duration: 500, useNativeDriver: false }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: false }),
      ]),

      // Step 3: Logo Subtitle text fades in
      Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),

      // Hold on Final Logo
      Animated.delay(700),
    ]).start(() => {
      setHasFinished(true);
    });
  }, []);

  useEffect(() => {
    if (hasFinished && isReady) {
      Animated.timing(logoOpacity, { toValue: 0, duration: 350, useNativeDriver: false }).start(() => {
        onAnimationComplete();
      });
    }
  }, [hasFinished, isReady]);

  return (
    <View style={styles.container}>
      {/* Background ambient red neon glow */}
      <Animated.View style={[styles.bgGlow, { opacity: pulseAnim }]} />

      {/* PHASE 1: ELECTRIC RED NEON NISSAN GT-R R35 */}
      <Animated.View style={{ opacity: carOpacity, transform: [{ scale: carScale }, { translateX: carX }], position: 'absolute' }}>
        <RedNeonGTRSilhouette />
      </Animated.View>

      {/* PHASE 2: END ON LOGO (Rising Sun + NS Branding) */}
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: 'center' }}>
        {/* Japanese Sun Circle + NS Letters */}
        <View style={styles.sunBadgeCircle}>
          <Text style={styles.sunNsText}>N<Text style={{ color: '#FFFFFF' }}>S</Text></Text>
        </View>

        {/* Branding Title */}
        <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 22 }}>
          <Text style={styles.logoTitleMain}>NEW SUNSHINE</Text>
          <Text style={styles.logoSubtitle}>DRIVING ACADEMY</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(227, 24, 55, 0.15)',
    transform: [{ scale: 1.6 }],
  },
  sunBadgeCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E31837',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#FF1744', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 20 },
      android: { elevation: 25 },
      web: { boxShadow: '0 0 35px rgba(255, 23, 68, 0.7), 0 0 70px rgba(227, 24, 55, 0.4)' } as any
    }),
  },
  sunNsText: {
    color: '#000000',
    fontSize: 46,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -2,
  },
  logoTitleMain: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3.5,
    marginBottom: 4,
  },
  logoSubtitle: {
    color: '#FF1744',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4.5,
  },
});

/* ────────────── NEON SIGN TUBE STYLES ────────────── */
const neonStyles = StyleSheet.create({
  wrapper: {
    width: 280,
    height: 110,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 260,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 23, 68, 0.22)',
    ...Platform.select({
      web: { filter: 'blur(20px)' } as any,
      default: { shadowColor: '#FF1744', shadowRadius: 30, shadowOpacity: 0.9 },
    }),
  },
  roofTube: {
    position: 'absolute',
    top: 18,
    left: 60,
    width: 135,
    height: 42,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 35,
    borderWidth: 3.5,
    borderColor: '#FF1744',
    borderBottomWidth: 0,
    borderRightWidth: 2,
    borderLeftWidth: 3.5,
    ...Platform.select({
      web: { boxShadow: '0 0 12px #FF1744, 0 0 25px #FF1744, 0 0 45px #E31837' } as any,
      default: { shadowColor: '#FF1744', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 12 },
    }),
  },
  roofCore: {
    position: 'absolute',
    top: 19,
    left: 61,
    width: 133,
    height: 40,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 34,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderBottomWidth: 0,
    opacity: 0.9,
  },
  spoilerWing: {
    position: 'absolute',
    top: 25,
    left: 12,
    width: 52,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF1744',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0 0 14px #FF1744, 0 0 28px #E31837' } as any,
      default: { shadowColor: '#FF1744', shadowRadius: 12, shadowOpacity: 1 },
    }),
  },
  spoilerPillarLeft: {
    position: 'absolute',
    top: 32,
    left: 24,
    width: 3,
    height: 22,
    backgroundColor: '#FF1744',
    ...Platform.select({
      web: { boxShadow: '0 0 8px #FF1744' } as any,
    }),
  },
  spoilerPillarRight: {
    position: 'absolute',
    top: 32,
    left: 48,
    width: 3,
    height: 22,
    backgroundColor: '#FF1744',
    ...Platform.select({
      web: { boxShadow: '0 0 8px #FF1744' } as any,
    }),
  },
  hoodTube: {
    position: 'absolute',
    bottom: 30,
    right: 12,
    width: 85,
    height: 22,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 2,
    borderWidth: 3.5,
    borderColor: '#FF1744',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    ...Platform.select({
      web: { boxShadow: '0 0 12px #FF1744, 0 0 25px #E31837' } as any,
      default: { shadowColor: '#FF1744', shadowRadius: 12, shadowOpacity: 1 },
    }),
  },
  sideSkirtTube: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 18,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FF1744',
    borderWidth: 0.8,
    borderColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0 0 14px #FF1744, 0 0 28px #E31837' } as any,
      default: { shadowColor: '#FF1744', shadowRadius: 14, shadowOpacity: 1 },
    }),
  },
  frontWheelArch: {
    position: 'absolute',
    bottom: 12,
    right: 38,
    width: 44,
    height: 26,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 3.5,
    borderColor: '#FF1744',
    borderBottomWidth: 0,
    ...Platform.select({
      web: { boxShadow: '0 0 12px #FF1744' } as any,
    }),
  },
  rearWheelArch: {
    position: 'absolute',
    bottom: 12,
    left: 38,
    width: 44,
    height: 26,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 3.5,
    borderColor: '#FF1744',
    borderBottomWidth: 0,
    ...Platform.select({
      web: { boxShadow: '0 0 12px #FF1744' } as any,
    }),
  },
  windowFrame: {
    position: 'absolute',
    top: 24,
    left: 82,
    width: 82,
    height: 26,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 24,
    borderWidth: 2.5,
    borderColor: '#FF1744',
    borderBottomWidth: 0,
    opacity: 0.9,
    ...Platform.select({
      web: { boxShadow: '0 0 10px #FF1744' } as any,
    }),
  },
  headlightSweep: {
    position: 'absolute',
    bottom: 30,
    right: 14,
    width: 22,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-18deg' }],
    ...Platform.select({
      web: { boxShadow: '0 0 16px #FFFFFF, 0 0 30px #FF1744' } as any,
      default: { shadowColor: '#FFFFFF', shadowRadius: 16, shadowOpacity: 1 },
    }),
  },
  gtrTailRing1: {
    position: 'absolute',
    bottom: 34,
    left: 20,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#FF1744',
    backgroundColor: 'rgba(255, 23, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 0 14px #FF1744, 0 0 28px #FF1744' } as any,
      default: { shadowColor: '#FF1744', shadowRadius: 14, shadowOpacity: 1 },
    }),
  },
  gtrTailRing2: {
    position: 'absolute',
    bottom: 34,
    left: 38,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2.5,
    borderColor: '#FF1744',
    backgroundColor: 'rgba(255, 23, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 0 12px #FF1744, 0 0 24px #FF1744' } as any,
      default: { shadowColor: '#FF1744', shadowRadius: 12, shadowOpacity: 1 },
    }),
  },
  gtrTailInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  gtrBadgeTag: {
    position: 'absolute',
    top: 0,
    right: 18,
    backgroundColor: '#FF1744',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    ...Platform.select({
      web: { boxShadow: '0 0 10px rgba(255, 23, 68, 0.8)' } as any,
    }),
  },
  gtrBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
