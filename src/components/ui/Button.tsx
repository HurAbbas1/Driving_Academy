import React from 'react';
import { Pressable, StyleSheet, Text, ActivityIndicator, ViewStyle, TextStyle, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/theme';
import { useThemeStore } from '../../stores/themeStore';

interface ButtonProps {
  title: string;
  onPress: (event?: any) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  hapticFeedback?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const handlePress = (event?: any) => {
    if (disabled || loading) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onPress(event);
  };

  const getButtonStyle = () => {
    const baseStyle = styles.button;
    let variantStyle = {};
    
    switch (variant) {
      case 'primary':
        variantStyle = { backgroundColor: colors.primary };
        break;
      case 'secondary':
        variantStyle = { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border };
        break;
      case 'ghost':
        variantStyle = { backgroundColor: 'transparent' };
        break;
      case 'danger':
        variantStyle = { backgroundColor: colors.error };
        break;
    }

    let sizeStyle = {};
    switch (size) {
      case 'small':
        sizeStyle = styles.small;
        break;
      case 'medium':
        sizeStyle = styles.medium;
        break;
      case 'large':
        sizeStyle = styles.large;
        break;
    }

    return [baseStyle, variantStyle, sizeStyle, disabled && styles.disabled, style];
  };

  const getTextStyle = () => {
    const baseStyle = styles.text;
    let variantTextStyle = {};
    
    switch (variant) {
      case 'primary':
      case 'danger':
        variantTextStyle = { color: '#FFFFFF' };
        break;
      case 'secondary':
      case 'ghost':
        variantTextStyle = { color: colors.text };
        break;
    }

    let sizeTextStyle = {};
    switch (size) {
      case 'small':
        sizeTextStyle = { fontSize: 13 };
        break;
      case 'medium':
        sizeTextStyle = { fontSize: 15, fontWeight: '600' as const };
        break;
      case 'large':
        sizeTextStyle = { fontSize: 17, fontWeight: '700' as const };
        break;
    }

    return [baseStyle, variantTextStyle, sizeTextStyle, disabled && { color: colors.textSecondary }, textStyle];
  };

  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== 'web',
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        { opacity: pressed ? 0.95 : 1 }
      ]}
    >
      <Animated.View style={[getButtonStyle() as any, { transform: [{ scale: scaleAnim }] }]}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.text} size="small" />
        ) : (
          <Text style={getTextStyle() as any}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  text: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
