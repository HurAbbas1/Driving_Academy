import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface TextProps extends RNTextProps {}

export function Text({ style, ...props }: TextProps) {
  // Infer font family from font weight if defined in style
  // Flatten styles to check for fontWeight
  const flatStyle = style ? JSON.parse(JSON.stringify(style)) : {};
  let fontFamily = 'Outfit_500Medium'; // default medium
  
  // Note: Object.assign or StyleSheet.flatten could be used, but since this is a simple app, 
  // we just inject it at the beginning of the style array so it acts as a default that can be overridden.
  return (
    <RNText 
      {...props} 
      style={[{ fontFamily }, style]} 
    />
  );
}
