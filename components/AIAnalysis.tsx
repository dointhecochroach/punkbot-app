import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { useTheme } from '@/lib/ThemeContext';

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

interface AIAnalysisData {
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  summary: string;
  technicalAnalysis: string;
  sentimentAnalysis: string;
  keyConsiderations?: string[];
  riskWarning?: string;
  socialSentiment?: SocialSentimentData;
  socialConclusion?: string;
  [key: string]: any;
}

interface AIAnalysisProps {
  analysis: AIAnalysisData | null;
  isLoading: boolean;
  fearGreedIndex: number | null;
  fearGreedLabel: string | null;
}

function TerminalFrame({ color, children }: { color: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  const borderColor = color + '44';
  const cornerColor = color + 'aa';
  const lineColor = color + '33';

  return (
    <View style={[styles.terminalContainer, { borderColor: borderColor }]}>
      <View style={[styles.cornerTL, { borderColor: cornerColor }]} />
      <View style={[styles.cornerTR, { borderColor: cornerColor }]} />
      <View style={[styles.cornerBL, { borderColor: cornerColor }]} />
      <View style={[styles.cornerBR, { borderColor: cornerColor }]} />
      
      <View style={[styles.circuitLineTop, { backgroundColor: lineColor }]} />
      <View style={[styles.circuitLineRight, { backgroundColor: lineColor }]} />
      <View style={[styles.circuitDotTR, { backgroundColor: lineColor }]} />
      <View style={[styles.circuitLineBottom, { backgroundColor: lineColor }]} />
      <View style={[styles.circuitDotBL, { backgroundColor: lineColor }]} />

      <View style={[styles.scanLine, { backgroundColor: color + '08' }]} />

      {children}
    </View>
  );
}

function DataLine({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.dataLine}>
      <Text style={[styles.dataLabel, { color: color + '88' }]}>{label}</Text>
      <View style={[styles.dataDash, { backgroundColor: color + '33' }]} />
      <Text style={[styles.dataValue, { color }]}>{value}</Text>
    </View>
  );
}

export function AIAnalysisCard({ analysis, isLoading, fearGreedIndex, fearGreedLabel }: AIAnalysisProps) {
  const { theme } = useTheme();
  
  const getSignalColor = (signal: string): string => {
    switch (signal) {
      case 'LONG': return '#00ffaa';
      case 'SHORT': return '#ff0066';
      default: return '#ffaa00';
    }
  };
  
  const getSignalIcon = (signal: string): keyof typeof Ionicons.glyphMap => {
    switch (signal) {
      case 'LONG': return 'arrow-up-circle';
      case 'SHORT': return 'arrow-down-circle';
      default: return 'remove-circle';
    }
  };
  
  const getFearGreedColor = (value: number): string => {
    if (value <= 25) return '#ff0044';
    if (value <= 45) return '#ff6600';
    if (value <= 55) return '#ffaa00';
    if (value <= 75) return '#88ff00';
    return '#00ffaa';
  };
  
  const accentColor = analysis ? getSignalColor(analysis.signal) : theme.accent;
  
  const StippleConnector = ({ connectorColor }: { connectorColor: string }) => (
    <View style={styles.stippleConnector}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <View key={i} style={[styles.stippleDot, { backgroundColor: connectorColor + '44' }]} />
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.wrapper}>
        <StippleConnector connectorColor={theme.accent} />
        <TerminalFrame color={theme.accent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={[styles.statusDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.headerLabel, { color: theme.accent + 'aa' }]}>SYS.PUNKBOT</Text>
              <View style={[styles.headerLine, { backgroundColor: theme.accent + '22' }]} />
              <Text style={[styles.headerStatus, { color: theme.accent + '66' }]}>SCANNING</Text>
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Scanning the matrix...
              </Text>
            </View>
          </View>
        </TerminalFrame>
      </View>
    );
  }
  
  if (!analysis) {
    return (
      <View style={styles.wrapper}>
        <StippleConnector connectorColor={theme.accent} />
        <TerminalFrame color={theme.accent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={[styles.statusDot, { backgroundColor: theme.accent + '44' }]} />
              <Text style={[styles.headerLabel, { color: theme.accent + '66' }]}>SYS.PUNKBOT</Text>
              <View style={[styles.headerLine, { backgroundColor: theme.accent + '22' }]} />
              <Text style={[styles.headerStatus, { color: theme.accent + '44' }]}>IDLE</Text>
            </View>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Awaiting data feed...
            </Text>
          </View>
        </TerminalFrame>
      </View>
    );
  }
  
  const signalColor = getSignalColor(analysis.signal);
  
  return (
    <View style={styles.wrapper}>
      <StippleConnector connectorColor={signalColor} />
      <TerminalFrame color={signalColor}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.statusDot, { backgroundColor: signalColor }]} />
            <Text style={[styles.headerLabel, { color: signalColor + 'cc' }]}>SYS.PUNKBOT</Text>
            <View style={[styles.headerLine, { backgroundColor: signalColor + '22' }]} />
            <Text style={[styles.headerStatus, { color: signalColor + '88' }]}>ACTIVE</Text>
          </View>
          
          <View style={styles.signalRow}>
            <View style={[styles.signalBadge, { backgroundColor: signalColor + '18', borderColor: signalColor + '55' }]}>
              <Ionicons name={getSignalIcon(analysis.signal)} size={20} color={signalColor} />
              <Text style={[styles.signalText, { color: signalColor }]}>{analysis.signal}</Text>
            </View>
            
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={[styles.metricLabel, { color: theme.textMuted }]}>CONF</Text>
                <Text style={[styles.metricValue, { color: signalColor }]}>
                  {analysis.confidence ?? Math.max(analysis.longConfidence ?? 0, analysis.shortConfidence ?? 0)}
                  <Text style={[styles.metricMax, { color: theme.textMuted }]}>/100%</Text>
                </Text>
              </View>
              
              {fearGreedIndex !== null && (
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: theme.textMuted }]}>F&G</Text>
                  <Text style={[styles.metricValue, { color: getFearGreedColor(fearGreedIndex) }]}>
                    {fearGreedIndex}
                  </Text>
                  <Text style={[styles.metricSubtext, { color: theme.textSecondary }]}>
                    {fearGreedLabel}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={[styles.summaryBox, { borderColor: signalColor + '22' }]}>
            <View style={[styles.summaryIndicator, { backgroundColor: signalColor }]} />
            <Text style={[styles.summaryText, { color: theme.text }]}>{analysis.summary}</Text>
          </View>
          
          <View style={styles.analysisSection}>
            <DataLine label="TECH" value="" color={theme.indicatorMACD} />
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>{analysis.technicalAnalysis}</Text>
          </View>
          
          <View style={styles.analysisSection}>
            <DataLine label="SENT" value="" color={theme.indicatorRSI} />
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>{analysis.sentimentAnalysis}</Text>
          </View>
          
          {analysis.keyConsiderations && analysis.keyConsiderations.length > 0 && (
            <View style={styles.analysisSection}>
              <DataLine label="NOTES" value="" color={theme.indicatorADX} />
              {analysis.keyConsiderations.map((item, index) => (
                <View key={index} style={styles.considerationItem}>
                  <Text style={[styles.considerationBullet, { color: signalColor }]}>{'>'}</Text>
                  <Text style={[styles.considerationText, { color: theme.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>
          )}
          
          {analysis.riskWarning && (
            <View style={[styles.riskBox, { borderColor: '#ff006644' }]}>
              <Ionicons name="warning" size={13} color="#ff0066" />
              <Text style={[styles.riskText, { color: '#ff6699' }]}>{analysis.riskWarning}</Text>
            </View>
          )}

          {analysis.socialSentiment && (
            <View style={styles.socialSection}>
              <DataLine label="SOCIAL.SCAN" value="" color={VAPOR_PURPLE} />
              <View style={styles.socialGrid}>
                {analysis.socialSentiment.reddit && (
                  <SocialCard platform="reddit" data={analysis.socialSentiment.reddit} />
                )}
                {analysis.socialSentiment.twitter && (
                  <SocialCard platform="twitter" data={analysis.socialSentiment.twitter} />
                )}
                {analysis.socialSentiment.telegram && (
                  <SocialCard platform="telegram" data={analysis.socialSentiment.telegram} />
                )}
                {analysis.socialSentiment.discord && (
                  <SocialCard platform="discord" data={analysis.socialSentiment.discord} />
                )}
                {analysis.socialSentiment.youtube && (
                  <SocialCard platform="youtube" data={analysis.socialSentiment.youtube} />
                )}
              </View>
            </View>
          )}

          {analysis.socialConclusion && (
            <View style={[styles.socialConclusionBox, { borderColor: VAPOR_PURPLE + '33' }]}>
              <View style={styles.socialConclusionHeader}>
                <Ionicons name="chatbubbles" size={11} color={VAPOR_PURPLE} />
                <Text style={[styles.socialConclusionLabel, { color: VAPOR_PURPLE + 'aa' }]}>SOCIAL.VERDICT</Text>
                <View style={[styles.headerLine, { backgroundColor: VAPOR_PURPLE + '22' }]} />
              </View>
              <Text style={[styles.socialConclusionText, { color: theme.textSecondary }]}>
                {analysis.socialConclusion}
              </Text>
            </View>
          )}
        </View>
      </TerminalFrame>
    </View>
  );
}

const VAPOR_PURPLE = '#bf5af2';
const VAPOR_CYAN = '#64d2ff';
const VAPOR_PINK = '#ff6ec7';

function RedditLogo({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.2" opacity={0.3} />
      <Path d="M19.5 12a1.5 1.5 0 0 0-2.56-1.06 7.4 7.4 0 0 0-4.06-1.27l.69-3.26 2.26.48a1.07 1.07 0 1 0 .11-.52l-2.53-.54a.27.27 0 0 0-.31.2l-.77 3.64a7.4 7.4 0 0 0-4.14 1.27A1.5 1.5 0 1 0 6.2 13.06a3 3 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a3 3 0 0 0 0-.44A1.5 1.5 0 0 0 19.5 12zM9.08 13.5a1.07 1.07 0 1 1 0 2.14 1.07 1.07 0 0 1 0-2.14zm5.96 2.83a3.58 3.58 0 0 1-2.03.57 3.58 3.58 0 0 1-2.03-.57.27.27 0 0 1 .38-.38 3.04 3.04 0 0 0 1.65.48 3.04 3.04 0 0 0 1.65-.48.27.27 0 1 1 .38.38zm-.12-0.69a1.07 1.07 0 1 1 0-2.14 1.07 1.07 0 0 1 0 2.14z" fill="none" stroke={color} strokeWidth="0.8" />
    </Svg>
  );
}

function XLogo({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.2" opacity={0.3} />
      <Path d="M13.31 11.02L17.57 6h-1.01l-3.7 4.36L10.16 6H6.5l4.47 6.59L6.5 18h1.01l3.91-4.61L14.34 18H18l-4.69-6.98zm-1.38 1.63l-.45-.66L8.02 6.83h1.55l2.92 4.23.45.66 3.79 5.49h-1.55l-3.09-4.47-.46-.09z" fill="none" stroke={color} strokeWidth="0.6" />
    </Svg>
  );
}

function TelegramLogo({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.2" opacity={0.3} />
      <Path d="M17.5 7.2L15.3 17.8c-.16.73-.6.91-1.21.57l-3.35-2.47-1.62 1.55c-.18.18-.33.33-.67.33l.24-3.4L15.5 8.2c.3-.27-.07-.42-.47-.16l-8.53 5.37-3.67-1.15c-.8-.25-.81-.8.17-1.18l14.34-5.52c.66-.25 1.24.16 1.03 1.18l.13-.54z" fill="none" stroke={color} strokeWidth="0.8" />
    </Svg>
  );
}

function DiscordLogo({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.2" opacity={0.3} />
      <Path d="M16.94 8.11A12.3 12.3 0 0 0 13.91 7c-.13.23-.27.54-.37.78a11.4 11.4 0 0 0-3.42 0A8 8 0 0 0 9.74 7a12.3 12.3 0 0 0-3.03 1.11C5.07 10.37 4.6 12.57 4.84 14.74a12.4 12.4 0 0 0 3.74 1.89c.29-.39.55-.8.77-1.24a8.2 8.2 0 0 1-1.17-.56c.08-.06.16-.12.23-.18 2.45 1.12 5.1 1.12 7.52 0 .08.06.16.12.23.18-.37.22-.76.4-1.17.56.23.44.48.85.77 1.24a12.4 12.4 0 0 0 3.74-1.89c.28-2.47-.47-4.62-1.97-6.52zM9.57 13.6c-.57 0-1.03-.52-1.03-1.16 0-.64.46-1.16 1.03-1.16.58 0 1.04.52 1.03 1.16 0 .64-.46 1.16-1.03 1.16zm3.82 0c-.57 0-1.03-.52-1.03-1.16 0-.64.46-1.16 1.03-1.16.58 0 1.04.52 1.03 1.16 0 .64-.45 1.16-1.03 1.16z" fill="none" stroke={color} strokeWidth="0.6" />
    </Svg>
  );
}

function YouTubeLogo({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.2" opacity={0.3} />
      <Path d="M18.68 9.22a2 2 0 0 0-1.4-1.42C16.12 7.5 12 7.5 12 7.5s-4.12 0-5.28.3a2 2 0 0 0-1.4 1.42A21 21 0 0 0 5 12a21 21 0 0 0 .32 2.78 2 2 0 0 0 1.4 1.42c1.16.3 5.28.3 5.28.3s4.12 0 5.28-.3a2 2 0 0 0 1.4-1.42A21 21 0 0 0 19 12a21 21 0 0 0-.32-2.78z" fill="none" stroke={color} strokeWidth="0.8" />
      <Path d="M10.5 14.25l3.5-2.25-3.5-2.25v4.5z" fill={color} opacity={0.6} />
    </Svg>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  reddit: VAPOR_PINK,
  twitter: VAPOR_CYAN,
  telegram: VAPOR_CYAN,
  discord: VAPOR_PURPLE,
  youtube: VAPOR_PINK,
};

function SocialCard({ platform, data }: { platform: string; data: SocialPlatformData }) {
  const { theme } = useTheme();
  const logoSize = 20;
  const platformColor = PLATFORM_COLORS[platform] || VAPOR_PURPLE;
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '#00ffaa';
      case 'bearish': return '#ff0066';
      default: return '#ffaa00';
    }
  };
  
  const sentimentColor = getSentimentColor(data.sentiment);
  
  const renderLogo = () => {
    switch (platform) {
      case 'reddit': return <RedditLogo size={logoSize} color={platformColor} />;
      case 'twitter': return <XLogo size={logoSize} color={platformColor} />;
      case 'telegram': return <TelegramLogo size={logoSize} color={platformColor} />;
      case 'discord': return <DiscordLogo size={logoSize} color={platformColor} />;
      case 'youtube': return <YouTubeLogo size={logoSize} color={platformColor} />;
      default: return null;
    }
  };

  return (
    <View style={[styles.socialCard, { borderColor: platformColor + '22' }]}>
      {renderLogo()}
      <Text style={[styles.socialScore, { color: sentimentColor }]}>
        {data.score}
      </Text>
      <Text style={[styles.socialSentimentLabel, { color: sentimentColor + '88' }]}>
        {data.sentiment.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 20,
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
  terminalContainer: {
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
  circuitLineRight: {
    position: 'absolute',
    top: 28,
    right: 0,
    width: 40,
    height: 1,
    zIndex: 1,
  },
  circuitDotTR: {
    position: 'absolute',
    top: 26,
    right: 40,
    width: 4,
    height: 4,
    borderRadius: 2,
    zIndex: 1,
  },
  circuitLineBottom: {
    position: 'absolute',
    bottom: 20,
    left: 18,
    width: 1,
    height: 20,
    zIndex: 1,
  },
  circuitDotBL: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    zIndex: 1,
  },
  scanLine: {
    position: 'absolute',
    top: 100,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  signalText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  metricsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  metricBox: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  metricMax: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  metricSubtext: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
  },
  summaryBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 3,
    marginBottom: 14,
    overflow: 'hidden',
  },
  summaryIndicator: {
    width: 3,
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 20,
    padding: 10,
  },
  analysisSection: {
    marginBottom: 12,
  },
  dataLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dataLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  dataDash: {
    flex: 1,
    height: 1,
  },
  dataValue: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  considerationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 3,
  },
  considerationBullet: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  considerationText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  riskBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 3,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 0, 100, 0.06)',
    marginTop: 4,
  },
  riskText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  socialSection: {
    marginTop: 14,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 0,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  socialCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    gap: 3,
    marginHorizontal: 2,
  },
  socialScore: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  socialSentimentLabel: {
    fontSize: 6,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  socialConclusionBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 4,
    borderWidth: 0.5,
    backgroundColor: 'rgba(191, 90, 242, 0.04)',
  },
  socialConclusionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  socialConclusionLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  socialConclusionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
