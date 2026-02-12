# PunkBot

## Overview

PunkBot is a cyberpunk-styled cryptocurrency charting and analysis app built with Expo/React Native for Android. The app provides real-time price tracking, technical indicator analysis, and AI-powered trading recommendations with personality.

Key features include:
- Real-time candlestick/line charts with multiple timeframes (1M, 3M, 5M, 15M, 1H, 4H)
- Technical indicators with labels (MACD, RSI, OBV, ADX, Balance of Power, Volume)
- AI-powered "PunkBot" analysis with humor, advice, and risk considerations
- Fear & Greed Index integration
- Three distinct themes: Cyberpunk (purple), Neon Line (blue), Classic (green/red)
- Favorites system with local storage persistence
- Support for both Binance spot and futures markets

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- PunkBot AI analysis now auto-triggers when chart loads or parameters change (no manual button)
- AIAnalysis card redesigned with cyberpunk terminal frame: corner accents, circuit line SVG overlays, status dot header
- Confidence meters glow intensely at higher percentages with dynamic shadow radius and text glow above 60%
- Renamed app to "TraderPunk" with cyberpunk aesthetic
- Added theme switching system (Cyberpunk, Neon Line, Classic)
- Added small label badges to all technical indicators
- Enhanced AI analysis with humor, key considerations, and risk warnings
- Fixed Binance API CORS issues by proxying through Express backend
- Added demo data fallback when Binance API is geo-restricted
- Added dual confidence meters (Long/Short) with animated glow effects
- Added timeframe-specific risk warnings (extreme, high, medium, low)
- Added trading style presets (Scalper, Day Trader, Swing Trader, Investor)
- ADX indicator now displays +DI and -DI lines for trend direction analysis
- Added Signals vs Alerts mode toggle
- Added configurable alerts system (price levels, RSI thresholds, ADX, MACD crossovers)
- Added "Why this signal?" explainer that breaks down each indicator's contribution
- Enhanced AI analysis to be more specific with actual indicator values
- Added "Punk a Trade Idea" feature with pivot points, Fibonacci levels, entry/exit targets
- Added social media sentiment section in AI analysis with platform logos (Reddit, X, Telegram, Discord, YouTube), confidence scores, and sentiment labels
- Added SOCIAL.VERDICT conclusion section below AI analysis summarizing social media buzz

## System Architecture

### Frontend Architecture (Expo/React Native)
- **Framework**: Expo SDK 54 with React Native 0.81
- **Routing**: expo-router with file-based routing (Stack navigation)
- **State Management**: React Query for server state, React Context for theme, useState for local UI
- **Styling**: React Native StyleSheet with theme system in `lib/themes.ts`
- **Charts**: Custom SVG-based charts using react-native-svg
- **Fonts**: Inter font family via @expo-google-fonts

### Backend Architecture (Express)
- **Runtime**: Node.js with Express
- **API Proxy**: Proxies Binance API calls to avoid CORS issues
- **AI Integration**: OpenAI API for PunkBot analysis
- **Demo Data**: Fallback symbols and candles when Binance is unavailable

### Theme System
Three themes stored in `lib/themes.ts`:
1. **Cyberpunk**: Purple accents, cyan bullish, magenta bearish, candlestick chart
2. **Neon Line**: Blue accents, line chart style, sleek dark background
3. **Classic**: Traditional green/red candles, dark background

Theme persisted to AsyncStorage via `lib/ThemeContext.tsx`

### Key Components
- `components/CandlestickChart.tsx` - Price chart (candle or line based on theme)
- `components/IndicatorChart.tsx` - Technical indicator with label badge
- `components/VolumeChart.tsx` - Volume bars with label
- `components/AIAnalysis.tsx` - PunkBot analysis card with signal, confidence, advice
- `components/ThemePicker.tsx` - Theme selection modal

### Technical Indicators (`lib/indicators.ts`)
- MACD (12, 26, 9)
- RSI (14)
- ADX (14) with +DI and -DI
- OBV (On Balance Volume)
- Balance of Power
- Volume

## External Dependencies

### Third-Party APIs
- **Binance API**: Cryptocurrency data (proxied through backend)
- **Alternative.me API**: Fear & Greed Index
- **OpenAI API**: PunkBot AI analysis

### Environment Variables Required
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL
- `EXPO_PUBLIC_DOMAIN` - Public domain for API requests
- `REPLIT_DEV_DOMAIN` - Development domain

## File Structure

```
app/
  _layout.tsx      # Root layout with providers
  index.tsx        # Home screen with symbol search
  chart.tsx        # Chart view with indicators

lib/
  themes.ts        # Theme definitions
  ThemeContext.tsx # Theme provider
  indicators.ts    # Technical indicator calculations
  binanceApi.ts    # API client for crypto data
  fearGreedApi.ts  # Fear & Greed Index client
  storage.ts       # AsyncStorage for favorites
  types.ts         # TypeScript types

components/
  CandlestickChart.tsx
  IndicatorChart.tsx
  VolumeChart.tsx
  AIAnalysis.tsx
  ThemePicker.tsx
  PriceHeader.tsx
  TimeframeSelector.tsx
  SearchBar.tsx
  SymbolList.tsx

server/
  routes.ts        # API routes (Binance proxy + AI analysis)
```
