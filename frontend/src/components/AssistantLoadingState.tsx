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
