import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/ThemeContext';

interface SignalExplainerProps {
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
  longConfidence: number;
  shortConfidence: number;
  rsi?: number;
  macd?: { macd: number; signal: number; histogram: number };
  adx?: { adx: number; plusDI: number; minusDI: number };
  bop?: number;
}

export function SignalExplainer({ signal, longConfidence, shortConfidence, rsi, macd, adx, bop }: SignalExplainerProps) {
  const { theme } = useTheme();
  
  const getSignalColor = () => {
    if (signal === 'LONG') return '#00ffaa';
    if (signal === 'SHORT') return '#ff0066';
    return theme.textSecondary;
  };
  
  const getExplanations = (): { factor: string; impact: 'bullish' | 'bearish' | 'neutral'; explanation: string }[] => {
    const explanations: { factor: string; impact: 'bullish' | 'bearish' | 'neutral'; explanation: string }[] = [];
    
    if (rsi !== undefined) {
      if (rsi > 70) {
        explanations.push({
          factor: `RSI at ${rsi.toFixed(1)}`,
          impact: 'bearish',
          explanation: 'Overbought territory. Price has risen quickly and may be due for a pullback. Buyers are exhausted.',
        });
      } else if (rsi < 30) {
        explanations.push({
          factor: `RSI at ${rsi.toFixed(1)}`,
          impact: 'bullish',
          explanation: 'Oversold territory. Price has dropped significantly and may bounce. Sellers are exhausted.',
        });
      } else if (rsi > 50) {
        explanations.push({
          factor: `RSI at ${rsi.toFixed(1)}`,
          impact: 'bullish',
          explanation: 'Above midline shows buying momentum is stronger than selling pressure.',
        });
      } else {
        explanations.push({
          factor: `RSI at ${rsi.toFixed(1)}`,
          impact: 'bearish',
          explanation: 'Below midline shows selling momentum is currently stronger than buying pressure.',
        });
      }
    }
    
    if (macd) {
      if (macd.histogram > 0 && macd.macd > macd.signal) {
        explanations.push({
          factor: 'MACD above signal line',
          impact: 'bullish',
          explanation: `Histogram positive at ${macd.histogram.toFixed(4)}. Upward momentum is building as faster EMA leads slower EMA.`,
        });
      } else if (macd.histogram < 0 && macd.macd < macd.signal) {
        explanations.push({
          factor: 'MACD below signal line',
          impact: 'bearish',
          explanation: `Histogram negative at ${macd.histogram.toFixed(4)}. Downward momentum building as faster EMA trails slower EMA.`,
        });
      } else {
        explanations.push({
          factor: 'MACD near crossover',
          impact: 'neutral',
          explanation: 'MACD and signal lines are converging. Watch for a crossover which could signal trend change.',
        });
      }
    }
    
    if (adx) {
      const trendDirection = adx.plusDI > adx.minusDI ? 'bullish' : 'bearish';
      if (adx.adx > 25) {
        explanations.push({
          factor: `ADX at ${adx.adx.toFixed(1)} (strong trend)`,
          impact: trendDirection,
          explanation: `Strong ${trendDirection === 'bullish' ? 'upward' : 'downward'} trend. +DI (${adx.plusDI.toFixed(1)}) ${adx.plusDI > adx.minusDI ? '>' : '<'} -DI (${adx.minusDI.toFixed(1)}).`,
        });
      } else if (adx.adx < 20) {
        explanations.push({
          factor: `ADX at ${adx.adx.toFixed(1)} (no trend)`,
          impact: 'neutral',
          explanation: 'No significant trend present. Market is ranging. Trend-following strategies may give false signals.',
        });
      } else {
        explanations.push({
          factor: `ADX at ${adx.adx.toFixed(1)} (developing)`,
          impact: trendDirection,
          explanation: 'Trend may be developing. Wait for ADX above 25 to confirm direction.',
        });
      }
    }
    
    if (bop !== undefined) {
      if (bop > 0.3) {
        explanations.push({
          factor: `Balance of Power: ${bop.toFixed(2)}`,
          impact: 'bullish',
          explanation: 'Buyers are in control. Price is closing near highs relative to the range.',
        });
      } else if (bop < -0.3) {
        explanations.push({
          factor: `Balance of Power: ${bop.toFixed(2)}`,
          impact: 'bearish',
          explanation: 'Sellers are in control. Price is closing near lows relative to the range.',
        });
      } else {
        explanations.push({
          factor: `Balance of Power: ${bop.toFixed(2)}`,
          impact: 'neutral',
          explanation: 'Balanced between buyers and sellers. No clear dominance.',
        });
      }
    }
    
    return explanations;
  };
  
  const explanations = getExplanations();
  const sigColor = getSignalColor();
  
  return (
    <View style={styles.outerWrapper}>
      <View style={[styles.container, { borderColor: '#ff0044' }]}>
        <View style={[styles.cornerTL, { borderColor: '#ff0044' }]} />
        <View style={[styles.cornerTR, { borderColor: '#ff0044' }]} />
        <View style={[styles.cornerBL, { borderColor: '#ff0044' }]} />
        <View style={[styles.cornerBR, { borderColor: '#ff0044' }]} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.scanDot, { backgroundColor: '#ff0044' }]} />
            <Text style={[styles.headerLabel, { color: '#ff0044cc' }]}>SIG.DECODE</Text>
            <View style={[styles.headerLine, { backgroundColor: '#ff004422' }]} />
            <Text style={[styles.headerStatus, { color: '#ff004488' }]}>LIVE</Text>
          </View>
          <View style={[styles.signalBadge, { backgroundColor: sigColor + '20', borderColor: sigColor }]}>
            <Text style={[styles.signalText, { color: sigColor }]}>{signal}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.confidenceSummary}>
            <Text style={[styles.confidenceLabel, { color: theme.textMuted }]}>
              Long: <Text style={{ color: '#00ffaa' }}>{longConfidence}%</Text>  |  Short: <Text style={{ color: '#ff0066' }}>{shortConfidence}%</Text>
            </Text>
          </View>
          
          {explanations.map((exp, index) => (
            <View style={styles.explanationItem} key={index}>
              <View style={styles.factorRow}>
                <View style={[styles.impactDot, { 
                  backgroundColor: exp.impact === 'bullish' ? '#00ffaa' : exp.impact === 'bearish' ? '#ff0066' : theme.textMuted 
                }]} />
                <Ionicons 
                  name={exp.impact === 'bullish' ? 'arrow-up-circle' : exp.impact === 'bearish' ? 'arrow-down-circle' : 'remove-circle'} 
                  size={14} 
                  color={exp.impact === 'bullish' ? '#00ffaa' : exp.impact === 'bearish' ? '#ff0066' : theme.textMuted} 
                />
                <Text style={[styles.factorText, { color: theme.text }]}>{exp.factor}</Text>
              </View>
              <Text style={[styles.explanationText, { color: theme.textSecondary }]}>{exp.explanation}</Text>
              {index < explanations.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
          
          <Text style={[styles.disclaimer, { color: '#ff004466' }]}>
            // These indicators together influenced the AI's confidence scores and final signal recommendation.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: 16,
  },
  container: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 0, 68, 0.04)',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: '#ff0044',
    zIndex: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: '#ff0044',
    zIndex: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#ff0044',
    zIndex: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#ff0044',
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerLine: {
    width: 20,
    height: 1,
  },
  headerStatus: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  signalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  signalText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  confidenceSummary: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 68, 0.12)',
  },
  confidenceLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.3,
  },
  explanationItem: {
    marginBottom: 4,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  impactDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  factorText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  explanationText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
    paddingLeft: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 0, 68, 0.08)',
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 24,
  },
  disclaimer: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    marginTop: 10,
    letterSpacing: 0.3,
  },
});
