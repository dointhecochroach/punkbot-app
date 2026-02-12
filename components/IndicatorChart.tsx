import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Rect, Line, G } from 'react-native-svg';
import { useTheme } from '@/lib/ThemeContext';

interface IndicatorChartProps {
  title: string;
  label: string;
  data: number[];
  data2?: number[];
  data3?: number[];
  histogramData?: number[];
  color: string;
  color2?: string;
  color3?: string;
  height?: number;
  showZeroLine?: boolean;
  alertBadge?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = 8;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING * 2;

export function IndicatorChart({
  title,
  label,
  data,
  data2,
  data3,
  histogramData,
  color,
  color2,
  color3,
  height = 60,
  showZeroLine = false,
  alertBadge,
}: IndicatorChartProps) {
  const { theme } = useTheme();
  
  const chartData = useMemo(() => {
    if (data.length === 0) return null;
    
    const allValues = [
      ...data,
      ...(data2 || []),
      ...(data3 || []),
      ...(histogramData || []),
    ].filter(v => isFinite(v));
    
    let min = Math.min(...allValues);
    let max = Math.max(...allValues);
    
    if (showZeroLine) {
      min = Math.min(min, 0);
      max = Math.max(max, 0);
    }
    
    const range = max - min || 1;
    const chartHeight = height - 28;
    
    const scaleY = (value: number) => {
      return chartHeight - ((value - min) / range) * chartHeight;
    };
    
    const xStep = (CHART_WIDTH - 20) / (data.length - 1 || 1);
    
    const createPath = (values: number[]) => {
      let path = '';
      values.forEach((value, index) => {
        const x = 10 + index * xStep;
        const y = scaleY(value);
        if (index === 0) {
          path += `M ${x} ${y}`;
        } else {
          path += ` L ${x} ${y}`;
        }
      });
      return path;
    };
    
    const zeroY = showZeroLine ? scaleY(0) : null;
    
    const barWidth = Math.max((CHART_WIDTH - 20) / data.length - 1, 2);
    
    const histogramBars = histogramData?.map((value, index) => {
      const x = 10 + index * ((CHART_WIDTH - 20) / histogramData.length);
      const y = scaleY(value);
      const y0 = scaleY(0);
      return {
        x,
        y: value >= 0 ? y : y0,
        height: Math.abs(y - y0),
        isPositive: value >= 0,
      };
    });
    
    return {
      path1: createPath(data),
      path2: data2 ? createPath(data2) : null,
      path3: data3 ? createPath(data3) : null,
      zeroY,
      histogramBars,
      barWidth,
    };
  }, [data, data2, data3, histogramData, height, showZeroLine]);
  
  if (!chartData) return null;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {alertBadge && (
            <View style={[styles.labelBadge, { backgroundColor: '#ff990025', borderColor: '#ff9900' }]}>
              <Text style={[styles.labelText, { color: '#ff9900' }]}>{alertBadge}</Text>
            </View>
          )}
          <View style={[styles.labelBadge, { backgroundColor: theme.backgroundTertiary, borderColor: theme.cardBorder }]}>
            <Text style={[styles.labelText, { color: theme.accent }]}>{label}</Text>
          </View>
        </View>
      </View>
      <Svg width={CHART_WIDTH} height={height - 24}>
        <G>
          {chartData.zeroY !== null && (
            <Line
              x1={10}
              y1={chartData.zeroY}
              x2={CHART_WIDTH - 10}
              y2={chartData.zeroY}
              stroke={theme.divider}
              strokeWidth={0.5}
              strokeDasharray="2,4"
            />
          )}
          {chartData.histogramBars?.map((bar, i) => (
            <Rect
              key={i}
              x={bar.x}
              y={bar.y}
              width={chartData.barWidth}
              height={bar.height}
              fill={bar.isPositive ? theme.indicatorHistogramPos : theme.indicatorHistogramNeg}
              opacity={0.6}
            />
          ))}
          <Path
            d={chartData.path1}
            stroke={color}
            strokeWidth={1.5}
            fill="none"
          />
          {chartData.path2 && color2 && (
            <Path
              d={chartData.path2}
              stroke={color2}
              strokeWidth={1.5}
              fill="none"
            />
          )}
          {chartData.path3 && color3 && (
            <Path
              d={chartData.path3}
              stroke={color3}
              strokeWidth={1}
              fill="none"
              strokeDasharray="3,3"
            />
          )}
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
