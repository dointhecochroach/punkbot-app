import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SPOT_BASE_URL = 'https://api.binance.us';
const SPOT_FALLBACK_URL = 'https://api.binance.com';
const FUTURES_BASE_URL = 'https://fapi.binance.com';

const DEMO_SPOT_SYMBOLS = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'ATOMUSDT', baseAsset: 'ATOM', quoteAsset: 'USDT', isFutures: false },
];

const DEMO_FUTURES_SYMBOLS = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', isFutures: true },
];

function generateDemoCandles(count: number = 100): any[] {
  const candles = [];
  let basePrice = 45000 + Math.random() * 5000;
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility;
    const open = basePrice;
    const close = basePrice * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = 100 + Math.random() * 1000;
    
    candles.push({
      time: now - (count - i) * 60000,
      open,
      high,
      low,
      close,
      volume,
    });
    
    basePrice = close;
  }
  
  return candles;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get("/api/symbols/spot", async (req: Request, res: Response) => {
    try {
      let data: any = null;
      for (const baseUrl of [SPOT_BASE_URL, SPOT_FALLBACK_URL]) {
        try {
          const response = await fetch(`${baseUrl}/api/v3/exchangeInfo`);
          if (response.ok) {
            const json = await response.json();
            if (json.symbols && Array.isArray(json.symbols)) {
              data = json;
              break;
            }
          }
        } catch { }
      }
      
      if (!data) {
        console.log('Binance spot API unavailable, using demo data');
        res.json(DEMO_SPOT_SYMBOLS);
        return;
      }
      
      const symbols = data.symbols
        .filter((s: any) => s.status === 'TRADING')
        .map((s: any) => ({
          symbol: s.symbol,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset,
          isFutures: false,
        }));
      
      res.json(symbols.length > 0 ? symbols : DEMO_SPOT_SYMBOLS);
    } catch (error) {
      console.error('Error fetching spot symbols:', error);
      res.json(DEMO_SPOT_SYMBOLS);
    }
  });
  
  app.get("/api/symbols/futures", async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${FUTURES_BASE_URL}/fapi/v1/exchangeInfo`);
      if (!response.ok) {
        res.json(DEMO_FUTURES_SYMBOLS);
        return;
      }
      const data = await response.json();
      
      if (!data.symbols || !Array.isArray(data.symbols)) {
        res.json(DEMO_FUTURES_SYMBOLS);
        return;
      }
      
      const symbols = data.symbols
        .filter((s: any) => s.status === 'TRADING')
        .map((s: any) => ({
          symbol: s.symbol,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset,
          isFutures: true,
        }));
      
      res.json(symbols.length > 0 ? symbols : DEMO_FUTURES_SYMBOLS);
    } catch (error) {
      console.error('Error fetching futures symbols:', error);
      res.json(DEMO_FUTURES_SYMBOLS);
    }
  });
  
  app.get("/api/klines/:symbol", async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { interval = '1h', limit = '100', futures = 'false' } = req.query;
      
      const isFutures = futures === 'true';
      const endpoint = isFutures ? '/fapi/v1/klines' : '/api/v3/klines';
      const urls = isFutures
        ? [`${FUTURES_BASE_URL}${endpoint}`]
        : [`${SPOT_BASE_URL}${endpoint}`, `${SPOT_FALLBACK_URL}${endpoint}`];
      
      let data: any = null;
      for (const url of urls) {
        try {
          const response = await fetch(`${url}?symbol=${symbol}&interval=${interval}&limit=${limit}`);
          if (response.ok) {
            const json = await response.json();
            if (Array.isArray(json) && json.length > 0) {
              data = json;
              break;
            }
          }
        } catch { }
      }
      
      if (!data) {
        res.json(generateDemoCandles(parseInt(limit as string) || 100));
        return;
      }
      
      const candles = data.map((k: any[]) => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));
      
      res.json(candles);
    } catch (error) {
      console.error('Error fetching klines:', error);
      res.json(generateDemoCandles(100));
    }
  });
  
  app.get("/api/price/:symbol", async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { futures = 'false' } = req.query;
      
      const isFutures = futures === 'true';
      const endpoint = isFutures ? '/fapi/v1/ticker/price' : '/api/v3/ticker/price';
      const urls = isFutures
        ? [`${FUTURES_BASE_URL}${endpoint}`]
        : [`${SPOT_BASE_URL}${endpoint}`, `${SPOT_FALLBACK_URL}${endpoint}`];
      
      for (const url of urls) {
        try {
          const response = await fetch(`${url}?symbol=${symbol}`);
          if (response.ok) {
            const data = await response.json();
            if (data.price) {
              res.json({ price: parseFloat(data.price) });
              return;
            }
          }
        } catch { }
      }
      
      res.json({ price: 45000 + Math.random() * 1000 });
    } catch (error) {
      console.error('Error fetching price:', error);
      res.json({ price: 45000 + Math.random() * 1000 });
    }
  });
  
  app.get("/api/ticker/:symbol", async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { futures = 'false' } = req.query;
      
      const isFutures = futures === 'true';
      const endpoint = isFutures ? '/fapi/v1/ticker/24hr' : '/api/v3/ticker/24hr';
      const urls = isFutures
        ? [`${FUTURES_BASE_URL}${endpoint}`]
        : [`${SPOT_BASE_URL}${endpoint}`, `${SPOT_FALLBACK_URL}${endpoint}`];
      
      for (const url of urls) {
        try {
          const response = await fetch(`${url}?symbol=${symbol}`);
          if (response.ok) {
            const data = await response.json();
            if (data.priceChange !== undefined) {
              res.json({
                priceChange: parseFloat(data.priceChange) || 0,
                priceChangePercent: parseFloat(data.priceChangePercent) || 0,
              });
              return;
            }
          }
        } catch { }
      }
      
      const change = (Math.random() - 0.5) * 5;
      res.json({ priceChange: change * 100, priceChangePercent: change });
    } catch (error) {
      console.error('Error fetching ticker:', error);
      const change = (Math.random() - 0.5) * 5;
      res.json({ priceChange: change * 100, priceChangePercent: change });
    }
  });

  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      const { symbol, price, priceChange, indicators, fearGreedIndex, timeframe, tradingStyle } = req.body;
      
      const prompt = `You are "PunkBot" - a witty, street-smart crypto analyst with a cyberpunk attitude. You give solid trading analysis but with personality. Keep humor subtle and professional.

Analyze this crypto data for ${symbol}:

Current Price: $${price}
24h Change: ${priceChange}%
Timeframe: ${timeframe || '1h'}
Trading Style: ${tradingStyle || 'daytrader'}

Technical Indicators:
- RSI (14): ${indicators?.rsi?.toFixed(2) || 'N/A'} ${indicators?.rsi > 70 ? '(Overbought!)' : indicators?.rsi < 30 ? '(Oversold!)' : ''}
- MACD: ${indicators?.macd?.macd?.toFixed(4) || 'N/A'}
- MACD Signal: ${indicators?.macd?.signal?.toFixed(4) || 'N/A'}
- MACD Histogram: ${indicators?.macd?.histogram?.toFixed(4) || 'N/A'}
- ADX: ${indicators?.adx?.adx?.toFixed(2) || 'N/A'} ${indicators?.adx?.adx > 25 ? '(Strong trend)' : '(Weak trend)'}
- +DI: ${indicators?.adx?.plusDI?.toFixed(2) || 'N/A'}
- -DI: ${indicators?.adx?.minusDI?.toFixed(2) || 'N/A'}
- Balance of Power: ${indicators?.bop?.toFixed(4) || 'N/A'}
- OBV Trend: ${indicators?.obvTrend || 'N/A'}

Crypto Fear & Greed Index: ${fearGreedIndex?.value || 'N/A'} (${fearGreedIndex?.classification || 'N/A'})

Calculate separate confidence percentages for LONG and SHORT positions based on indicators.
Consider the timeframe when assessing risk - shorter timeframes = higher noise and risk.

BE SPECIFIC in your analysis:
- Mention actual RSI value and what zone it's in (not just "RSI suggests...")
- State if MACD histogram is expanding or contracting, and the crossover status
- Note the exact ADX value and whether +DI leads -DI or vice versa
- Reference the price change percentage when discussing momentum
- If Fear & Greed is extreme, mention how that affects entry timing

Provide analysis as JSON:
{
  "signal": "LONG" or "SHORT" or "NEUTRAL",
  "longConfidence": 0-100 (how confident for a long position),
  "shortConfidence": 0-100 (how confident for a short position),
  "summary": "2-3 sentence recommendation with personality. Mention specific price levels or indicator values.",
  "technicalAnalysis": "4-5 sentences with SPECIFIC numbers. Example: 'RSI at 72.3 is in overbought territory. MACD histogram at 0.0023 shows momentum fading. ADX at 31 with +DI(28) > -DI(15) confirms bullish trend but watch for exhaustion.'",
  "sentimentAnalysis": "2-3 sentences on market mood, reference Fear & Greed value specifically",
  "keyConsiderations": ["Array of 4-5 specific actionable items with numbers where relevant. Example: 'Watch for RSI drop below 70 for short entry', 'Support at previous session low around $X'"],
  "riskWarning": "One sentence about main risk for this timeframe with specific concern"
}

ADX Analysis Guide:
- ADX < 20: No trend, avoid trending strategies
- ADX 20-25: Possible trend forming
- ADX 25-50: Strong trend present
- ADX > 50: Extremely strong trend
- +DI > -DI: Bullish pressure
- -DI > +DI: Bearish pressure

Also include social media sentiment analysis. Simulate scanning social platforms for mentions, buzz, and sentiment about ${symbol}. Base the scores on the current market conditions, indicator readings, and price action.

Additionally include in the JSON:
  "socialSentiment": {
    "reddit": { "score": 0-100 (buzz/mention intensity), "sentiment": "bullish" or "bearish" or "neutral" },
    "twitter": { "score": 0-100, "sentiment": "bullish" or "bearish" or "neutral" },
    "telegram": { "score": 0-100, "sentiment": "bullish" or "bearish" or "neutral" },
    "discord": { "score": 0-100, "sentiment": "bullish" or "bearish" or "neutral" },
    "youtube": { "score": 0-100, "sentiment": "bullish" or "bearish" or "neutral" }
  },
  "socialConclusion": "2-3 sentences summarizing overall social media sentiment. Mention which platforms are most active and whether social buzz aligns with or contradicts the technical signals. Use PunkBot personality."

Respond with ONLY valid JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content || "{}";
      
      let analysis;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);
        
        if (!analysis.longConfidence) analysis.longConfidence = 50;
        if (!analysis.shortConfidence) analysis.shortConfidence = 50;
        if (!analysis.socialSentiment) {
          analysis.socialSentiment = {
            reddit: { score: 45, sentiment: "neutral" },
            twitter: { score: 50, sentiment: "neutral" },
            telegram: { score: 40, sentiment: "neutral" },
            discord: { score: 35, sentiment: "neutral" },
            youtube: { score: 30, sentiment: "neutral" },
          };
        }
        if (!analysis.socialConclusion) {
          analysis.socialConclusion = "Social feeds are quiet. The crowd hasn't picked a side yet, punk.";
        }
      } catch {
        analysis = {
          signal: "NEUTRAL",
          longConfidence: 50,
          shortConfidence: 50,
          summary: "The matrix is glitching. Try again, punk.",
          technicalAnalysis: "Analysis circuits fried. Stand by.",
          sentimentAnalysis: "Sentiment scanners offline.",
          keyConsiderations: ["Wait for system reboot", "Check your connection"],
          riskWarning: "Technical difficulties. Trade with caution.",
          socialSentiment: {
            reddit: { score: 45, sentiment: "neutral" },
            twitter: { score: 50, sentiment: "neutral" },
            telegram: { score: 40, sentiment: "neutral" },
            discord: { score: 35, sentiment: "neutral" },
            youtube: { score: 30, sentiment: "neutral" },
          },
          socialConclusion: "Social scanners offline. Can't read the crowd right now.",
        };
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error in AI analysis:", error);
      res.status(500).json({ error: "Failed to generate analysis" });
    }
  });

  app.post("/api/trade-idea", async (req: Request, res: Response) => {
    try {
      const { symbol, price, indicators, pivotPoints, fibonacci, fearGreedIndex, timeframe, tradingStyle } = req.body;
      
      const prompt = `You are "PunkBot" - a precision-focused crypto trade analyst. Generate a SPECIFIC, ACTIONABLE trade setup.

Symbol: ${symbol}
Current Price: $${price}
Timeframe: ${timeframe || '1h'}
Trading Style: ${tradingStyle || 'daytrader'}

TECHNICAL INDICATORS:
- RSI (14): ${indicators?.rsi?.toFixed(2) || 'N/A'}
- MACD: ${indicators?.macd?.macd?.toFixed(4) || 'N/A'} (Signal: ${indicators?.macd?.signal?.toFixed(4) || 'N/A'})
- MACD Histogram: ${indicators?.macd?.histogram?.toFixed(4) || 'N/A'}
- ADX: ${indicators?.adx?.adx?.toFixed(2) || 'N/A'} (+DI: ${indicators?.adx?.plusDI?.toFixed(2) || 'N/A'}, -DI: ${indicators?.adx?.minusDI?.toFixed(2) || 'N/A'})
- Balance of Power: ${indicators?.bop?.toFixed(4) || 'N/A'}
- OBV Trend: ${indicators?.obvTrend || 'N/A'}

PIVOT POINTS:
- Pivot: $${pivotPoints?.pivot?.toFixed(2) || 'N/A'}
- R1: $${pivotPoints?.r1?.toFixed(2) || 'N/A'}, R2: $${pivotPoints?.r2?.toFixed(2) || 'N/A'}, R3: $${pivotPoints?.r3?.toFixed(2) || 'N/A'}
- S1: $${pivotPoints?.s1?.toFixed(2) || 'N/A'}, S2: $${pivotPoints?.s2?.toFixed(2) || 'N/A'}, S3: $${pivotPoints?.s3?.toFixed(2) || 'N/A'}

FIBONACCI LEVELS:
- Range High: $${fibonacci?.high?.toFixed(2) || 'N/A'}, Low: $${fibonacci?.low?.toFixed(2) || 'N/A'}
- 23.6%: $${fibonacci?.level236?.toFixed(2) || 'N/A'}
- 38.2%: $${fibonacci?.level382?.toFixed(2) || 'N/A'}
- 50.0%: $${fibonacci?.level500?.toFixed(2) || 'N/A'}
- 61.8%: $${fibonacci?.level618?.toFixed(2) || 'N/A'}
- 78.6%: $${fibonacci?.level786?.toFixed(2) || 'N/A'}
- Extension 127.2%: $${fibonacci?.extension1272?.toFixed(2) || 'N/A'}
- Extension 161.8%: $${fibonacci?.extension1618?.toFixed(2) || 'N/A'}

Fear & Greed Index: ${fearGreedIndex?.value || 'N/A'} (${fearGreedIndex?.classification || 'N/A'})

TASK: Generate a precise trade setup using these levels AND social media sentiment. Choose entry near support/Fib levels for LONG, or near resistance/Fib levels for SHORT. Use Fibonacci extensions and pivot resistance/support for take profit targets. Place stop loss at logical invalidation point.

SOCIAL POWER ANALYSIS: Simulate scanning social media platforms (Reddit, X/Twitter, Telegram, Discord, YouTube) for mentions, buzz, and sentiment about ${symbol}. The social sentiment data MUST directly influence your trade direction, confidence, and quality score. If social buzz is strongly bearish but technicals say LONG, lower your confidence. If social + technicals align, boost confidence. Social media consensus is a KEY factor in validating or rejecting a trade idea.

FINAL VERDICT: Combine ALL data sources — technicals, Fear & Greed (${fearGreedIndex?.value || 'N/A'} = ${fearGreedIndex?.classification || 'N/A'}), social media power, pivots, Fibonacci — into ONE short decisive verdict (2-3 sentences MAX). Be punchy and specific. State GO or CAUTION clearly.

Provide response as JSON:
{
  "direction": "LONG" or "SHORT",
  "entryPrice": (number - precise entry based on current price and nearby levels),
  "stopLoss": (number - logical invalidation level, use pivot or Fib),
  "takeProfit1": (number - first target for 33% position, conservative),
  "takeProfit2": (number - second target for 33% position, moderate),
  "takeProfit3": (number - final target for 34% position, aggressive),
  "riskRewardRatio": "1:X" (calculated from entry/SL/average TP),
  "confidence": 0-100 (based on indicator alignment),
  "qualityScore": 1-5 (overall trade idea quality: 1=Poor, 2=Fair, 3=Good, 4=Very Good, 5=Excellent),
  "qualityFactors": ["Array of 3-4 factors that contributed to the quality score, e.g. 'Strong trend confirmation', 'Clean support level', 'Good R:R ratio'"],
  "reasoning": "2-3 sentences explaining WHY this setup with specific indicator values",
  "keyLevels": ["Array of 4-5 specific price levels to monitor with context"],
  "warnings": ["Array of 2-3 specific risks for this trade"],
  "socialSentiment": {
    "reddit": { "score": 0-100 (buzz/mention intensity), "sentiment": "bullish" or "bearish" or "neutral" },
    "twitter": { "score": 0-100, "sentiment": "bullish" or "bearish" or "neutral" },
    "telegram": { "score": 0-100, "sentiment": "bullish" or "bearish" or "neutral" },
    "discord": { "score": 0-100, "sentiment": "bullish" or "bearish" or "neutral" },
    "youtube": { "score": 0-100, "sentiment": "bullish" or "bearish" or "neutral" }
  },
  "fearGreedValue": (number - the Fear & Greed index value used),
  "fearGreedLabel": "(string - the classification: Extreme Fear, Fear, Neutral, Greed, Extreme Greed)",
  "finalVerdict": "2-3 SHORT sentences max. Combine technicals, Fear & Greed, social power, and key levels. State GO or CAUTION clearly. PunkBot voice — sharp, decisive, no fluff."
}

RULES:
- Entry must be within 2% of current price (realistic entry zone)
- Stop loss must make sense (below support for LONG, above resistance for SHORT)
- Take profits should align with Fibonacci/pivot levels
- Risk/reward must be at least 1:1.5
- Be specific with actual price numbers
- Social media sentiment MUST influence your confidence score and trade validation — if social is bearish but technicals say LONG, lower confidence
- The finalVerdict MUST be 2-3 sentences max, referencing Fear & Greed plus social power plus key technicals

Respond with ONLY valid JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || "{}";
      
      let tradeIdea;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        tradeIdea = JSON.parse(jsonMatch ? jsonMatch[0] : content);
        
        if (!tradeIdea.entryPrice) tradeIdea.entryPrice = price;
        if (!tradeIdea.confidence) tradeIdea.confidence = 50;
        if (!tradeIdea.qualityScore) tradeIdea.qualityScore = 3;
        if (!tradeIdea.qualityFactors) tradeIdea.qualityFactors = [];
        if (!tradeIdea.keyLevels) tradeIdea.keyLevels = [];
        if (!tradeIdea.warnings) tradeIdea.warnings = ["Always use proper position sizing"];
        if (!tradeIdea.socialSentiment) {
          tradeIdea.socialSentiment = {
            reddit: { score: 45, sentiment: "neutral" },
            twitter: { score: 50, sentiment: "neutral" },
            telegram: { score: 40, sentiment: "neutral" },
            discord: { score: 35, sentiment: "neutral" },
            youtube: { score: 30, sentiment: "neutral" },
          };
        }
        if (!tradeIdea.fearGreedValue && fearGreedIndex?.value) {
          tradeIdea.fearGreedValue = fearGreedIndex.value;
        }
        if (!tradeIdea.fearGreedLabel && fearGreedIndex?.classification) {
          tradeIdea.fearGreedLabel = fearGreedIndex.classification;
        }
        if (!tradeIdea.finalVerdict) {
          tradeIdea.finalVerdict = "Insufficient data for a full verdict. Check technicals and social feeds manually, punk.";
        }
      } catch {
        const defaultSocial = {
          reddit: { score: 45, sentiment: "neutral" },
          twitter: { score: 50, sentiment: "neutral" },
          telegram: { score: 40, sentiment: "neutral" },
          discord: { score: 35, sentiment: "neutral" },
          youtube: { score: 30, sentiment: "neutral" },
        };
        tradeIdea = {
          direction: "LONG",
          entryPrice: price,
          stopLoss: price * 0.97,
          takeProfit1: price * 1.02,
          takeProfit2: price * 1.04,
          takeProfit3: price * 1.06,
          riskRewardRatio: "1:2",
          confidence: 50,
          qualityScore: 3,
          qualityFactors: ["Unable to fully analyze"],
          reasoning: "Trade circuits overloaded. Try again, punk.",
          keyLevels: ["Check price action manually"],
          warnings: ["System error - verify levels independently"],
          socialSentiment: defaultSocial,
          fearGreedValue: fearGreedIndex?.value || null,
          fearGreedLabel: fearGreedIndex?.classification || null,
          finalVerdict: "System glitch. Can't compile the full verdict right now. Trade carefully, punk.",
        };
      }
      
      res.json(tradeIdea);
    } catch (error) {
      console.error("Error generating trade idea:", error);
      res.status(500).json({ error: "Failed to generate trade idea" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
