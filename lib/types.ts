export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CryptoSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  isFutures: boolean;
}


export type TimeInterval = '1m' | '3m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export const TIME_INTERVALS: { label: string; value: TimeInterval }[] = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '5M', value: '5m' },
  { label: '15M', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
];

export interface IndicatorData {
  macd: { macd: number; signal: number; histogram: number }[];
  rsi: number[];
  obv: number[];
  volume: number[];
  bop: number[];
  adx: { adx: number; plusDI: number; minusDI: number }[];
}

export interface AIAnalysis {
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence?: number;
  longConfidence?: number;
  shortConfidence?: number;
  summary: string;
  technicalAnalysis: string;
  sentimentAnalysis: string;
  fearGreedIndex: number;
  fearGreedLabel: string;
}
