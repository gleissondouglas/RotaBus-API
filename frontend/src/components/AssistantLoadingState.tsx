import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  FadeIn
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

export interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

interface AssistantLoadingStateProps {
  title: string;
  subtitle?: string;
  transcript?: string;
  steps?: LoadingStep[];
}

const RouteAnimation = () => {
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);

  useEffect(() => {
    pulse1.value = withRepeat(withTiming(1, { duration: 2000 }), -1, false);
    const timer = setTimeout(() => {
      pulse2.value = withRepeat(withTiming(1, { duration: 2000 }), -1, false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [pulse1, pulse2]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse1.value, [0, 1], [0.5, 2.5]) }],
    opacity: interpolate(pulse1.value, [0, 0.5, 1], [0.8, 0.3, 0]),
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse2.value, [0, 1], [0.5, 2.5]) }],
    opacity: interpolate(pulse2.value, [0, 0.5, 1], [0.8, 0.3, 0]),
  }));

  return (
    <View style={styles.animationContainer}>
      <Animated.View style={[styles.ring, ring1Style]} />
      <Animated.View style={[styles.ring, ring2Style]} />
      <View style={styles.centerPin}>
        <MaterialCommunityIcons name="google-maps" size={36} color={colors.primary} />
      </View>
    </View>
  );
};

export const AssistantLoadingState: React.FC<AssistantLoadingStateProps> = ({
  title,
  subtitle,
  transcript,
  steps,
}) => {
  const { height } = useWindowDimensions();
  const isSmallHeight = height < 740;

  return (
    <View style={styles.container}>
      <View style={styles.orbContainer}>
        <RouteAnimation />
      </View>

      <View style={[styles.header, { marginBottom: isSmallHeight ? 24 : 32 }]}>
        <Text style={[styles.title, { fontSize: isSmallHeight ? layout.titleFontSizeSmall : layout.titleFontSize }]} maxFontSizeMultiplier={1.4}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { fontSize: isSmallHeight ? layout.subtitleFontSizeSmall : layout.subtitleFontSize }]} maxFontSizeMultiplier={1.3}>{subtitle}</Text>}
      </View>

      {transcript && (
        <View style={styles.transcriptCard}>
          <Text style={styles.transcriptLabel} maxFontSizeMultiplier={1.2}>
            Você disse:
          </Text>
          <Text style={styles.transcriptText} maxFontSizeMultiplier={1.3}>&quot;{transcript}&quot;</Text>
        </View>
      )}

      {steps && steps.length > 0 && (
        <Animated.View entering={FadeIn.delay(400)} style={[styles.stepsCard, { padding: isSmallHeight ? 20 : 28 }]}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <View key={step.id} style={styles.stepWrapper}>
                <View style={styles.stepRow}>
                  <View style={styles.iconContainer}>
                    {step.status === 'completed' ? (
                      <Ionicons name="checkmark-circle" size={26} color={colors.success} />
                    ) : step.status === 'loading' ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <View style={styles.pendingDot} />
                    )}
                  </View>
                  <Text
                    maxFontSizeMultiplier={1.2}
                    style={[
                      styles.stepText,
                      { fontSize: isSmallHeight ? layout.cardSubtitleFontSizeSmall : layout.cardSubtitleFontSize },
                      step.status === 'completed' && styles.stepTextCompleted,
                      step.status === 'loading' && styles.stepTextActive,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
                {!isLast && (
                  <View style={[styles.stepLine, { backgroundColor: step.status === 'completed' ? colors.success : colors.border }]} />
                )}
              </View>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
  animationContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
  },
  centerPin: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  orbContainer: {
    marginBottom: 0,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontWeight: '900',
    color: '#011030',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  transcriptCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  transcriptText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  stepsCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  stepWrapper: {
    flexDirection: 'column',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 13, // align center with the 28px width icon container
    marginVertical: 4,
    borderRadius: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  stepText: {
    color: colors.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  stepTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  stepTextCompleted: {
    color: colors.success,
  },
});
