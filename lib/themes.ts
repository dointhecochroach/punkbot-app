export type ThemeName = 'cyberpunk' | 'neonline' | 'classic';

export interface Theme {
  name: ThemeName;
  displayName: string;
  chartType: 'candle' | 'line';
  
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  card: string;
  cardBorder: string;
  
  text: string;
  textSecondary: string;
  textMuted: string;
  
  bullish: string;
  bullishFill: string;
  bearish: string;
  bearishFill: string;
  
  accent: string;
  accentLight: string;
  accentGlow: string;
  
  indicatorMACD: string;
  indicatorSignal: string;
  indicatorHistogramPos: string;
  indicatorHistogramNeg: string;
  indicatorRSI: string;
  indicatorOBV: string;
  indicatorVolume: string;
  indicatorBOP: string;
  indicatorADX: string;
  indicatorDIPlus: string;
  indicatorDIMinus: string;
  
  divider: string;
  gridLine: string;
}

export const themes: Record<ThemeName, Theme> = {
  cyberpunk: {
    name: 'cyberpunk',
    displayName: 'Cyberpunk',
    chartType: 'candle',
    
    background: '#0a0a12',
    backgroundSecondary: '#0f0f1a',
    backgroundTertiary: '#151520',
    card: '#12121e',
    cardBorder: '#2a1a3a',
    
    text: '#e0e0ff',
    textSecondary: '#9090b0',
    textMuted: '#5a5a7a',
    
    bullish: '#00ffff',
    bullishFill: 'transparent',
    bearish: '#ff00aa',
    bearishFill: '#ff00aa',
    
    accent: '#9d4edd',
    accentLight: '#c77dff',
    accentGlow: 'rgba(157, 78, 221, 0.3)',
    
    indicatorMACD: '#ff6b9d',
    indicatorSignal: '#00ffff',
    indicatorHistogramPos: '#00ff88',
    indicatorHistogramNeg: '#ff0066',
    indicatorRSI: '#00ffff',
    indicatorOBV: '#ff00ff',
    indicatorVolume: '#7b2cbf',
    indicatorBOP: '#00ff88',
    indicatorADX: '#ffd700',
    indicatorDIPlus: '#00ff88',
    indicatorDIMinus: '#ff0066',
    
    divider: '#2a1a4a',
    gridLine: '#1a1a2e',
  },
  
  neonline: {
    name: 'neonline',
    displayName: 'Neon Line',
    chartType: 'line',
    
    background: '#050510',
    backgroundSecondary: '#0a0a18',
    backgroundTertiary: '#0f0f20',
    card: '#0a0a15',
    cardBorder: '#151530',
    
    text: '#ffffff',
    textSecondary: '#8080a0',
    textMuted: '#404060',
    
    bullish: '#00aaff',
    bullishFill: 'rgba(0, 170, 255, 0.1)',
    bearish: '#00aaff',
    bearishFill: 'rgba(0, 170, 255, 0.1)',
    
    accent: '#00aaff',
    accentLight: '#40c4ff',
    accentGlow: 'rgba(0, 170, 255, 0.3)',
    
    indicatorMACD: '#00aaff',
    indicatorSignal: '#0066cc',
    indicatorHistogramPos: '#00ccff',
    indicatorHistogramNeg: '#0055aa',
    indicatorRSI: '#00ddff',
    indicatorOBV: '#0088ff',
    indicatorVolume: '#003388',
    indicatorBOP: '#00bbff',
    indicatorADX: '#00eeff',
    indicatorDIPlus: '#00ffcc',
    indicatorDIMinus: '#0055ff',
    
    divider: '#101030',
    gridLine: '#0a0a20',
  },
  
  classic: {
    name: 'classic',
    displayName: 'Classic',
    chartType: 'candle',
    
    background: '#0c0c0c',
    backgroundSecondary: '#141414',
    backgroundTertiary: '#1c1c1c',
    card: '#181818',
    cardBorder: '#2a2a2a',
    
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    textMuted: '#606060',
    
    bullish: '#66ff99',
    bullishFill: 'transparent',
    bearish: '#ff1744',
    bearishFill: '#ff1744',
    
    accent: '#66ff99',
    accentLight: '#99ffbb',
    accentGlow: 'rgba(102, 255, 153, 0.3)',
    
    indicatorMACD: '#ffab00',
    indicatorSignal: '#7c4dff',
    indicatorHistogramPos: '#66ff99',
    indicatorHistogramNeg: '#ff1744',
    indicatorRSI: '#00bcd4',
    indicatorOBV: '#e91e63',
    indicatorVolume: '#44cc77',
    indicatorBOP: '#55eebb',
    indicatorADX: '#ff9800',
    indicatorDIPlus: '#66ff99',
    indicatorDIMinus: '#f44336',
    
    divider: '#2a2a2a',
    gridLine: '#1a1a1a',
  },
};
