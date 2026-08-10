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
          <View style={styles.nsTextRow}>
            <Text style={styles.nsLetterN}>N</Text>
            <Text style={styles.nsLetterS}>S</Text>
          </View>
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
  nsTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2, // Fine-tunes optical centering for italic slant
  },
  nsLetterN: {
    color: '#000000',
    fontSize: 46,
    fontWeight: '900',
    fontStyle: 'italic',
    includeFontPadding: false,
    textAlign: 'center',
  },
  nsLetterS: {
    color: '#FFFFFF',
    fontSize: 46,
    fontWeight: '900',
    fontStyle: 'italic',
    includeFontPadding: false,
    textAlign: 'center',
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
