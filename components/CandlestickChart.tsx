import React, { useMemo, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, GestureResponderEvent, TouchableOpacity, Text } from 'react-native';
import Svg, { Rect, Line, G, Path, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Candle } from '@/lib/types';
import { useTheme } from '@/lib/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { AlertConfig } from '@/lib/alertsStorage';

interface CandlestickChartProps {
  candles: Candle[];
  height?: number;
  alerts?: AlertConfig[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = 8;
const PRICE_LABEL_WIDTH = 58;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING * 2;
const DRAW_AREA_WIDTH = CHART_WIDTH - PRICE_LABEL_WIDTH;

interface DrawLine {
  startY: number;
  endY: number;
  startPrice: number;
  endPrice: number;
}

const FIB_LEVELS = [
  { level: 0, label: '0%', color: '#666' },
  { level: 0.236, label: '23.6%', color: '#ff9800' },
  { level: 0.382, label: '38.2%', color: '#ffeb3b' },
  { level: 0.5, label: '50%', color: '#4caf50' },
  { level: 0.618, label: '61.8%', color: '#00bcd4' },
  { level: 0.786, label: '78.6%', color: '#2196f3' },
  { level: 1, label: '100%', color: '#666' },
];

export function CandlestickChart({ candles, height = 250, alerts = [] }: CandlestickChartProps) {
  const { theme } = useTheme();
  const [activeDraw, setActiveDraw] = useState<DrawLine | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [crosshairY, setCrosshairY] = useState<number | null>(null);
  const [showFib, setShowFib] = useState(false);
  const chartRef = useRef<View>(null);
  const chartLayoutRef = useRef({ y: 0 });
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visibleCount, setVisibleCount] = useState(candles.length);
  const [panOffset, setPanOffset] = useState(0);
  const isPinching = useRef(false);
  const pinchBaseDistance = useRef(0);
  const pinchBaseCount = useRef(0);
  const gestureMode = useRef<'none' | 'draw' | 'pan'>('none');
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const panStartOffset = useRef(0);

  const MIN_VISIBLE = 15;
  const MAX_VISIBLE = candles.length;
  const GESTURE_THRESHOLD = 8;

  React.useEffect(() => {
    setVisibleCount(candles.length);
    setPanOffset(0);
  }, [candles.length]);

  const visibleCandles = useMemo(() => {
    const count = Math.min(Math.max(visibleCount, MIN_VISIBLE), candles.length);
    const maxOffset = candles.length - count;
    const offset = Math.min(Math.max(panOffset, 0), maxOffset);
    const endIndex = candles.length - offset;
    const startIndex = Math.max(endIndex - count, 0);
    return candles.slice(startIndex, endIndex);
  }, [candles, visibleCount, panOffset]);

  const chartData = useMemo(() => {
    if (visibleCandles.length === 0) return { min: 0, max: 0, range: 1, elements: [], linePath: '' };

    const prices = visibleCandles.flatMap(c => [c.high, c.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const candleWidth = (DRAW_AREA_WIDTH - 20) / visibleCandles.length;

    const scaleY = (price: number) => {
      return height - 20 - ((price - min) / range) * (height - 40);
    };

    let linePath = '';

    const elements = visibleCandles.map((candle, index) => {
      const x = 10 + index * candleWidth;
      const isBullish = candle.close >= candle.open;

      const bodyTop = scaleY(Math.max(candle.open, candle.close));
      const bodyBottom = scaleY(Math.min(candle.open, candle.close));
      const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

      const wickTop = scaleY(candle.high);
      const wickBottom = scaleY(candle.low);

      const closeY = scaleY(candle.close);
      if (index === 0) {
        linePath = `M ${x + candleWidth / 2} ${closeY}`;
      } else {
        linePath += ` L ${x + candleWidth / 2} ${closeY}`;
      }

      return {
        key: index,
        x: x + candleWidth / 2,
        bodyX: x + 2,
        bodyY: bodyTop,
        bodyWidth: candleWidth - 4,
        bodyHeight,
        wickTop,
        wickBottom,
        isBullish,
      };
    });

    return { min, max, range, elements, linePath };
  }, [visibleCandles, height]);

  const scaleY = useCallback((price: number): number => {
    return height - 20 - ((price - chartData.min) / chartData.range) * (height - 40);
  }, [chartData.min, chartData.range, height]);

  const fibLevels = useMemo(() => {
    if (!showFib || candles.length === 0) return [];
    const swingHigh = chartData.max;
    const swingLow = chartData.min;
    const range = swingHigh - swingLow;

    return FIB_LEVELS.map(fib => {
      const price = swingHigh - range * fib.level;
      const y = scaleY(price);
      return { ...fib, price, y };
    });
  }, [showFib, candles.length, chartData.max, chartData.min, scaleY]);

  const priceFromY = useCallback((y: number): number => {
    const fraction = (height - 20 - y) / (height - 40);
    return chartData.min + fraction * chartData.range;
  }, [chartData.min, chartData.range, height]);

  const formatPrice = useCallback((price: number): string => {
    if (price >= 10000) return price.toFixed(0);
    if (price >= 100) return price.toFixed(1);
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(6);
  }, []);

  const formatDiff = useCallback((diff: number, pct: number): string => {
    const sign = diff >= 0 ? '+' : '';
    const absDiff = Math.abs(diff);
    let priceStr: string;
    if (absDiff >= 10000) priceStr = absDiff.toFixed(0);
    else if (absDiff >= 100) priceStr = absDiff.toFixed(1);
    else if (absDiff >= 1) priceStr = absDiff.toFixed(2);
    else if (absDiff >= 0.01) priceStr = absDiff.toFixed(4);
    else priceStr = absDiff.toFixed(6);
    return `${sign}${diff >= 0 ? '' : '-'}${priceStr} (${sign}${pct.toFixed(2)}%)`;
  }, []);

  const getTouchDistance = (touches: any[]): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt: GestureResponderEvent) => {
      const touches = evt.nativeEvent.touches;
      if (touches && touches.length >= 2) {
        isPinching.current = true;
        gestureMode.current = 'none';
        pinchBaseDistance.current = getTouchDistance(touches as any);
        pinchBaseCount.current = visibleCount;
        return;
      }
      isPinching.current = false;
      gestureMode.current = 'none';
      touchStartX.current = evt.nativeEvent.locationX;
      touchStartY.current = evt.nativeEvent.locationY;
      panStartOffset.current = panOffset;
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    },
    onPanResponderMove: (evt: GestureResponderEvent) => {
      const touches = evt.nativeEvent.touches;
      if (touches && touches.length >= 2) {
        if (!isPinching.current) {
          isPinching.current = true;
          gestureMode.current = 'none';
          pinchBaseDistance.current = getTouchDistance(touches as any);
          pinchBaseCount.current = visibleCount;
          setIsDrawing(false);
          setActiveDraw(null);
          setCrosshairY(null);
        }
        const dist = getTouchDistance(touches as any);
        if (pinchBaseDistance.current > 0) {
          const scale = pinchBaseDistance.current / dist;
          const newCount = Math.round(pinchBaseCount.current * scale);
          const clamped = Math.min(Math.max(newCount, MIN_VISIBLE), candles.length);
          setVisibleCount(clamped);
        }
        return;
      }
      if (isPinching.current) return;

      const dx = evt.nativeEvent.locationX - touchStartX.current;
      const dy = evt.nativeEvent.locationY - touchStartY.current;

      if (gestureMode.current === 'none') {
        if (Math.abs(dx) < GESTURE_THRESHOLD && Math.abs(dy) < GESTURE_THRESHOLD) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          gestureMode.current = 'pan';
        } else {
          gestureMode.current = 'draw';
          const clampedY = Math.max(20, Math.min(touchStartY.current, height - 20));
          setIsDrawing(true);
          setCrosshairY(clampedY);
          setActiveDraw({
            startY: clampedY,
            endY: clampedY,
            startPrice: priceFromY(clampedY),
            endPrice: priceFromY(clampedY),
          });
        }
      }

      if (gestureMode.current === 'pan') {
        const count = Math.min(Math.max(visibleCount, MIN_VISIBLE), candles.length);
        const pixelsPerCandle = (DRAW_AREA_WIDTH - 20) / count;
        const candleShift = Math.round(-dx / pixelsPerCandle);
        const maxOffset = candles.length - count;
        const newOffset = Math.min(Math.max(panStartOffset.current + candleShift, 0), maxOffset);
        setPanOffset(newOffset);
      } else if (gestureMode.current === 'draw') {
        const y = evt.nativeEvent.locationY;
        const clampedY = Math.max(20, Math.min(y, height - 20));
        setCrosshairY(clampedY);
        setActiveDraw(prev => {
          if (!prev) return null;
          return {
            ...prev,
            endY: clampedY,
            endPrice: priceFromY(clampedY),
          };
        });
      }
    },
    onPanResponderRelease: () => {
      if (isPinching.current) {
        isPinching.current = false;
        gestureMode.current = 'none';
        return;
      }
      if (gestureMode.current === 'draw') {
        setIsDrawing(false);
        fadeTimerRef.current = setTimeout(() => {
          setActiveDraw(null);
          setCrosshairY(null);
          fadeTimerRef.current = null;
        }, 3000);
      }
      gestureMode.current = 'none';
    },
  }), [height, priceFromY, visibleCount, candles.length, panOffset]);

  const gridLines = useMemo(() => {
    const lines = [];
    const count = 9;
    for (let i = 0; i < count; i++) {
      const y = 20 + (i * (height - 40)) / (count - 1);
      const price = priceFromY(y);
      lines.push({ y, price, key: i });
    }
    return lines;
  }, [height, priceFromY]);

  const alertLines = useMemo(() => {
    if (!alerts || alerts.length === 0 || chartData.range === 0) return [];
    const lines: { y: number; price: number; label: string; type: 'above' | 'below' }[] = [];
    alerts.forEach(alert => {
      if (!alert.enabled) return;
      if (alert.priceAbove != null && !isNaN(Number(alert.priceAbove))) {
        const p = Number(alert.priceAbove);
        if (p >= chartData.min && p <= chartData.max) {
          lines.push({ y: scaleY(p), price: p, label: formatPrice(p), type: 'above' });
        }
      }
      if (alert.priceBelow != null && !isNaN(Number(alert.priceBelow))) {
        const p = Number(alert.priceBelow);
        if (p >= chartData.min && p <= chartData.max) {
          lines.push({ y: scaleY(p), price: p, label: formatPrice(p), type: 'below' });
        }
      }
    });
    return lines;
  }, [alerts, chartData.min, chartData.max, chartData.range, scaleY, formatPrice]);

  const hasMoved = activeDraw ? Math.abs(activeDraw.endY - activeDraw.startY) > 5 : false;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.toolBar}>
        <TouchableOpacity
          style={[
            styles.fibButton,
            { 
              backgroundColor: showFib ? theme.accent + '30' : theme.backgroundSecondary,
              borderColor: showFib ? theme.accent : theme.textSecondary + '50',
            },
          ]}
          onPress={() => setShowFib(!showFib)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={showFib ? 'git-network' : 'git-network-outline'} 
            size={14} 
            color={showFib ? theme.accent : theme.textSecondary} 
          />
          <Text style={[styles.fibButtonText, { color: showFib ? theme.accent : theme.textSecondary }]}>
            FIB
          </Text>
        </TouchableOpacity>
      </View>
      <View {...panResponder.panHandlers} style={{ height }} ref={chartRef}>
        <Svg width={CHART_WIDTH} height={height}>
          <Defs>
            <LinearGradient id="drawLineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={theme.accent} stopOpacity="0.1" />
              <Stop offset="0.5" stopColor={theme.accent} stopOpacity="0.25" />
              <Stop offset="1" stopColor={theme.accent} stopOpacity="0.1" />
            </LinearGradient>
          </Defs>

          {gridLines.map(gl => {
            const tooCloseToFib = fibLevels.some(fib => Math.abs(fib.y - gl.y) < 14);
            return (
              <G key={gl.key}>
                <Line
                  x1={10}
                  y1={gl.y}
                  x2={DRAW_AREA_WIDTH - 4}
                  y2={gl.y}
                  stroke={theme.gridLine}
                  strokeWidth={0.5}
                  strokeDasharray="2,4"
                />
                {!tooCloseToFib && (
                  <SvgText
                    x={DRAW_AREA_WIDTH + 4}
                    y={gl.y + 3}
                    fontSize={9}
                    fill={theme.textSecondary}
                    fontFamily="Inter_400Regular"
                    textAnchor="start"
                  >
                    {formatPrice(gl.price)}
                  </SvgText>
                )}
              </G>
            );
          })}

          {fibLevels.map((fib, idx) => (
            <G key={`fib-${idx}`}>
              <Line
                x1={10}
                y1={fib.y}
                x2={DRAW_AREA_WIDTH - 4}
                y2={fib.y}
                stroke={fib.color}
                strokeWidth={1.5}
                strokeDasharray="8,4"
                opacity={0.85}
              />
              <Rect
                x={10}
                y={fib.y - 9}
                width={46}
                height={18}
                rx={4}
                fill={fib.color}
                opacity={0.25}
              />
              <Rect
                x={10}
                y={fib.y - 9}
                width={46}
                height={18}
                rx={4}
                fill="none"
                stroke={fib.color}
                strokeWidth={0.5}
                opacity={0.5}
              />
              <SvgText
                x={14}
                y={fib.y + 4}
                fontSize={9}
                fill={fib.color}
                fontWeight="bold"
              >
                {fib.label}
              </SvgText>
              <SvgText
                x={DRAW_AREA_WIDTH + 4}
                y={fib.y + 4}
                fontSize={9}
                fill={fib.color}
                fontWeight="bold"
                textAnchor="start"
              >
                {formatPrice(fib.price)}
              </SvgText>
            </G>
          ))}

          {alertLines.map((al, idx) => {
            const color = al.type === 'above' ? '#ff9900' : '#ff3366';
            return (
              <G key={`alert-${idx}`}>
                <Line
                  x1={10}
                  y1={al.y}
                  x2={DRAW_AREA_WIDTH - 4}
                  y2={al.y}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="6,4"
                  opacity={0.85}
                />
                <Rect
                  x={DRAW_AREA_WIDTH - 2}
                  y={al.y - 9}
                  width={PRICE_LABEL_WIDTH + 2}
                  height={18}
                  rx={3}
                  fill={color}
                  opacity={0.9}
                />
                <SvgText
                  x={DRAW_AREA_WIDTH + PRICE_LABEL_WIDTH / 2}
                  y={al.y + 3.5}
                  fontSize={9}
                  fill="#000"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {al.label}
                </SvgText>
                <Circle
                  cx={6}
                  cy={al.y}
                  r={4}
                  fill={color}
                  opacity={0.9}
                />
                <SvgText
                  x={14}
                  y={al.y - 6}
                  fontSize={8}
                  fill={color}
                  fontWeight="bold"
                  opacity={0.9}
                >
                  {al.type === 'above' ? 'ABOVE' : 'BELOW'}
                </SvgText>
              </G>
            );
          })}

          {theme.chartType === 'line' ? (
            <Path
              d={chartData.linePath}
              stroke={theme.bullish}
              strokeWidth={2}
              fill="none"
            />
          ) : (
            <G>
              {chartData.elements.map(el => (
                <G key={el.key}>
                  <Line
                    x1={el.x}
                    y1={el.wickTop}
                    x2={el.x}
                    y2={el.wickBottom}
                    stroke={el.isBullish ? theme.bullish : theme.bearish}
                    strokeWidth={1}
                  />
                  <Rect
                    x={el.bodyX}
                    y={el.bodyY}
                    width={el.bodyWidth}
                    height={el.bodyHeight}
                    fill={el.isBullish ? theme.bullishFill : theme.bearishFill}
                    stroke={el.isBullish ? theme.bullish : theme.bearish}
                    strokeWidth={el.isBullish ? 1.5 : 0}
                  />
                </G>
              ))}
            </G>
          )}

          {crosshairY !== null && activeDraw && (
            <G>
              <Line
                x1={0}
                y1={activeDraw.startY}
                x2={DRAW_AREA_WIDTH}
                y2={activeDraw.startY}
                stroke={theme.accent}
                strokeWidth={1}
                strokeDasharray="4,3"
                opacity={0.9}
              />

              <Rect
                x={DRAW_AREA_WIDTH - 2}
                y={activeDraw.startY - 9}
                width={PRICE_LABEL_WIDTH + 2}
                height={18}
                rx={3}
                fill={theme.accent}
                opacity={0.95}
              />
              <SvgText
                x={DRAW_AREA_WIDTH + PRICE_LABEL_WIDTH / 2}
                y={activeDraw.startY + 3.5}
                fontSize={9}
                fill="#000"
                fontWeight="bold"
                textAnchor="middle"
              >
                {formatPrice(activeDraw.startPrice)}
              </SvgText>

              <Circle
                cx={10}
                cy={activeDraw.startY}
                r={3}
                fill={theme.accent}
              />

              {hasMoved && (
                <G>
                  {(() => {
                    const minY = Math.min(activeDraw.startY, activeDraw.endY);
                    const maxY = Math.max(activeDraw.startY, activeDraw.endY);
                    const rectHeight = maxY - minY;
                    return (
                      <Rect
                        x={0}
                        y={minY}
                        width={DRAW_AREA_WIDTH}
                        height={rectHeight}
                        fill="url(#drawLineGrad)"
                      />
                    );
                  })()}

                  <Line
                    x1={0}
                    y1={activeDraw.endY}
                    x2={DRAW_AREA_WIDTH}
                    y2={activeDraw.endY}
                    stroke={activeDraw.endPrice >= activeDraw.startPrice ? '#00ffaa' : '#ff0066'}
                    strokeWidth={1}
                    strokeDasharray="4,3"
                    opacity={0.9}
                  />

                  <Rect
                    x={DRAW_AREA_WIDTH - 2}
                    y={activeDraw.endY - 9}
                    width={PRICE_LABEL_WIDTH + 2}
                    height={18}
                    rx={3}
                    fill={activeDraw.endPrice >= activeDraw.startPrice ? '#00ffaa' : '#ff0066'}
                    opacity={0.95}
                  />
                  <SvgText
                    x={DRAW_AREA_WIDTH + PRICE_LABEL_WIDTH / 2}
                    y={activeDraw.endY + 3.5}
                    fontSize={9}
                    fill="#000"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {formatPrice(activeDraw.endPrice)}
                  </SvgText>

                  <Circle
                    cx={10}
                    cy={activeDraw.endY}
                    r={3}
                    fill={activeDraw.endPrice >= activeDraw.startPrice ? '#00ffaa' : '#ff0066'}
                  />

                  {(() => {
                    const diff = activeDraw.endPrice - activeDraw.startPrice;
                    const pct = (diff / activeDraw.startPrice) * 100;
                    const midY = (activeDraw.startY + activeDraw.endY) / 2;
                    const diffColor = diff >= 0 ? '#00ffaa' : '#ff0066';
                    const labelText = formatDiff(diff, pct);
                    return (
                      <G>
                        <Rect
                          x={DRAW_AREA_WIDTH / 2 - 64}
                          y={midY - 12}
                          width={128}
                          height={24}
                          rx={12}
                          fill={diffColor}
                          opacity={0.15}
                        />
                        <Rect
                          x={DRAW_AREA_WIDTH / 2 - 64}
                          y={midY - 12}
                          width={128}
                          height={24}
                          rx={12}
                          fill="none"
                          stroke={diffColor}
                          strokeWidth={1}
                          opacity={0.5}
                        />
                        <SvgText
                          x={DRAW_AREA_WIDTH / 2}
                          y={midY + 4}
                          fontSize={11}
                          fill={diffColor}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {labelText}
                        </SvgText>
                      </G>
                    );
                  })()}
                </G>
              )}
            </G>
          )}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: CHART_PADDING,
  },
  toolBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  fibButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  fibButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
});
