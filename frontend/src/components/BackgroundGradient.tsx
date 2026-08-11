import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../theme/colors';

export function BackgroundGradient() {
  const theme = useThemeColors();
  return (
    <LinearGradient 
      colors={['#BFDBFE', '#DBEAFE', theme.background]} 
      locations={[0, 0.4, 1]}
      style={StyleSheet.absoluteFillObject} 
    />
  );
}
