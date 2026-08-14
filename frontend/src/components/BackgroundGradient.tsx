import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../theme/colors';

export function BackgroundGradient() {
  const theme = useThemeColors();
  const scheme = useColorScheme();

  const gradientColors = scheme === 'dark'
    ? ['#1E3A5F', '#111827', theme.background] as const
    : ['#BFDBFE', '#DBEAFE', theme.background] as const;

  return (
    <LinearGradient 
      colors={gradientColors} 
      locations={[0, 0.4, 1]}
      style={StyleSheet.absoluteFillObject} 
    />
  );
}
