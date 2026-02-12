import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/ThemeContext';

interface ConfidenceMeterProps {
  longConfidence: number;
  shortConfidence: number;
}

function MeterBar({ 
  label, 
  confidence, 
  color,
  glowColor,
}: { 
  label: string; 
  confidence: number; 
  color: string;
  glowColor: string;
}) {
  const { theme } = useTheme();
  const glowAnim = useSharedValue(0);
  const fillAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(0);

  useEffect(() => {
    fillAnim.value = withTiming(confidence / 100, { duration: 800 });

    const intensity = Math.min(1, Math.max(0, (confidence - 20) / 60));
    
    if (confidence > 20) {
      const speed = 1400 - (intensity * 800);
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(intensity, { duration: speed, easing: Easing.inOut(Easing.ease) }),
          withTiming(intensity * 0.2, { duration: speed, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: speed * 0.7 }),
          withTiming(0, { duration: speed * 0.7 })
        ),
        -1,
        true
      );
    } else {
      glowAnim.value = withTiming(0, { duration: 400 });
      pulseAnim.value = withTiming(0, { duration: 400 });
    }
  }, [confidence]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillAnim.value * 100}%`,
  }));

  const glowStyle = useAnimatedStyle(() => {
    const val = glowAnim.value;
    const radius = 6 + (val * 40);
    return {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: val * 1.2,
      shadowRadius: radius,
      elevation: val > 0.15 ? Math.round(val * 24) : 0,
    };
  });

  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value * 0.7,
  }));

  const percentGlowStyle = useAnimatedStyle(() => {
    if (confidence < 40) return {};
    const scale = Math.min(1, (confidence - 40) / 40);
    return {
      textShadowColor: color,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 4 + (pulseAnim.value * 18 * scale),
    };
  });

  const getConfidenceLabel = (value: number): string => {
    if (value >= 80) return 'VERY STRONG';
    if (value >= 65) return 'STRONG';
    if (value >= 50) return 'MODERATE';
    if (value >= 35) return 'WEAK';
    return 'VERY WEAK';
  };
  
  return (
    <View style={styles.meterContainer}>
      <View style={styles.meterHeader}>
        <View style={styles.labelRow}>
          <View style={[styles.labelDot, { backgroundColor: color }]} />
          <Text style={[styles.meterLabel, { color: theme.textSecondary }]}>{label}</Text>
        </View>
        <View style={styles.confidenceValues}>
          <Animated.Text style={[styles.confidencePercent, { color }, percentGlowStyle]}>{confidence}%</Animated.Text>
          <Text style={[styles.confidenceText, { color: theme.textMuted }]}>
            {getConfidenceLabel(confidence)}
          </Text>
        </View>
      </View>
      
      <Animated.View style={[styles.meterGlowWrap, glowStyle]}>
        <View style={[styles.meterTrack, { backgroundColor: theme.backgroundSecondary }]}>
          <Animated.View
            style={[
              styles.meterFill,
              { backgroundColor: color },
              fillStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.innerGlow,
              { backgroundColor: glowColor },
              innerGlowStyle,
            ]}
          />
          {confidence >= 60 && (
            <View style={[styles.hotGlow, { backgroundColor: color, opacity: 0.1 + (confidence - 60) * 0.005 }]} />
          )}
        </View>
      </Animated.View>

      {confidence >= 50 && (
        <View style={styles.tickMarks}>
          {[25, 50, 75].map(tick => (
            <View
              key={tick}
              style={[
                styles.tick,
                { left: `${tick}%`, backgroundColor: color + '33' },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function ConfidenceMeter({ longConfidence, shortConfidence }: ConfidenceMeterProps) {
  const { theme } = useTheme();
  const accentColor = longConfidence > shortConfidence ? '#00ffaa' : shortConfidence > longConfidence ? '#ff0066' : theme.accent;
  const borderCol = accentColor + '44';
  const cornerCol = accentColor + 'aa';
  const lineCol = accentColor + '33';
  
  return (
    <View style={styles.outerWrapper}>
      <View style={styles.stippleConnector}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <View key={i} style={[styles.stippleDot, { backgroundColor: accentColor + '44' }]} />
        ))}
      </View>

      <View style={[styles.container, { borderColor: borderCol }]}>
        <View style={[styles.cornerTL, { borderColor: cornerCol }]} />
        <View style={[styles.cornerTR, { borderColor: cornerCol }]} />
        <View style={[styles.cornerBL, { borderColor: cornerCol }]} />
        <View style={[styles.cornerBR, { borderColor: cornerCol }]} />

        <View style={[styles.circuitLineTop, { backgroundColor: lineCol }]} />
        <View style={[styles.circuitDotTop, { backgroundColor: lineCol }]} />

        <View style={[styles.scanLine, { backgroundColor: accentColor + '06' }]} />

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.headerLabel, { color: accentColor + 'cc' }]}>SYS.CONFIDENCE</Text>
            <View style={[styles.headerLine, { backgroundColor: accentColor + '22' }]} />
            <Text style={[styles.headerStatus, { color: accentColor + '88' }]}>LIVE</Text>
          </View>
          
          <MeterBar
            label="LONG"
            confidence={longConfidence}
            color="#00ffaa"
            glowColor="rgba(0, 255, 170, 0.7)"
          />
          
          <MeterBar
            label="SHORT"
            confidence={shortConfidence}
            color="#ff0066"
            glowColor="rgba(255, 0, 102, 0.7)"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: 16,
    marginTop: 0,
    position: 'relative',
  },
  stippleConnector: {
    position: 'absolute',
    left: 20,
    top: -16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stippleDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  container: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cornerTL: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    zIndex: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderRightWidth: 2,
    zIndex: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    width: 14,
    height: 14,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    zIndex: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    zIndex: 2,
  },
  circuitLineTop: {
    position: 'absolute',
    top: 11,
    left: 0,
    width: 30,
    height: 1,
    zIndex: 1,
  },
  circuitDotTop: {
    position: 'absolute',
    top: 9,
    left: 28,
    width: 4,
    height: 4,
    borderRadius: 2,
    zIndex: 1,
  },
  scanLine: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 1,
  },
  content: {
    padding: 14,
    zIndex: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  headerLine: {
    flex: 1,
    height: 1,
  },
  headerStatus: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  meterContainer: {
    marginBottom: 14,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  meterLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  confidenceValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  confidencePercent: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  confidenceText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
  meterGlowWrap: {
    borderRadius: 4,
    marginVertical: 2,
  },
  meterTrack: {
    height: 10,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  meterFill: {
    height: '100%',
    borderRadius: 2,
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 2,
  },
  hotGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
    borderRadius: 2,
  },
  tickMarks: {
    position: 'relative',
    height: 4,
  },
  tick: {
    position: 'absolute',
    top: 1,
    width: 1,
    height: 3,
  },
});
