import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useThemeColors } from '../theme/colors';
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
  const theme = useThemeColors();

  return (
    <View style={styles.container}>


      <View style={[styles.header, { marginBottom: isSmallHeight ? 24 : 32 }]}>
        <Text style={[styles.title, { fontSize: isSmallHeight ? layout.titleFontSizeSmall : layout.titleFontSize, color: theme.text }]} maxFontSizeMultiplier={1.4}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { fontSize: isSmallHeight ? layout.subtitleFontSizeSmall : layout.subtitleFontSize, color: theme.textMuted }]} maxFontSizeMultiplier={1.3}>{subtitle}</Text>}
      </View>

      {transcript && (
        <View style={[styles.transcriptCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.transcriptLabel, { color: theme.textMuted }]} maxFontSizeMultiplier={1.2}>
            Você disse:
          </Text>
          <Text style={[styles.transcriptText, { color: theme.primary }]} maxFontSizeMultiplier={1.3}>&quot;{transcript}&quot;</Text>
        </View>
      )}

      {steps && steps.length > 0 && (
        <Animated.View entering={FadeIn.delay(400)} style={[styles.stepsCard, { padding: isSmallHeight ? 20 : 28, backgroundColor: theme.card, borderColor: theme.border }]}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <View key={step.id} style={styles.stepWrapper}>
                <View style={styles.stepRow}>
                  <View style={styles.iconContainer}>
                    {step.status === 'completed' ? (
                      <Ionicons name="checkmark-circle" size={26} color={theme.success} />
                    ) : step.status === 'loading' ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <View style={[styles.pendingDot, { backgroundColor: theme.border }]} />
                    )}
                  </View>
                  <Text
                    maxFontSizeMultiplier={1.2}
                    style={[
                      styles.stepText,
                      { fontSize: isSmallHeight ? layout.cardSubtitleFontSizeSmall : layout.cardSubtitleFontSize, color: theme.textMuted },
                      step.status === 'completed' && { color: theme.success },
                      step.status === 'loading' && { color: theme.primary, fontWeight: '800' },
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
                {!isLast && (
                  <View style={[styles.stepLine, { backgroundColor: step.status === 'completed' ? theme.success : theme.border }]} />
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
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  transcriptCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  transcriptText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  stepsCard: {
    width: '100%',
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
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
  },
  stepText: {
    fontWeight: '600',
    flex: 1,
  },
});
