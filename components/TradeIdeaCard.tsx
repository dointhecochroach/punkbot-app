import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/ThemeContext';

const BLUE = '#00aaff';
const BLUE_BRIGHT = '#33ccff';
const BLUE_DIM = '#005588';
const BLUE_GLOW = '#0088dd';
const VAPOR_PURPLE = '#bf5af2';
const VAPOR_CYAN = '#64d2ff';
const VAPOR_PINK = '#ff6ec7';

interface SocialPlatformData {
  score: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface SocialSentimentData {
  reddit?: SocialPlatformData;
  twitter?: SocialPlatformData;
  telegram?: SocialPlatformData;
  discord?: SocialPlatformData;
  youtube?: SocialPlatformData;
}

export interface TradeIdea {
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: string;
  reasoning: string;
  confidence: number;
  qualityScore: number;
  qualityFactors: string[];
  keyLevels: string[];
  warnings: string[];
  socialSentiment?: SocialSentimentData;
  fearGreedValue?: number | null;
  fearGreedLabel?: string | null;
  finalVerdict?: string;
}

interface TradeIdeaCardProps {
  idea: TradeIdea | null;
  isLoading: boolean;
  currentPrice: number | null;
  onGenerate: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  reddit: VAPOR_PINK,
  twitter: VAPOR_CYAN,
  telegram: VAPOR_CYAN,
  discord: VAPOR_PURPLE,
  youtube: VAPOR_PINK,
};

function MiniLogo({ platform, color, size = 16 }: { platform: string; color: string; size?: number }) {
  switch (platform) {
    case 'reddit':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.2" opacity={0.3} />
          <Path d="M19.5 12a1.5 1.5 0 0 0-2.56-1.06 7.4 7.4 0 0 0-4.06-1.27l.69-3.26 2.26.48a1.07 1.07 0 1 0 .11-.52l-2.53-.54a.27.27 0 0 0-.31.2l-.77 3.64a7.4 7.4 0 0 0-4.14 1.27A1.5 1.5 0 1 0 6.2 13.06a3 3 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a3 3 0 0 0 0-.44A1.5 1.5 0 0 0 19.5 12z" fill="none" stroke={color} strokeWidth="0.8" />
        </Svg>
      );
    case 'twitter':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.2" opacity={0.3} />
          <Path d="M13.31 11.02L17.57 6h-1.01l-3.7 4.36L10.16 6H6.5l4.47 6.59L6.5 18h1.01l3.91-4.61L14.34 18H18l-4.69-6.98z" fill="none" stroke={color} strokeWidth="0.6" />
        </Svg>
      );
    case 'telegram':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.2" opacity={0.3} />
          <Path d="M17.5 7.2L15.3 17.8c-.16.73-.6.91-1.21.57l-3.35-2.47-1.62 1.55c-.18.18-.33.33-.67.33l.24-3.4L15.5 8.2c.3-.27-.07-.42-.47-.16l-8.53 5.37-3.67-1.15c-.8-.25-.81-.8.17-1.18l14.34-5.52c.66-.25 1.24.16 1.03 1.18l.13-.54z" fill="none" stroke={color} strokeWidth="0.8" />
        </Svg>
      );
    case 'discord':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.2" opacity={0.3} />
          <Path d="M16.94 8.11A12.3 12.3 0 0 0 13.91 7c-.13.23-.27.54-.37.78a11.4 11.4 0 0 0-3.42 0A8 8 0 0 0 9.74 7a12.3 12.3 0 0 0-3.03 1.11C5.07 10.37 4.6 12.57 4.84 14.74a12.4 12.4 0 0 0 3.74 1.89c.29-.39.55-.8.77-1.24a8.2 8.2 0 0 1-1.17-.56c.08-.06.16-.12.23-.18 2.45 1.12 5.1 1.12 7.52 0 .08.06.16.12.23.18-.37.22-.76.4-1.17.56.23.44.48.85.77 1.24a12.4 12.4 0 0 0 3.74-1.89c.28-2.47-.47-4.62-1.97-6.52z" fill="none" stroke={color} strokeWidth="0.6" />
        </Svg>
      );
    case 'youtube':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.2" opacity={0.3} />
          <Path d="M18.68 9.22a2 2 0 0 0-1.4-1.42C16.12 7.5 12 7.5 12 7.5s-4.12 0-5.28.3a2 2 0 0 0-1.4 1.42A21 21 0 0 0 5 12a21 21 0 0 0 .32 2.78 2 2 0 0 0 1.4 1.42c1.16.3 5.28.3 5.28.3s4.12 0 5.28-.3a2 2 0 0 0 1.4-1.42A21 21 0 0 0 19 12a21 21 0 0 0-.32-2.78z" fill="none" stroke={color} strokeWidth="0.8" />
          <Path d="M10.5 14.25l3.5-2.25-3.5-2.25v4.5z" fill={color} opacity={0.6} />
        </Svg>
      );
    default:
      return null;
  }
}

function SocialMiniCard({ platform, data }: { platform: string; data: SocialPlatformData }) {
  const platformColor = PLATFORM_COLORS[platform] || VAPOR_PURPLE;
  const sentimentColor = data.sentiment === 'bullish' ? '#00ffaa' : data.sentiment === 'bearish' ? '#ff0066' : '#ffaa00';

  return (
    <View style={[styles.socialCard, { borderColor: platformColor + '22' }]}>
      <MiniLogo platform={platform} color={platformColor} size={16} />
      <Text style={[styles.socialScore, { color: sentimentColor }]}>{data.score}</Text>
      <Text style={[styles.socialSentimentText, { color: sentimentColor + '88' }]}>
        {data.sentiment.toUpperCase()}
      </Text>
    </View>
  );
}

function getFearGreedColor(value: number): string {
  if (value <= 25) return '#ff0044';
  if (value <= 45) return '#ff6600';
  if (value <= 55) return '#ffaa00';
  if (value <= 75) return '#88ff00';
  return '#00ffaa';
}

function StippleConnectorRight() {
  return (
    <View style={styles.stippleRight}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <View key={i} style={[styles.stippleDot, { backgroundColor: BLUE + '55' }]} />
      ))}
    </View>
  );
}

function AnimatedRow({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-14);
  const scale = useSharedValue(0.97);

  useEffect(() => {
    const delay = 200 + index * 140;
    opacity.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
    scale.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export function TradeIdeaCard({ idea, isLoading, currentPrice, onGenerate }: TradeIdeaCardProps) {
  const { theme } = useTheme();
  const [showIdea, setShowIdea] = useState(!!idea);
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0);
  const unfoldHeight = useSharedValue(0);
  const unfoldOpacity = useSharedValue(0);

  useEffect(() => {
    if (idea) {
      unfoldHeight.value = 0;
      unfoldOpacity.value = 0;
      setShowIdea(true);
      unfoldHeight.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
      unfoldOpacity.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));
    }
  }, [idea]);

  const unfoldStyle = useAnimatedStyle(() => ({
    maxHeight: unfoldHeight.value === 0 ? 0 : unfoldHeight.value * 2000,
    opacity: unfoldOpacity.value,
    overflow: 'hidden' as const,
  }));

  useEffect(() => {
    if (isLoading) {
      buttonGlow.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) })
      );
    } else {
      buttonGlow.value = withTiming(0, { duration: 300 });
    }
  }, [isLoading]);

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toFixed(price < 1 ? 6 : 4);
  };

  const getDirectionColor = () => {
    if (!idea) return BLUE;
    return idea.direction === 'LONG' ? '#00ffaa' : '#ff0066';
  };

  const getQualityLabel = (score: number): string => {
    switch (score) {
      case 5: return 'EXCELLENT';
      case 4: return 'VERY GOOD';
      case 3: return 'GOOD';
      case 2: return 'FAIR';
      default: return 'POOR';
    }
  };

  const getQualityColor = (score: number): string => {
    if (score >= 4) return '#00ffaa';
    if (score === 3) return '#ffaa00';
    return '#ff6644';
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    setShowIdea(false);
    onGenerate();
  };

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonGlowStyle = useAnimatedStyle(() => ({
    shadowColor: BLUE_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: buttonGlow.value * 0.8,
    shadowRadius: 12 + buttonGlow.value * 12,
    elevation: buttonGlow.value > 0.2 ? 8 : 0,
  }));

  const dirColor = getDirectionColor();

  return (
    <View style={styles.outerWrapper}>
      <StippleConnectorRight />

      <View style={[styles.container, { borderColor: BLUE + '44' }]}>
        <View style={[styles.cornerTL, { borderColor: BLUE_BRIGHT }]} />
        <View style={[styles.cornerTR, { borderColor: BLUE_BRIGHT }]} />
        <View style={[styles.cornerBL, { borderColor: BLUE_BRIGHT }]} />
        <View style={[styles.cornerBR, { borderColor: BLUE_BRIGHT }]} />

        <View style={[styles.circuitLineLeft, { backgroundColor: BLUE + '33' }]} />
        <View style={[styles.circuitDotLeft, { backgroundColor: BLUE + '55' }]} />
        <View style={[styles.circuitLineBottom, { backgroundColor: BLUE + '22' }]} />

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.statusDot, { backgroundColor: isLoading ? '#ffaa00' : BLUE }]} />
            <Text style={[styles.headerLabel, { color: BLUE + 'cc' }]}>SYS.TRADE</Text>
            <View style={[styles.headerLine, { backgroundColor: BLUE + '22' }]} />
            <Text style={[styles.headerStatus, { color: isLoading ? '#ffaa0088' : BLUE + '88' }]}>
              {isLoading ? 'CALC' : showIdea && idea ? 'READY' : 'IDLE'}
            </Text>
          </View>

          <Animated.View style={[buttonAnimStyle, buttonGlowStyle]}>
            <Pressable
              style={[
                styles.generateButton,
                { backgroundColor: BLUE },
                isLoading && styles.buttonLoading,
              ]}
              onPress={handlePress}
              disabled={isLoading}
            >
              <Ionicons name="rocket" size={16} color="#000" />
              <Text style={styles.buttonText}>
                {isLoading ? 'Calculating...' : 'Punk a Trade Idea'}
              </Text>
            </Pressable>
          </Animated.View>

          {showIdea && idea && (
            <Animated.View style={[styles.ideaContent, unfoldStyle]}>
              <AnimatedRow index={0}>
                <View style={[styles.directionBadge, { backgroundColor: dirColor + '12', borderColor: dirColor + '44' }]}>
                  <Ionicons
                    name={idea.direction === 'LONG' ? 'trending-up' : 'trending-down'}
                    size={18}
                    color={dirColor}
                  />
                  <Text style={[styles.directionText, { color: dirColor }]}>
                    {idea.direction} TRADE
                  </Text>
                  <View style={[styles.confidencePill, { backgroundColor: dirColor + '18' }]}>
                    <Text style={[styles.confidenceText, { color: dirColor }]}>{idea.confidence}%</Text>
                  </View>
                </View>
              </AnimatedRow>

              <AnimatedRow index={1}>
                <View style={styles.priceGrid}>
                  <View style={[styles.priceRow, { borderColor: BLUE + '44', backgroundColor: BLUE + '08' }]}>
                    <View style={styles.priceLabel}>
                      <View style={[styles.priceDot, { backgroundColor: BLUE }]} />
                      <Text style={[styles.priceLabelText, { color: BLUE }]}>ENTRY</Text>
                    </View>
                    <Text style={[styles.priceValue, { color: BLUE_BRIGHT }]}>${formatPrice(idea.entryPrice)}</Text>
                  </View>

                  <View style={[styles.priceRow, { borderColor: '#ff006633', backgroundColor: '#ff006608' }]}>
                    <View style={styles.priceLabel}>
                      <View style={[styles.priceDot, { backgroundColor: '#ff0066' }]} />
                      <Text style={[styles.priceLabelText, { color: '#ff0066' }]}>STOP LOSS</Text>
                    </View>
                    <Text style={[styles.priceValue, { color: '#ff4488' }]}>${formatPrice(idea.stopLoss)}</Text>
                  </View>

                  {[
                    { label: 'TP 1 (33%)', price: idea.takeProfit1, shade: '#00ffaa' },
                    { label: 'TP 2 (33%)', price: idea.takeProfit2, shade: '#00ddaa' },
                    { label: 'TP 3 (34%)', price: idea.takeProfit3, shade: '#00bbaa' },
                  ].map((tp, i) => (
                    <View key={i} style={[styles.priceRow, { borderColor: tp.shade + '33', backgroundColor: tp.shade + '08' }]}>
                      <View style={styles.priceLabel}>
                        <View style={[styles.priceDot, { backgroundColor: tp.shade }]} />
                        <Text style={[styles.priceLabelText, { color: tp.shade }]}>{tp.label}</Text>
                      </View>
                      <Text style={[styles.priceValue, { color: tp.shade }]}>${formatPrice(tp.price)}</Text>
                    </View>
                  ))}
                </View>
              </AnimatedRow>

              <AnimatedRow index={2}>
                <View style={styles.metricsRow}>
                  <View style={[styles.metricBox, { borderColor: BLUE + '33' }]}>
                    <Text style={[styles.metricLabel, { color: BLUE + 'aa' }]}>R:R</Text>
                    <Text style={[styles.metricValue, { color: BLUE_BRIGHT }]}>{idea.riskRewardRatio}</Text>
                  </View>
                  <View style={[styles.metricBox, { borderColor: BLUE + '33' }]}>
                    <Text style={[styles.metricLabel, { color: BLUE + 'aa' }]}>QUALITY</Text>
                    <View style={styles.qualityRow}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons
                          key={star}
                          name={star <= (idea.qualityScore || 3) ? 'star' : 'star-outline'}
                          size={12}
                          color={getQualityColor(idea.qualityScore || 3)}
                        />
                      ))}
                    </View>
                    <Text style={[styles.qualityLabel, { color: getQualityColor(idea.qualityScore || 3) }]}>
                      {getQualityLabel(idea.qualityScore || 3)}
                    </Text>
                  </View>
                </View>
              </AnimatedRow>

              {idea.qualityFactors && idea.qualityFactors.length > 0 && (
                <AnimatedRow index={3}>
                  <View style={styles.factorsSection}>
                    <Text style={[styles.sectionLabel, { color: BLUE + '99' }]}>QUALITY FACTORS</Text>
                    {idea.qualityFactors.map((factor, index) => (
                      <View style={styles.factorItem} key={index}>
                        <Text style={[styles.factorBullet, { color: BLUE }]}>{'>'}</Text>
                        <Text style={[styles.factorText, { color: theme.textSecondary }]}>{factor}</Text>
                      </View>
                    ))}
                  </View>
                </AnimatedRow>
              )}

              <AnimatedRow index={4}>
                <View style={styles.reasoningSection}>
                  <Text style={[styles.sectionLabel, { color: BLUE + '99' }]}>REASONING</Text>
                  <Text style={[styles.reasoningText, { color: theme.textSecondary }]}>{idea.reasoning}</Text>
                </View>
              </AnimatedRow>

              {idea.keyLevels && idea.keyLevels.length > 0 && (
                <AnimatedRow index={5}>
                  <View style={styles.levelsSection}>
                    <Text style={[styles.sectionLabel, { color: BLUE + '99' }]}>KEY LEVELS</Text>
                    {idea.keyLevels.map((level, index) => (
                      <View style={styles.levelItem} key={index}>
                        <View style={[styles.levelDot, { backgroundColor: BLUE }]} />
                        <Text style={[styles.levelText, { color: theme.textSecondary }]}>{level}</Text>
                      </View>
                    ))}
                  </View>
                </AnimatedRow>
              )}

              {idea.warnings && idea.warnings.length > 0 && (
                <AnimatedRow index={6}>
                  <View style={[styles.warningsSection, { borderColor: '#ff006633' }]}>
                    <View style={styles.warningHeader}>
                      <Ionicons name="warning" size={11} color="#ff0066" />
                      <Text style={[styles.warningTitle, { color: '#ff6688' }]}>RISK</Text>
                    </View>
                    {idea.warnings.map((warning, index) => (
                      <Text style={[styles.warningText, { color: '#ff9999' }]} key={index}>
                        {warning}
                      </Text>
                    ))}
                  </View>
                </AnimatedRow>
              )}

              {idea.socialSentiment && (
                <AnimatedRow index={7}>
                  <View style={styles.socialSection}>
                    <View style={styles.socialHeader}>
                      <View style={[styles.socialHeaderDot, { backgroundColor: VAPOR_PURPLE }]} />
                      <Text style={[styles.socialHeaderLabel, { color: VAPOR_PURPLE + 'cc' }]}>SOCIAL POWER</Text>
                      <View style={[styles.socialHeaderLine, { backgroundColor: VAPOR_PURPLE + '22' }]} />
                    </View>
                    <View style={styles.socialGrid}>
                      {idea.socialSentiment.reddit && (
                        <SocialMiniCard platform="reddit" data={idea.socialSentiment.reddit} />
                      )}
                      {idea.socialSentiment.twitter && (
                        <SocialMiniCard platform="twitter" data={idea.socialSentiment.twitter} />
                      )}
                      {idea.socialSentiment.telegram && (
                        <SocialMiniCard platform="telegram" data={idea.socialSentiment.telegram} />
                      )}
                      {idea.socialSentiment.discord && (
                        <SocialMiniCard platform="discord" data={idea.socialSentiment.discord} />
                      )}
                      {idea.socialSentiment.youtube && (
                        <SocialMiniCard platform="youtube" data={idea.socialSentiment.youtube} />
                      )}
                    </View>
                  </View>
                </AnimatedRow>
              )}

              {idea.fearGreedValue != null && (
                <AnimatedRow index={8}>
                  <View style={styles.fearGreedSection}>
                    <View style={styles.fearGreedHeader}>
                      <Ionicons name="pulse" size={12} color={getFearGreedColor(idea.fearGreedValue)} />
                      <Text style={[styles.fearGreedHeaderLabel, { color: BLUE + 'aa' }]}>FEAR & GREED</Text>
                      <Text style={[styles.fearGreedValue, { color: getFearGreedColor(idea.fearGreedValue) }]}>
                        {idea.fearGreedValue}
                      </Text>
                      <Text style={[styles.fearGreedLabel, { color: getFearGreedColor(idea.fearGreedValue) + 'aa' }]}>
                        {idea.fearGreedLabel || ''}
                      </Text>
                    </View>
                    <View style={styles.fearGreedBar}>
                      <View style={[styles.fearGreedFill, { width: `${idea.fearGreedValue}%`, backgroundColor: getFearGreedColor(idea.fearGreedValue) }]} />
                    </View>
                    <View style={styles.fearGreedScale}>
                      <Text style={[styles.fearGreedScaleText, { color: '#ff004488' }]}>FEAR</Text>
                      <Text style={[styles.fearGreedScaleText, { color: '#ffaa0088' }]}>NEUTRAL</Text>
                      <Text style={[styles.fearGreedScaleText, { color: '#00ffaa88' }]}>GREED</Text>
                    </View>
                  </View>
                </AnimatedRow>
              )}

              {idea.finalVerdict && (
                <AnimatedRow index={9}>
                  <View style={[styles.verdictSection, { borderColor: dirColor + '33' }]}>
                    <View style={styles.verdictHeader}>
                      <Ionicons name="shield-checkmark" size={12} color={dirColor} />
                      <Text style={[styles.verdictLabel, { color: dirColor + 'cc' }]}>FINAL VERDICT</Text>
                      <View style={[styles.verdictHeaderLine, { backgroundColor: dirColor + '22' }]} />
                      <Text style={[styles.verdictGo, { color: dirColor }]}>
                        {idea.confidence >= 60 ? 'GO' : 'CAUTION'}
                      </Text>
                    </View>
                    <Text style={[styles.verdictText, { color: theme.textSecondary }]}>
                      {idea.finalVerdict}
                    </Text>
                  </View>
                </AnimatedRow>
              )}
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    position: 'relative',
  },
  stippleRight: {
    position: 'absolute',
    right: 20,
    top: -20,
    height: 20,
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
    backgroundColor: 'rgba(0, 20, 40, 0.5)',
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
  circuitLineLeft: {
    position: 'absolute',
    top: 11,
    left: 0,
    width: 24,
    height: 1,
    zIndex: 1,
  },
  circuitDotLeft: {
    position: 'absolute',
    top: 9,
    left: 22,
    width: 4,
    height: 4,
    borderRadius: 2,
    zIndex: 1,
  },
  circuitLineBottom: {
    position: 'absolute',
    bottom: 16,
    right: 14,
    width: 1,
    height: 16,
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
    marginBottom: 12,
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  ideaContent: {
    marginTop: 14,
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 12,
  },
  directionText: {
    fontSize: 14,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: 1.5,
  },
  confidencePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  priceGrid: {
    gap: 4,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 3,
    borderLeftWidth: 2,
  },
  priceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  priceLabelText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
  },
  priceValue: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 170, 255, 0.04)',
  },
  metricLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 3,
  },
  qualityLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  factorsSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 3,
  },
  factorBullet: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  factorText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    lineHeight: 16,
  },
  reasoningSection: {
    marginBottom: 12,
  },
  reasoningText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  levelsSection: {
    marginBottom: 12,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  levelDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  levelText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  warningsSection: {
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 0, 102, 0.04)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  warningText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
    lineHeight: 14,
  },
  socialSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  socialHeaderDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  socialHeaderLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  socialHeaderLine: {
    flex: 1,
    height: 1,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 0,
  },
  socialCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    gap: 2,
    marginHorizontal: 2,
  },
  socialScore: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  socialSentimentText: {
    fontSize: 6,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  fearGreedSection: {
    marginBottom: 12,
  },
  fearGreedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fearGreedHeaderLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  fearGreedValue: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  fearGreedLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  fearGreedBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  fearGreedFill: {
    height: '100%',
    borderRadius: 2,
  },
  fearGreedScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fearGreedScaleText: {
    fontSize: 7,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  verdictSection: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 170, 255, 0.04)',
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  verdictLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  verdictHeaderLine: {
    flex: 1,
    height: 1,
  },
  verdictGo: {
    fontSize: 10,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: 1,
  },
  verdictText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
