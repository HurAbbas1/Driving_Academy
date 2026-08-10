import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { Text } from './Text';

interface AnimatedSplashScreenProps {
  isReady: boolean;
  onAnimationComplete: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ isReady, onAnimationComplete }) => {
  // Logo Entrance Animation Values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    // Continuous ambient glow pulse behind logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 800, useNativeDriver: false }),
      ])
    ).start();

    // Direct Logo Entrance Sequence
    Animated.sequence([
      // Step 1: Red Sun Circle & NS Badge scale up & fade in
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 45, useNativeDriver: false }),
      ]),
      // Step 2: NEW SUNSHINE DRIVING ACADEMY text fades in
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: false }),

      // Hold on full logo
      Animated.delay(900),
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
      {/* Ambient Red Glow Backlight Halo */}
      <Animated.View style={[styles.bgGlow, { opacity: glowPulse }]} />

      {/* NEW SUNSHINE DRIVING ACADEMY LOGO */}
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: 'center' }}>
        {/* Japanese Sun Circle + NS Letters */}
        <View style={styles.sunBadgeCircle}>
          <Text style={styles.sunNsText}>N<Text style={{ color: '#FFFFFF' }}>S</Text></Text>
        </View>

        {/* Branding Title */}
        <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 24 }}>
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
    backgroundColor: '#0A0A0E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(227, 24, 55, 0.25)',
    transform: [{ scale: 1.5 }],
  },
  sunBadgeCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E31837',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#FF1744', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.7, shadowRadius: 24 },
      android: { elevation: 25 },
      web: { boxShadow: '0 0 45px rgba(255, 23, 68, 0.8), 0 0 80px rgba(227, 24, 55, 0.5)' } as any
    }),
  },
  sunNsText: {
    color: '#000000',
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -2,
  },
  logoTitleMain: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 6,
  },
  logoSubtitle: {
    color: '#E31837',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 5,
  },
});
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
