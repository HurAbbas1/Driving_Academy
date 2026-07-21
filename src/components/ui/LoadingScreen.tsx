import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, ActivityIndicator, Platform } from 'react-native';
import { Colors } from '../../constants/theme';
import { useThemeStore } from '../../stores/themeStore';

export const LoadingScreen: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const pulseAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Animated Accent Red Circle to mimic logo styling */}
        <Animated.View
          style={[
            styles.circle,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: pulseAnim }],
              ...Platform.select({
                web: { boxShadow: `0 0 15px ${colors.primary}CC` },
                default: { shadowColor: colors.primary },
              }),
            },
          ]}
        >
          <Text style={styles.circleText}>NCS</Text>
        </Animated.View>
        <Text style={[styles.title, { color: colors.text }]}>NEW SUNSHINE</Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>DRIVING ACADEMY</Text>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0 0 15px rgba(0,0,0,0.8)' } as any,
      default: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 8,
      },
    }),
  },
  circleText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 32,
  },
  loader: {
    marginTop: 16,
  },
});
