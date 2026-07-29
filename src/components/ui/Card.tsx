import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle, Platform, Animated } from 'react-native';
import { Colors } from '../../constants/theme';
import { useThemeStore } from '../../stores/themeStore';
import * as Haptics from 'expo-haptics';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  variant?: 'default' | 'outlined' | 'elevated' | 'glass';
  hapticFeedback?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  hapticFeedback = true,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const handlePress = () => {
    if (!onPress) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const getCardStyle = () => {
    const baseStyle = styles.card;
    const themeStyle = {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
    };

    let variantStyle = {};
    switch (variant) {
      case 'default':
        variantStyle = {
          borderWidth: 1,
        };
        break;
      case 'outlined':
        variantStyle = {
          borderWidth: 1.5,
          borderColor: theme === 'dark' ? '#333333' : '#D0D0D0',
        };
        break;
      case 'elevated':
        variantStyle = {
          ...Platform.select({
            web: { boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 8px rgba(26,26,46,0.06), 0 8px 24px rgba(26,26,46,0.08)' } as any,
            default: {
              shadowColor: theme === 'dark' ? '#000000' : '#1A1A2E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: theme === 'dark' ? 0.35 : 0.12,
              shadowRadius: 16,
              elevation: 5,
            },
          }),
          borderWidth: theme === 'dark' ? 1 : 0,
        };
        break;
      case 'glass':
        variantStyle = {
          backgroundColor: theme === 'dark' ? 'rgba(26, 26, 26, 0.75)' : 'rgba(255, 255, 255, 0.88)',
          borderWidth: 1,
          borderColor: theme === 'dark' ? 'rgba(227, 24, 55, 0.25)' : 'rgba(212, 21, 64, 0.12)',
          ...Platform.select({
            web: {
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: theme === 'dark' 
                ? '0 4px 16px rgba(0,0,0,0.25), 0 0 10px rgba(227, 24, 55, 0.12)' 
                : '0 2px 8px rgba(26,26,46,0.05), 0 8px 24px rgba(26,26,46,0.08)',
            } as any,
            default: {
              shadowColor: theme === 'dark' ? colors.primary : '#1A1A2E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: theme === 'dark' ? 0.18 : 0.1,
              shadowRadius: 12,
              elevation: 4,
            }
          }),
        };
        break;
    }

    return [baseStyle, themeStyle, variantStyle, style];
  };

  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== 'web',
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 40,
      bounciness: 8,
    }).start();
  };

  if (onPress) {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={({ pressed }) => [
          { width: '100%', opacity: pressed ? 0.95 : 1 }
        ]}
      >
        <Animated.View style={[getCardStyle() as any, { transform: [{ scale: scaleAnim }] }]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return <View style={getCardStyle() as any}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
});
