import AsyncStorage from '@react-native-async-storage/async-storage';

export type TradingStyle = 'scalper' | 'daytrader' | 'swingtrader' | 'investor';

export interface TradingStyleConfig {
  id: TradingStyle;
  name: string;
  description: string;
  preferredTimeframes: string[];
  rsiOverbought: number;
  rsiOversold: number;
  adxStrengthThreshold: number;
  riskTolerance: 'low' | 'medium' | 'high';
}

export const tradingStyles: Record<TradingStyle, TradingStyleConfig> = {
  scalper: {
    id: 'scalper',
    name: 'Scalper',
    description: 'Quick in-and-out trades, small profits',
    preferredTimeframes: ['1m', '3m', '5m'],
    rsiOverbought: 75,
    rsiOversold: 25,
    adxStrengthThreshold: 20,
    riskTolerance: 'high',
  },
  daytrader: {
    id: 'daytrader',
    name: 'Day Trader',
    description: 'Intraday positions, close by market end',
    preferredTimeframes: ['5m', '15m', '1h'],
    rsiOverbought: 70,
    rsiOversold: 30,
    adxStrengthThreshold: 25,
    riskTolerance: 'medium',
  },
  swingtrader: {
    id: 'swingtrader',
    name: 'Swing Trader',
    description: 'Hold for days to weeks',
    preferredTimeframes: ['1h', '4h'],
    rsiOverbought: 70,
    rsiOversold: 30,
    adxStrengthThreshold: 25,
    riskTolerance: 'medium',
  },
  investor: {
    id: 'investor',
    name: 'Investor',
    description: 'Long-term holds, fundamental focus',
    preferredTimeframes: ['4h'],
    rsiOverbought: 80,
    rsiOversold: 20,
    adxStrengthThreshold: 30,
    riskTolerance: 'low',
  },
};

const STYLE_STORAGE_KEY = 'traderpunk_trading_style';

export async function getTradingStyle(): Promise<TradingStyle> {
  try {
    const saved = await AsyncStorage.getItem(STYLE_STORAGE_KEY);
    if (saved && (saved in tradingStyles)) {
      return saved as TradingStyle;
    }
  } catch (error) {
    console.error('Error loading trading style:', error);
  }
  return 'daytrader';
}

export async function setTradingStyle(style: TradingStyle): Promise<void> {
  try {
    await AsyncStorage.setItem(STYLE_STORAGE_KEY, style);
  } catch (error) {
    console.error('Error saving trading style:', error);
  }
}

export function getTimeframeRiskLevel(timeframe: string, style: TradingStyle): {
  level: 'low' | 'medium' | 'high' | 'extreme';
  warning: string;
} {
  const safeStyle = style || 'daytrader';
  const safeTimeframe = timeframe || '1h';
  const config = tradingStyles[safeStyle];
  const isPreferred = config.preferredTimeframes.includes(safeTimeframe);
  
  const riskWarnings: Record<string, { level: 'low' | 'medium' | 'high' | 'extreme'; warning: string }> = {
    '1m': {
      level: 'extreme',
      warning: 'Extreme volatility. Noise dominates signal. Only for experienced scalpers with strict stops.',
    },
    '3m': {
      level: 'high',
      warning: 'High noise ratio. False signals common. Use tight stop-losses and quick exits.',
    },
    '5m': {
      level: 'high',
      warning: 'Fast-paced action. Whipsaws frequent. Requires constant monitoring.',
    },
    '15m': {
      level: 'medium',
      warning: 'Moderate volatility. Better signal clarity but still requires active management.',
    },
    '1h': {
      level: 'medium',
      warning: 'Balanced timeframe. Good for trend confirmation but watch for sudden reversals.',
    },
    '4h': {
      level: 'low',
      warning: 'Clearer trends visible. Better for patience-based strategies. Less noise.',
    },
  };
  
  const baseRisk = riskWarnings[safeTimeframe] || { level: 'medium', warning: 'Standard market conditions apply.' };
  
  if (!isPreferred) {
    return {
      ...baseRisk,
      warning: `Not your typical timeframe. ${baseRisk.warning}`,
    };
  }
  
  return baseRisk;
}
