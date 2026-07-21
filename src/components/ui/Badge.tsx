import React from 'react';
import { View, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/theme';
import { useThemeStore } from '../../stores/themeStore';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  style,
  textStyle,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const getBadgeStyle = () => {
    let backgroundColor: string = colors.backgroundSelected;
    let borderColor: string = colors.border;
    let borderWidth = 1;

    switch (variant) {
      case 'primary':
        backgroundColor = `${colors.primary}20`; // Opacity
        borderColor = colors.primary;
        break;
      case 'success':
        backgroundColor = `${colors.success}20`;
        borderColor = colors.success;
        break;
      case 'warning':
        backgroundColor = `${colors.warning}20`;
        borderColor = colors.warning;
        break;
      case 'danger':
        backgroundColor = `${colors.error}20`;
        borderColor = colors.error;
        break;
    }

    return [styles.badge, { backgroundColor, borderColor, borderWidth }, style];
  };

  const getLabelStyle = () => {
    let color: string = colors.text;

    switch (variant) {
      case 'primary':
        color = colors.primary;
        break;
      case 'success':
        color = colors.success;
        break;
      case 'warning':
        color = colors.warning;
        break;
      case 'danger':
        color = colors.error;
        break;
    }

    return [styles.label, { color }, textStyle];
  };

  return (
    <View style={getBadgeStyle() as any}>
      <Text style={getLabelStyle() as any}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
