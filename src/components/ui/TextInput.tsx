import React, { useState, useRef } from 'react';
import { View, TextInput as RNTextInput, StyleSheet, Text, Animated, TextInputProps as RNTextInputProps, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/theme';
import { useThemeStore } from '../../stores/themeStore';

interface TextInputProps extends RNTextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  value,
  onFocus,
  onBlur,
  ...props
}) => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const [isFocused, setIsFocused] = useState(false);
  
  // Animation value starts at 1 if input already has a value, otherwise 0
  const focusAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Sync animation when value changes externally
  React.useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: (value || isFocused) ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value, isFocused]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const labelPosition = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -10],
  });

  const labelFontSize = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.Text
        style={[
          styles.label,
          {
            top: labelPosition,
            fontSize: labelFontSize,
            color: error
              ? colors.error
              : isFocused
              ? colors.primary
              : colors.textSecondary,
            backgroundColor: colors.backgroundElement,
            paddingHorizontal: 4,
          },
          labelStyle,
        ]}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>
      <RNTextInput
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
            backgroundColor: colors.backgroundElement,
          },
          inputStyle,
        ]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={value}
        placeholderTextColor="transparent" // use floating labels instead of standard placeholder
        {...props}
      />
      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
});
