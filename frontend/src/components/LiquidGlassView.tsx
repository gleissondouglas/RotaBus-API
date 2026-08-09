import React, { useEffect, useState } from 'react';
import { View, ViewProps, StyleSheet, AccessibilityInfo, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '../theme/colors';

interface LiquidGlassViewProps extends ViewProps {
  intensity?: number;
  fallbackColor?: string;
}

export function LiquidGlassView({ intensity = 40, fallbackColor, style, children, ...rest }: LiquidGlassViewProps) {
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

  if (reduceTransparency) {
    return (
      <View style={[style, { backgroundColor: appliedFallback }]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <BlurView 
      intensity={intensity} 
      tint={scheme === 'dark' ? 'dark' : 'light'} 
      style={[styles.container, style]}
      {...rest}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
