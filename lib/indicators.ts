import { Candle, IndicatorData } from './types';

function ema(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = data[0];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1));
    } else if (i === period - 1) {
      prev = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
      result.push(prev);
    } else {
      prev = data[i] * k + prev * (1 - k);
      result.push(prev);
    }
  }
  return result;
}

function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1));
    } else {
      result.push(data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
    }
  }
  return result;
}

function wilderSmooth(data: number[], period: number): number[] {
  const result: number[] = [];
  let sum = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      sum += data[i];
      result.push(sum / (i + 1));
    } else {
      const prev = result[i - 1];
      result.push(prev - (prev / period) + data[i]);
    }
  }
  return result;
}

export function calculateMACD(candles: Candle[]): { macd: number; signal: number; histogram: number }[] {
  const closes = candles.map(c => c.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);
  
  return macdLine.map((m, i) => ({
    macd: m,
    signal: signalLine[i],
    histogram: m - signalLine[i],
  }));
}

export function calculateRSI(candles: Candle[], period: number = 14): number[] {
  const closes = candles.map(c => c.close);
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  
  const avgGains = sma(gains, period);
  const avgLosses = sma(losses, period);
  
  const rsi = avgGains.map((ag, i) => {
    if (avgLosses[i] === 0) return 100;
    const rs = ag / avgLosses[i];
    return 100 - (100 / (1 + rs));
  });
  
  return [50, ...rsi];
}

export function calculateOBV(candles: Candle[]): number[] {
  const result: number[] = [0];
  
  for (let i = 1; i < candles.length; i++) {
    const prevClose = candles[i - 1].close;
    const currClose = candles[i].close;
    const currVolume = candles[i].volume;
    
    if (currClose > prevClose) {
      result.push(result[i - 1] + currVolume);
    } else if (currClose < prevClose) {
      result.push(result[i - 1] - currVolume);
    } else {
      result.push(result[i - 1]);
    }
  }
  
  return result;
}

export function calculateBalanceOfPower(candles: Candle[]): number[] {
  return candles.map(c => {
    const range = c.high - c.low;
    if (range === 0) return 0;
    return (c.close - c.open) / range;
  });
}

export function calculateADX(candles: Candle[], period: number = 14): { adx: number; plusDI: number; minusDI: number }[] {
  if (candles.length < 2) {
    return candles.map(() => ({ adx: 0, plusDI: 0, minusDI: 0 }));
  }
  
  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
    
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    
    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  
  const smoothedTR = wilderSmooth(trueRanges, period);
  const smoothedPlusDM = wilderSmooth(plusDMs, period);
  const smoothedMinusDM = wilderSmooth(minusDMs, period);
  
  const plusDI: number[] = [];
  const minusDI: number[] = [];
  const dx: number[] = [];
  
  for (let i = 0; i < smoothedTR.length; i++) {
    const tr = smoothedTR[i];
    const pdi = tr > 0 ? (smoothedPlusDM[i] / tr) * 100 : 0;
    const mdi = tr > 0 ? (smoothedMinusDM[i] / tr) * 100 : 0;
    plusDI.push(pdi);
    minusDI.push(mdi);
    
    const diSum = pdi + mdi;
    dx.push(diSum > 0 ? (Math.abs(pdi - mdi) / diSum) * 100 : 0);
  }
  
  const adx = wilderSmooth(dx, period);
  
  const result: { adx: number; plusDI: number; minusDI: number }[] = [
    { adx: 0, plusDI: 0, minusDI: 0 }
  ];
  
  for (let i = 0; i < adx.length; i++) {
    result.push({
      adx: adx[i],
      plusDI: plusDI[i],
      minusDI: minusDI[i],
    });
  }
  
  return result;
}

export function calculateIndicators(candles: Candle[]): IndicatorData {
  return {
    macd: calculateMACD(candles),
    rsi: calculateRSI(candles),
    obv: calculateOBV(candles),
    volume: candles.map(c => c.volume),
    bop: calculateBalanceOfPower(candles),
    adx: calculateADX(candles),
  };
}

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export function calculatePivotPoints(candles: Candle[]): PivotPoints {
  if (candles.length === 0) {
    return { pivot: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 };
  }
  
  const lastCandle = candles[candles.length - 1];
  const high = Math.max(...candles.slice(-20).map(c => c.high));
  const low = Math.min(...candles.slice(-20).map(c => c.low));
  const close = lastCandle.close;
  
  const pivot = (high + low + close) / 3;
  const range = high - low;
  
  return {
    pivot,
    r1: (2 * pivot) - low,
    r2: pivot + range,
    r3: pivot + (2 * range),
    s1: (2 * pivot) - high,
    s2: pivot - range,
    s3: pivot - (2 * range),
  };
}

export interface FibonacciLevels {
  high: number;
  low: number;
  level236: number;
  level382: number;
  level500: number;
  level618: number;
  level786: number;
  extension1272: number;
  extension1618: number;
}

export function calculateFibonacciLevels(candles: Candle[]): FibonacciLevels {
  if (candles.length === 0) {
    return { high: 0, low: 0, level236: 0, level382: 0, level500: 0, level618: 0, level786: 0, extension1272: 0, extension1618: 0 };
  }
  
  const recentCandles = candles.slice(-50);
  const high = Math.max(...recentCandles.map(c => c.high));
  const low = Math.min(...recentCandles.map(c => c.low));
  const range = high - low;
  
  const lastClose = candles[candles.length - 1].close;
  const isUptrend = lastClose > (high + low) / 2;
  
  if (isUptrend) {
    return {
      high,
      low,
      level236: high - (range * 0.236),
      level382: high - (range * 0.382),
      level500: high - (range * 0.5),
      level618: high - (range * 0.618),
      level786: high - (range * 0.786),
      extension1272: high + (range * 0.272),
      extension1618: high + (range * 0.618),
    };
  } else {
    return {
      high,
      low,
      level236: low + (range * 0.236),
      level382: low + (range * 0.382),
      level500: low + (range * 0.5),
      level618: low + (range * 0.618),
      level786: low + (range * 0.786),
      extension1272: low - (range * 0.272),
      extension1618: low - (range * 0.618),
    };
  }
}
