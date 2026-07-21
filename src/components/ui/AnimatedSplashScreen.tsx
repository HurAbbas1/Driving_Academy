import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Text, Platform } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedSplashScreenProps {
  isReady: boolean;
  onAnimationComplete: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ isReady, onAnimationComplete }) => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  const [hasAnimationFinished, setHasAnimationFinished] = useState(false);

  useEffect(() => {
    // Start the entrance animation sequence immediately
    Animated.sequence([
      // Logo scales up and fades in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
          easing: Easing.out(Easing.ease),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: false,
        }),
      ]),
      // Text fades in smoothly afterwards
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      })
    ]).start(() => {
      setHasAnimationFinished(true);
    });
  }, []);

  useEffect(() => {
    // If the animation is finished AND the app is fully ready to render, trigger completion
    if (hasAnimationFinished && isReady) {
      // Optional: Add an exit animation here before unmounting, like fading everything out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        onAnimationComplete();
      });
    }
  }, [hasAnimationFinished, isReady]);

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Background ambient glow effect to make it look premium */}
      <View style={[styles.glow, { backgroundColor: `${colors.primary}10` }]} />
      
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoLetter}>N<Text style={{color: '#fff'}}>S</Text></Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
        <Text style={[styles.title, { color: '#FFF' }]}>NEW SUNSHINE</Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>DRIVING ACADEMY</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    transform: [{ scale: 1.5 }],
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#E31837', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 20 },
      web: { boxShadow: '0px 8px 16px rgba(227, 24, 55, 0.4)' } as any
    }),
  },
  logoLetter: {
    color: '#000',
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -2,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
  },
});
