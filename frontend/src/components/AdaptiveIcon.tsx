import React from 'react';
import { Platform } from 'react-native';
import { SymbolView, SFSymbol } from 'expo-symbols';
import { MaterialCommunityIcons, Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useThemeColors } from '../theme/colors';

export type IconFamily = 'MaterialCommunityIcons' | 'Ionicons' | 'FontAwesome6';

export interface AdaptiveIconProps {
  iosSymbol: SFSymbol;
  fallbackFamily: IconFamily;
  fallbackName: string;
  size?: number;
  color?: string;
  style?: any;
}

export function AdaptiveIcon({ iosSymbol, fallbackFamily, fallbackName, size = 24, color, style }: AdaptiveIconProps) {
  const theme = useThemeColors();
  const iconColor = color || theme.text;

  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={iosSymbol}
        size={size}
        tintColor={iconColor}
        resizeMode="scaleAspectFit"
        style={style}
      />
    );
  }

  if (fallbackFamily === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={fallbackName as any} size={size} color={iconColor} style={style} />;
  }

  if (fallbackFamily === 'FontAwesome6') {
    return <FontAwesome6 name={fallbackName as any} size={size} color={iconColor} style={style} />;
  }

  return <Ionicons name={fallbackName as any} size={size} color={iconColor} style={style} />;
}
