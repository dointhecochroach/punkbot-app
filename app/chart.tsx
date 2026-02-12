import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Platform, ActivityIndicator, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing, FadeIn, FadeOut } from 'react-native-reanimated';
import { PriceHeader } from '@/components/PriceHeader';
import { TimeframeSelector } from '@/components/TimeframeSelector';
import { CandlestickChart } from '@/components/CandlestickChart';
import { VolumeChart } from '@/components/VolumeChart';
import { IndicatorChart } from '@/components/IndicatorChart';
import { AIAnalysisCard } from '@/components/AIAnalysis';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { RiskWarning } from '@/components/RiskWarning';
import { TradingStylePicker } from '@/components/TradingStylePicker';
import { AlertConfigModal } from '@/components/AlertConfigModal';
import { SignalExplainer } from '@/components/SignalExplainer';
import { TradeIdeaCard, TradeIdea } from '@/components/TradeIdeaCard';
import { Candle, TimeInterval, CryptoSymbol } from '@/lib/types';
import { fetchKlines, fetchCurrentPrice, fetch24hrChange } from '@/lib/binanceApi';
import { calculateIndicators, calculatePivotPoints, calculateFibonacciLevels } from '@/lib/indicators';
import { fetchFearGreedIndex, FearGreedData } from '@/lib/fearGreedApi';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/storage';
import { getTimeframeRiskLevel, getTradingStyle, TradingStyle } from '@/lib/tradingStyles';
import { AlertConfig, getAlertsForSymbol } from '@/lib/alertsStorage';
import { apiRequest, isBackendAvailable } from '@/lib/query-client';
import { useTheme } from '@/lib/ThemeContext';

type AnalysisMode = 'signals' | 'alerts';

interface AIAnalysisData {
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  longConfidence: number;
  shortConfidence: number;
  summary: string;
  technicalAnalysis: string;
  sentimentAnalysis: string;
  keyConsiderations?: string[];
  riskWarning?: string;
  socialSentiment?: any;
  socialConclusion?: string;
  [key: string]: any;
}

function AlertCardsList({ alerts, theme }: { alerts: AlertConfig[]; theme: any }) {
  if (!alerts || alerts.length === 0) return null;
  
  return (
    <View style={{ width: '100%', marginBottom: 14, gap: 8 }}>
      {alerts.map(alert => {
        const conditions: { label: string; value: string }[] = [];
        if (alert.priceAbove != null && !isNaN(Number(alert.priceAbove))) {
          conditions.push({ label: 'Price Above', value: `$${Number(alert.priceAbove).toLocaleString()}` });
        }
        if (alert.priceBelow != null && !isNaN(Number(alert.priceBelow))) {
          conditions.push({ label: 'Price Below', value: `$${Number(alert.priceBelow).toLocaleString()}` });
        }
        if (alert.rsiAbove != null && !isNaN(Number(alert.rsiAbove))) {
          conditions.push({ label: 'RSI Above', value: String(alert.rsiAbove) });
        }
        if (alert.rsiBelow != null && !isNaN(Number(alert.rsiBelow))) {
          conditions.push({ label: 'RSI Below', value: String(alert.rsiBelow) });
        }
        if (alert.adxAbove != null && !isNaN(Number(alert.adxAbove))) {
          conditions.push({ label: 'ADX Above', value: String(alert.adxAbove) });
        }
        if (alert.macdCrossover === true) {
          conditions.push({ label: 'MACD', value: 'Bullish Cross' });
        }
        
        const isActive = alert.enabled !== false;
        const accentColor = theme.accent || '#00ffaa';
        
        return (
          <View
            key={alert.id}
            style={{
              borderRadius: 10,
              borderWidth: 1.5,
              padding: 12,
              backgroundColor: isActive ? accentColor + '18' : (theme.backgroundSecondary || '#1a1a2e'),
              borderColor: isActive ? accentColor + '80' : (theme.cardBorder || '#333'),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isActive ? accentColor : '#666' }} />
              <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1, color: isActive ? accentColor : '#666' }}>
                {isActive ? 'ACTIVE' : 'OFF'}
              </Text>
            </View>
            {conditions.length > 0 ? conditions.map((cond, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: theme.textSecondary || '#999' }}>{cond.label}</Text>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: isActive ? (theme.text || '#fff') : '#666' }}>{cond.value}</Text>
              </View>
            )) : (
              <Text style={{ fontSize: 11, color: theme.textMuted || '#666', fontFamily: 'Inter_400Regular' }}>Alert configured (no specific conditions)</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function ChartScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    isFutures: string;
  }>();
  
  const symbol = params.symbol || 'BTCUSDT';
  const baseAsset = params.baseAsset || 'BTC';
  const quoteAsset = params.quoteAsset || 'USDT';
  const isFutures = params.isFutures === '1';
  
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('1h');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tradingStyle, setTradingStyle] = useState<TradingStyle>('daytrader');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('signals');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [savedAlerts, setSavedAlerts] = useState<AlertConfig[]>([]);
  const [tradeIdea, setTradeIdea] = useState<TradeIdea | null>(null);
  const [isGeneratingTrade, setIsGeneratingTrade] = useState(false);
  
  const cryptoSymbol: CryptoSymbol = {
    symbol,
    baseAsset,
    quoteAsset,
    isFutures,
  };
  
  useEffect(() => {
    loadData();
    checkFavorite();
    loadFearGreed();
    loadTradingStyle();
    loadSavedAlerts();
    
    const priceInterval = setInterval(() => {
      loadPrice();
    }, 5000);
    
    return () => clearInterval(priceInterval);
  }, [symbol, isFutures]);
  
  useEffect(() => {
    loadCandles();
    setAiAnalysis(null);
    setTradeIdea(null);
  }, [timeInterval]);
  
  const loadTradingStyle = async () => {
    const style = await getTradingStyle();
    setTradingStyle(style);
  };
  
  const loadSavedAlerts = async () => {
    const alerts = await getAlertsForSymbol(symbol);
    console.log('[ALERTS DEBUG] loadSavedAlerts for', symbol, '- count:', alerts.length, '- data:', JSON.stringify(alerts));
    setSavedAlerts(alerts);
  };
  
  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadCandles(), loadPrice(), loadChange()]);
    setIsLoading(false);
  };
  
  const loadCandles = async () => {
    const data = await fetchKlines(symbol, timeInterval, isFutures, 100);
    setCandles(data);
  };
  
  const loadPrice = async () => {
    const p = await fetchCurrentPrice(symbol, isFutures);
    if (p !== null) setPrice(p);
  };
  
  const loadChange = async () => {
    const change = await fetch24hrChange(symbol, isFutures);
    if (change) {
      setPriceChange(change.priceChange);
      setPriceChangePercent(change.priceChangePercent);
    }
  };
  
  const loadFearGreed = async () => {
    const data = await fetchFearGreedIndex();
    setFearGreed(data);
  };
  
  const checkFavorite = async () => {
    const fav = await isFavorite(cryptoSymbol);
    setIsFav(fav);
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadData(), loadFearGreed()]);
    setIsRefreshing(false);
  };
  
  const handleIntervalChange = (newInterval: TimeInterval) => {
    setTimeInterval(newInterval);
  };
  
  const handleFavorite = async () => {
    if (isFav) {
      await removeFavorite(cryptoSymbol);
    } else {
      await addFavorite(cryptoSymbol);
    }
    setIsFav(!isFav);
  };
  
  const handleStyleChange = (style: TradingStyle) => {
    setTradingStyle(style);
    setAiAnalysis(null);
    setTradeIdea(null);
  };
  
  useEffect(() => {
    if (candles.length > 0 && !isLoading && !isAnalyzing) {
      handleAIAnalysis();
    }
  }, [candles, tradingStyle]);
  
  const generateLocalAnalysis = (): AIAnalysisData => {
    const ind = calculateIndicators(candles);
    const lastIndex = candles.length - 1;
    const rsi = ind.rsi[lastIndex] || 50;
    const macd = ind.macd[lastIndex] || { macd: 0, signal: 0, histogram: 0 };
    const adx = ind.adx[lastIndex] || { adx: 0, plusDI: 0, minusDI: 0 };
    const bop = ind.bop[lastIndex] || 0;
    
    let longScore = 50;
    let shortScore = 50;
    
    if (rsi < 30) { longScore += 20; shortScore -= 15; }
    else if (rsi < 40) { longScore += 10; shortScore -= 5; }
    else if (rsi > 70) { shortScore += 20; longScore -= 15; }
    else if (rsi > 60) { shortScore += 10; longScore -= 5; }
    
    if (macd.histogram > 0) { longScore += 10; shortScore -= 5; }
    else if (macd.histogram < 0) { shortScore += 10; longScore -= 5; }
    
    if (adx.plusDI > adx.minusDI) { longScore += 10; shortScore -= 5; }
    else if (adx.minusDI > adx.plusDI) { shortScore += 10; longScore -= 5; }
    
    if (bop > 0.3) { longScore += 5; } else if (bop < -0.3) { shortScore += 5; }
    
    longScore = Math.max(5, Math.min(95, longScore));
    shortScore = Math.max(5, Math.min(95, shortScore));
    
    const signal: 'LONG' | 'SHORT' | 'NEUTRAL' = longScore > shortScore + 15 ? 'LONG' : shortScore > longScore + 15 ? 'SHORT' : 'NEUTRAL';
    const confidence = Math.max(longScore, shortScore);
    
    const rsiZone = rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral';
    const trendDir = adx.plusDI > adx.minusDI ? 'bullish' : 'bearish';
    
    return {
      signal,
      confidence,
      longConfidence: longScore,
      shortConfidence: shortScore,
      summary: `Local analysis for ${symbol}: RSI at ${rsi.toFixed(1)} (${rsiZone}), MACD histogram ${macd.histogram > 0 ? 'positive' : 'negative'}, ADX shows ${trendDir} pressure. ${signal === 'LONG' ? 'Leaning bullish, punk.' : signal === 'SHORT' ? 'Bears in control, stay sharp.' : 'Mixed signals, wait for clarity.'}`,
      technicalAnalysis: `RSI(14) at ${rsi.toFixed(2)} is in ${rsiZone} territory. MACD histogram at ${macd.histogram.toFixed(4)} is ${macd.histogram > 0 ? 'expanding bullish' : 'bearish'}. ADX at ${adx.adx.toFixed(1)} with +DI(${adx.plusDI.toFixed(1)}) ${adx.plusDI > adx.minusDI ? '>' : '<'} -DI(${adx.minusDI.toFixed(1)}) confirms ${trendDir} trend. Balance of Power at ${bop.toFixed(3)} shows ${bop > 0 ? 'buying' : 'selling'} pressure.`,
      sentimentAnalysis: 'AI backend offline - showing local indicator analysis only. Connect to server for full AI-powered sentiment analysis.',
      keyConsiderations: [
        `RSI at ${rsi.toFixed(1)} - ${rsiZone === 'overbought' ? 'watch for reversal' : rsiZone === 'oversold' ? 'potential bounce zone' : 'no extreme readings'}`,
        `MACD ${macd.macd > macd.signal ? 'above' : 'below'} signal line`,
        `ADX trend strength: ${adx.adx > 25 ? 'strong' : 'weak'} (${adx.adx.toFixed(1)})`,
        `${trendDir.charAt(0).toUpperCase() + trendDir.slice(1)} directional pressure`,
      ],
      riskWarning: 'Local analysis only - connect to server for full AI analysis with social sentiment.',
    };
  };

  const handleAIAnalysis = async () => {
    if (candles.length === 0 || isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    if (!isBackendAvailable()) {
      setAiAnalysis(generateLocalAnalysis());
      setIsAnalyzing(false);
      return;
    }
    
    try {
      const indicators = calculateIndicators(candles);
      const lastIndex = candles.length - 1;
      const obvTrend = indicators.obv[lastIndex] > indicators.obv[lastIndex - 10] ? 'Rising' : 'Falling';
      
      const response = await apiRequest('POST', '/api/analyze', {
        symbol,
        price,
        priceChange: priceChangePercent,
        timeframe: timeInterval,
        tradingStyle,
        indicators: {
          rsi: indicators.rsi[lastIndex],
          macd: indicators.macd[lastIndex],
          adx: indicators.adx[lastIndex],
          bop: indicators.bop[lastIndex],
          obvTrend,
        },
        fearGreedIndex: fearGreed,
      });
      
      const analysis = await response.json();
      if (!analysis.confidence) analysis.confidence = Math.max(analysis.longConfidence || 50, analysis.shortConfidence || 50);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiAnalysis(generateLocalAnalysis());
    }
    
    setIsAnalyzing(false);
  };
  
  const handleTradeIdea = async () => {
    if (candles.length === 0 || isGeneratingTrade) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsGeneratingTrade(true);
    
    if (!isBackendAvailable()) {
      const p = price || candles[candles.length - 1]?.close || 0;
      const ind = calculateIndicators(candles);
      const lastIdx = candles.length - 1;
      const rsi = ind.rsi[lastIdx] || 50;
      const isLong = rsi < 50;
      setTradeIdea({
        direction: isLong ? 'LONG' : 'SHORT',
        entryPrice: p,
        stopLoss: isLong ? p * 0.97 : p * 1.03,
        takeProfit1: isLong ? p * 1.02 : p * 0.98,
        takeProfit2: isLong ? p * 1.04 : p * 0.96,
        takeProfit3: isLong ? p * 1.06 : p * 0.94,
        riskRewardRatio: '1:2',
        confidence: Math.abs(rsi - 50) + 30,
        qualityScore: 2,
        qualityFactors: ['Local analysis only', 'Based on RSI and price action', 'No AI validation available'],
        reasoning: `Local trade idea based on RSI(${rsi.toFixed(1)}). Connect to server for AI-powered trade ideas with social sentiment.`,
        keyLevels: [`Entry: $${p.toFixed(2)}`, `Stop: $${(isLong ? p * 0.97 : p * 1.03).toFixed(2)}`],
        warnings: ['Local analysis only - no AI validation', 'Verify with your own research'],
      });
      setIsGeneratingTrade(false);
      return;
    }
    
    try {
      const indicatorData = calculateIndicators(candles);
      const pivotPoints = calculatePivotPoints(candles);
      const fibonacci = calculateFibonacciLevels(candles);
      const lastIndex = candles.length - 1;
      const obvTrend = indicatorData.obv[lastIndex] > indicatorData.obv[lastIndex - 10] ? 'Rising' : 'Falling';
      
      const response = await apiRequest('POST', '/api/trade-idea', {
        symbol,
        price,
        timeframe: timeInterval,
        tradingStyle,
        indicators: {
          rsi: indicatorData.rsi[lastIndex],
          macd: indicatorData.macd[lastIndex],
          adx: indicatorData.adx[lastIndex],
          bop: indicatorData.bop[lastIndex],
          obvTrend,
        },
        pivotPoints,
        fibonacci,
        fearGreedIndex: fearGreed,
      });
      
      const idea = await response.json();
      setTradeIdea(idea);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Trade idea error:', error);
      setTradeIdea({
        direction: 'LONG',
        entryPrice: price || 0,
        stopLoss: (price || 0) * 0.97,
        takeProfit1: (price || 0) * 1.02,
        takeProfit2: (price || 0) * 1.04,
        takeProfit3: (price || 0) * 1.06,
        riskRewardRatio: '1:2',
        confidence: 50,
        qualityScore: 3,
        qualityFactors: ['Unable to fully analyze'],
        reasoning: 'Trade circuits overloaded. Try again, punk.',
        keyLevels: ['Check price action manually'],
        warnings: ['System error - verify levels independently'],
      });
    }
    
    setIsGeneratingTrade(false);
  };
  
  const indicators = calculateIndicators(candles);
  const riskInfo = getTimeframeRiskLevel(timeInterval, tradingStyle);
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;
  
  return (
    <View style={[styles.container, { paddingTop: topPadding, backgroundColor: theme.background }]}>
      <PriceHeader
        symbol={symbol}
        baseAsset={baseAsset}
        quoteAsset={quoteAsset}
        price={price}
        priceChange={priceChange}
        priceChangePercent={priceChangePercent}
        isFutures={isFutures}
        onBack={() => router.back()}
        onFavorite={handleFavorite}
        isFavorite={isFav}
      />
      
      <View style={styles.controlsRow}>
        <TimeframeSelector
          selected={timeInterval}
          onSelect={handleIntervalChange}
        />
      </View>
      
      <View style={styles.styleRow}>
        <TradingStylePicker onStyleChange={handleStyleChange} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Jacking into the data stream...
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: bottomPadding + 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
        >
          <RiskWarning
            level={riskInfo.level}
            warning={riskInfo.warning}
            timeframe={(timeInterval || '1h').toUpperCase()}
          />
          
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PRICE ACTION</Text>
              <Text style={[styles.chartType, { color: theme.accent }]}>
                {theme.chartType === 'line' ? 'LINE' : 'CANDLE'}
              </Text>
            </View>
            <CandlestickChart candles={candles} height={280} alerts={savedAlerts} />
          </View>
          
          <View style={styles.indicatorsSection}>
            <VolumeChart candles={candles} height={60} />
            
            <IndicatorChart
              title="MACD (12, 26, 9)"
              label="MACD"
              data={indicators.macd.map(m => m.macd)}
              data2={indicators.macd.map(m => m.signal)}
              histogramData={indicators.macd.map(m => m.histogram)}
              color={theme.indicatorMACD}
              color2={theme.indicatorSignal}
              height={80}
              showZeroLine
              alertBadge={savedAlerts.some(a => a.enabled && a.macdCrossover) ? 'ALERT' : undefined}
            />
            
            <IndicatorChart
              title="RELATIVE STRENGTH INDEX (14)"
              label="RSI"
              data={indicators.rsi}
              color={theme.indicatorRSI}
              height={70}
              alertBadge={savedAlerts.some(a => a.enabled && (a.rsiAbove != null || a.rsiBelow != null)) ? 'ALERT' : undefined}
            />
            
            <IndicatorChart
              title="AVERAGE DIRECTIONAL INDEX (14)"
              label="ADX"
              data={indicators.adx.map(a => a.adx)}
              data2={indicators.adx.map(a => a.plusDI)}
              data3={indicators.adx.map(a => a.minusDI)}
              color={theme.indicatorADX}
              color2={theme.indicatorDIPlus}
              color3={theme.indicatorDIMinus}
              height={70}
              alertBadge={savedAlerts.some(a => a.enabled && a.adxAbove != null) ? 'ALERT' : undefined}
            />
            
            <IndicatorChart
              title="ON BALANCE VOLUME"
              label="OBV"
              data={indicators.obv}
              color={theme.indicatorOBV}
              height={70}
            />
            
            <IndicatorChart
              title="BALANCE OF POWER"
              label="BOP"
              data={indicators.bop}
              color={theme.indicatorBOP}
              height={70}
              showZeroLine
            />
          </View>
          
          <View style={[styles.modeToggle, { borderColor: theme.accent + '33' }]}>
            <Pressable
              style={[
                styles.modeButton,
                analysisMode === 'signals' && [styles.modeButtonActive, { backgroundColor: theme.accent }],
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAnalysisMode('signals');
              }}
            >
              <Ionicons name="flash" size={14} color={analysisMode === 'signals' ? '#000' : theme.accent} />
              <Text style={[styles.modeButtonText, { color: analysisMode === 'signals' ? '#000' : theme.accent }]}>
                Signals
              </Text>
            </Pressable>
            <View style={[styles.modeDivider, { backgroundColor: theme.accent + '33' }]} />
            <Pressable
              style={[
                styles.modeButton,
                analysisMode === 'alerts' && [styles.modeButtonActive, { backgroundColor: theme.accent }],
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAnalysisMode('alerts');
                loadSavedAlerts();
              }}
            >
              <Ionicons name="notifications" size={14} color={analysisMode === 'alerts' ? '#000' : theme.accent} />
              <Text style={[styles.modeButtonText, { color: analysisMode === 'alerts' ? '#000' : theme.accent }]}>
                Alerts
              </Text>
            </Pressable>
          </View>
          
          {analysisMode === 'signals' ? (
            <Animated.View
              key="signals"
              entering={FadeIn.duration(300)}
              style={styles.signalsContainer}
            >
              <View style={styles.sectionGap} />
              <ConfidenceMeter
                longConfidence={aiAnalysis?.longConfidence ?? 50}
                shortConfidence={aiAnalysis?.shortConfidence ?? 50}
              />
              
              {aiAnalysis && (
                <>
                  <View style={styles.sectionGap} />
                  <SignalExplainer
                    signal={aiAnalysis.signal}
                    longConfidence={aiAnalysis.longConfidence}
                    shortConfidence={aiAnalysis.shortConfidence}
                    rsi={indicators.rsi[indicators.rsi.length - 1]}
                    macd={indicators.macd[indicators.macd.length - 1]}
                    adx={indicators.adx[indicators.adx.length - 1]}
                    bop={indicators.bop[indicators.bop.length - 1]}
                  />
                </>
              )}
              
              <View style={styles.sectionGap} />
              <AIAnalysisCard
                analysis={aiAnalysis}
                isLoading={isAnalyzing}
                fearGreedIndex={fearGreed?.value || null}
                fearGreedLabel={fearGreed?.classification || null}
              />
              
              <TradeIdeaCard
                idea={tradeIdea}
                isLoading={isGeneratingTrade}
                currentPrice={price}
                onGenerate={handleTradeIdea}
              />
            </Animated.View>
          ) : (
            <Animated.View
              key="alerts"
              entering={FadeIn.duration(300)}
            >
              <View style={styles.alertsSection}>
                <Text style={[styles.alertsTitle, { color: theme.text }]}>Price Alerts</Text>
                <Text style={[styles.alertsDesc, { color: theme.textMuted }]}>
                  Set custom alerts based on price levels or technical indicators
                </Text>

                <AlertCardsList alerts={savedAlerts} theme={theme} />

                <Pressable
                  style={[styles.configureButton, { backgroundColor: theme.accent }]}
                  onPress={() => setShowAlertModal(true)}
                >
                  <Ionicons name="settings" size={18} color="#000" />
                  <Text style={styles.configureButtonText}>Configure Alerts</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      )}
      
      <AlertConfigModal
        visible={showAlertModal}
        onClose={(freshAlerts) => {
          console.log('[ALERTS DEBUG] Modal onClose - received alerts count:', freshAlerts.length, '- data:', JSON.stringify(freshAlerts));
          setShowAlertModal(false);
          setSavedAlerts(freshAlerts);
        }}
        symbol={symbol}
        currentPrice={price}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  controlsRow: {
    flexDirection: 'row',
  },
  styleRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chartSection: {
    marginTop: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  chartType: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  indicatorsSection: {
    marginTop: 8,
    gap: 4,
  },
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  modeButtonActive: {
    borderRadius: 0,
  },
  modeDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  modeButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  signalsContainer: {
    overflow: 'hidden',
  },
  sectionGap: {
    height: 20,
  },
  alertsSection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertsTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  alertsDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  savedAlertsList: {
    width: '100%',
    marginBottom: 14,
    gap: 8,
  },
  savedAlertCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  savedAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  savedAlertDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  savedAlertStatus: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  savedAlertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  savedAlertLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  savedAlertValue: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  configureButtonText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
