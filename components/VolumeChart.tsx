import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, G } from 'react-native-svg';
import { Candle } from '@/lib/types';
import { useTheme } from '@/lib/ThemeContext';

interface VolumeChartProps {
  candles: Candle[];
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = 8;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING * 2;

export function VolumeChart({ candles, height = 50 }: VolumeChartProps) {
  const { theme } = useTheme();
  
  const chartData = useMemo(() => {
    if (candles.length === 0) return null;
    
    const volumes = candles.map(c => c.volume);
    const maxVolume = Math.max(...volumes);
    const chartHeight = height - 24;
    const barWidth = (CHART_WIDTH - 20) / candles.length - 1;
    
    const bars = candles.map((candle, index) => {
      const x = 10 + index * ((CHART_WIDTH - 20) / candles.length);
      const barHeight = (candle.volume / maxVolume) * chartHeight;
      const isBullish = candle.close >= candle.open;
      
      return {
        x,
        y: chartHeight - barHeight,
        width: Math.max(barWidth, 2),
        height: barHeight,
        isBullish,
      };
    });
    
    return { bars };
  }, [candles, height]);
  
  if (!chartData) return null;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>VOLUME</Text>
        <View style={[styles.labelBadge, { backgroundColor: theme.backgroundTertiary, borderColor: theme.cardBorder }]}>
          <Text style={[styles.labelText, { color: theme.accent }]}>VOL</Text>
        </View>
      </View>
      <Svg width={CHART_WIDTH} height={height - 24}>
        <G>
          {chartData.bars.map((bar, i) => (
            <Rect
              key={i}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.isBullish ? theme.indicatorVolume : theme.bearish}
              opacity={0.5}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: CHART_PADDING,
    paddingTop: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  labelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  labelText: {
    fontSize: 8,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});
