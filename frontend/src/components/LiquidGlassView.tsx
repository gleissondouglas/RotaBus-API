import React, { useEffect, useState } from 'react';
import { View, ViewProps, StyleSheet, AccessibilityInfo, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '../theme/colors';

interface LiquidGlassViewProps extends ViewProps {
  intensity?: number;
  fallbackColor?: string;
  disableDefaultStyles?: boolean;
}

export function LiquidGlassView({ intensity = 50, fallbackColor, disableDefaultStyles = false, style, children, ...rest }: LiquidGlassViewProps) {
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const scheme = useColorScheme();
  const theme = useThemeColors();

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then(enabled => {
      if (isMounted) setReduceTransparency(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      enabled => {
        if (isMounted) setReduceTransparency(enabled);
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const defaultFallback = scheme === 'dark' ? theme.background : theme.white;
  const appliedFallback = fallbackColor || defaultFallback;

  const defaultGlassStyles = !disableDefaultStyles ? {
    backgroundColor: scheme === 'dark' ? "rgba(15, 23, 42, 0.3)" : "rgba(255, 255, 255, 0.2)",
    borderColor: scheme === 'dark' ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
  } : {};

  if (reduceTransparency) {
    return (
      <View style={[defaultGlassStyles, style, { backgroundColor: appliedFallback }]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <View style={[defaultGlassStyles, style, { overflow: 'hidden' }]} {...rest}>
      <BlurView 
        intensity={intensity} 
        tint={scheme === 'dark' ? 'dark' : 'light'} 
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  );
}

