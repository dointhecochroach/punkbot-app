import { Candle, CryptoSymbol, TimeInterval } from './types';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const BINANCE_SPOT_URLS = ['https://api.binance.us', 'https://api.binance.com'];
const BINANCE_FUTURES_URL = 'https://fapi.binance.com';

const COIN_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana',
  XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', DOT: 'polkadot',
  MATIC: 'matic-network', LINK: 'chainlink', AVAX: 'avalanche-2',
  ATOM: 'cosmos', UNI: 'uniswap', LTC: 'litecoin', SHIB: 'shiba-inu',
  TRX: 'tron', NEAR: 'near', APT: 'aptos', ARB: 'arbitrum',
  OP: 'optimism', FIL: 'filecoin', ICP: 'internet-computer',
  HBAR: 'hedera-hashgraph', VET: 'vechain', ALGO: 'algorand',
  FTM: 'fantom', SAND: 'the-sandbox', MANA: 'decentraland',
  AAVE: 'aave', GRT: 'the-graph', STX: 'blockstack', IMX: 'immutable-x',
  INJ: 'injective-protocol', SUI: 'sui', SEI: 'sei-network',
  TIA: 'celestia', JUP: 'jupiter-exchange-solana', PEPE: 'pepe',
  WIF: 'dogwifcoin', BONK: 'bonk', FLOKI: 'floki',
  RENDER: 'render-token', FET: 'fetch-ai', RNDR: 'render-token',
  TAO: 'bittensor', JASMY: 'jasmycoin', CHZ: 'chiliz',
  ENS: 'ethereum-name-service', CRV: 'curve-dao-token', LDO: 'lido-dao',
  MKR: 'maker', COMP: 'compound-governance-token', SNX: 'havven',
  RUNE: 'thorchain', EGLD: 'elrond-erd-2', THETA: 'theta-token',
  XLM: 'stellar', EOS: 'eos', FLOW: 'flow', NEO: 'neo',
  KAVA: 'kava', ZIL: 'zilliqa', ENJ: 'enjincoin', BAT: 'basic-attention-token',
  ZEC: 'zcash', DASH: 'dash', XMR: 'monero', ETC: 'ethereum-classic',
  BCH: 'bitcoin-cash', USDT: 'tether', USDC: 'usd-coin',
  TON: 'the-open-network', TRUMP: 'official-trump', WLD: 'worldcoin-wld',
  PI: 'pi-network', KAS: 'kaspa', POL: 'polygon-ecosystem-token',
};

const REVERSE_COIN_MAP: Record<string, string> = {};
Object.entries(COIN_ID_MAP).forEach(([sym, id]) => {
  REVERSE_COIN_MAP[id] = sym;
});

const TOP_SYMBOLS: CryptoSymbol[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'ATOMUSDT', baseAsset: 'ATOM', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'SHIBUSDT', baseAsset: 'SHIB', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'TRXUSDT', baseAsset: 'TRX', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'NEARUSDT', baseAsset: 'NEAR', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'APTUSDT', baseAsset: 'APT', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'ARBUSDT', baseAsset: 'ARB', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'OPUSDT', baseAsset: 'OP', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'FILUSDT', baseAsset: 'FIL', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'SUIUSDT', baseAsset: 'SUI', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'SEIUSDT', baseAsset: 'SEI', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'PEPEUSDT', baseAsset: 'PEPE', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'INJUSDT', baseAsset: 'INJ', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'FETUSDT', baseAsset: 'FET', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'RENDERUSDT', baseAsset: 'RENDER', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'TAOUSDT', baseAsset: 'TAO', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'XLMUSDT', baseAsset: 'XLM', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'ETCUSDT', baseAsset: 'ETC', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'BCHUSDT', baseAsset: 'BCH', quoteAsset: 'USDT', isFutures: false },
  { symbol: 'TONUSDT', baseAsset: 'TON', quoteAsset: 'USDT', isFutures: false },
];

const FUTURES_SYMBOLS: CryptoSymbol[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', isFutures: true },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', isFutures: true },
];

let cachedPrices: Record<string, { price: number; change: number; changePercent: number; time: number }> = {};

async function fetchWithTimeout(url: string, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    globalThis.clearTimeout(id);
    return response;
  } catch (e) {
    globalThis.clearTimeout(id);
    throw e;
  }
}

async function coinGeckoMarkets(page: number = 1, perPage: number = 100): Promise<any[] | null> {
  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h`,
      12000
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.log('CoinGecko markets fetch failed:', e);
  }
  return null;
}

function coinDataToSymbol(coin: any): CryptoSymbol | null {
  const sym = (coin.symbol || '').toUpperCase();
  if (!sym || sym === 'USDT' || sym === 'USDC' || sym === 'DAI' || sym === 'BUSD') return null;
  return {
    symbol: sym + 'USDT',
    baseAsset: sym,
    quoteAsset: 'USDT',
    isFutures: false,
  };
}

function cacheCoinPrice(coin: any) {
  const sym = (coin.symbol || '').toUpperCase();
  cachedPrices[sym + 'USDT'] = {
    price: coin.current_price || 0,
    change: coin.price_change_24h || 0,
    changePercent: coin.price_change_percentage_24h || 0,
    time: Date.now(),
  };
}

export async function fetchSpotSymbols(): Promise<CryptoSymbol[]> {
  try {
    const data = await coinGeckoMarkets(1, 100);
    if (data && data.length > 0) {
      data.forEach(cacheCoinPrice);
      const symbols = data.map(coinDataToSymbol).filter(Boolean) as CryptoSymbol[];
      if (symbols.length > 0) return symbols;
    }
  } catch (e) {
    console.log('fetchSpotSymbols CoinGecko failed:', e);
  }

  return TOP_SYMBOLS;
}

export async function fetchFuturesSymbols(): Promise<CryptoSymbol[]> {
  return FUTURES_SYMBOLS;
}

export async function fetchAllSymbols(): Promise<CryptoSymbol[]> {
  try {
    const spot = await fetchSpotSymbols();
    const futures = FUTURES_SYMBOLS;

    const combined = [...(Array.isArray(spot) ? spot : TOP_SYMBOLS), ...futures];
    return combined;
  } catch {
    return [...TOP_SYMBOLS, ...FUTURES_SYMBOLS];
  }
}

function intervalToCoinGeckoDays(interval: TimeInterval): number {
  switch (interval) {
    case '1m': case '3m': case '5m': case '15m': return 1;
    case '1h': return 1;
    case '4h': return 7;
    case '1d': return 30;
    case '1w': return 180;
    default: return 1;
  }
}

async function tryCoinGeckoOHLC(baseAsset: string, interval: TimeInterval): Promise<Candle[] | null> {
  const coinId = COIN_ID_MAP[baseAsset.toUpperCase()];
  if (!coinId) return null;

  const days = intervalToCoinGeckoDays(interval);

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
      12000
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((k: number[]) => ({
          time: k[0],
          open: k[1],
          high: k[2],
          low: k[3],
          close: k[3],
          volume: Math.abs(k[2] - k[3]) * 1000 + Math.random() * 500,
        }));
      }
    }
  } catch (e) {
    console.log('CoinGecko OHLC failed for', baseAsset, e);
  }
  return null;
}

async function tryBinanceKlines(symbol: string, interval: string, limit: number, isFutures: boolean): Promise<Candle[] | null> {
  const urls = isFutures
    ? [`${BINANCE_FUTURES_URL}/fapi/v1/klines`]
    : BINANCE_SPOT_URLS.map(u => `${u}/api/v3/klines`);

  for (const baseUrl of urls) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}?symbol=${symbol}&interval=${interval}&limit=${limit}`, 6000);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((k: any[]) => ({
            time: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
          }));
        }
      }
    } catch {}
  }
  return null;
}

export async function fetchKlines(
  symbol: string,
  interval: TimeInterval,
  isFutures: boolean = false,
  limit: number = 100
): Promise<Candle[]> {
  const baseAsset = symbol.replace(/USDT$|BUSD$|USD$/, '');

  try {
    const cgCandles = await tryCoinGeckoOHLC(baseAsset, interval);
    if (cgCandles && cgCandles.length > 0) return cgCandles;
  } catch {}

  try {
    const binanceCandles = await tryBinanceKlines(symbol, interval, limit, isFutures);
    if (binanceCandles && binanceCandles.length > 0) return binanceCandles;
  } catch {}

  return [];
}

export async function fetchCurrentPrice(
  symbol: string,
  isFutures: boolean = false
): Promise<number | null> {
  const cached = cachedPrices[symbol];
  if (cached && Date.now() - cached.time < 30000) {
    return cached.price;
  }

  try {
    const baseAsset = symbol.replace(/USDT$|BUSD$|USD$/, '');
    const coinId = COIN_ID_MAP[baseAsset.toUpperCase()];
    if (coinId) {
      const response = await fetchWithTimeout(
        `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
        10000
      );
      if (response.ok) {
        const data = await response.json();
        if (data[coinId]?.usd) {
          const price = data[coinId].usd;
          cachedPrices[symbol] = {
            price,
            change: 0,
            changePercent: data[coinId].usd_24h_change || 0,
            time: Date.now(),
          };
          return price;
        }
      }
    }
  } catch {}

  try {
    const urls = isFutures
      ? [`${BINANCE_FUTURES_URL}/fapi/v1/ticker/price`]
      : BINANCE_SPOT_URLS.map(u => `${u}/api/v3/ticker/price`);

    for (const url of urls) {
      try {
        const response = await fetchWithTimeout(`${url}?symbol=${symbol}`, 5000);
        if (response.ok) {
          const data = await response.json();
          if (data.price) {
            const price = parseFloat(data.price);
            cachedPrices[symbol] = {
              price,
              change: cachedPrices[symbol]?.change || 0,
              changePercent: cachedPrices[symbol]?.changePercent || 0,
              time: Date.now(),
            };
            return price;
          }
        }
      } catch {}
    }
  } catch {}

  return cached?.price || null;
}

export async function fetch24hrChange(
  symbol: string,
  isFutures: boolean = false
): Promise<{ priceChange: number; priceChangePercent: number } | null> {
  const cached = cachedPrices[symbol];
  if (cached && Date.now() - cached.time < 30000 && cached.changePercent !== 0) {
    return { priceChange: cached.change, priceChangePercent: cached.changePercent };
  }

  try {
    const baseAsset = symbol.replace(/USDT$|BUSD$|USD$/, '');
    const coinId = COIN_ID_MAP[baseAsset.toUpperCase()];
    if (coinId) {
      const response = await fetchWithTimeout(
        `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
        10000
      );
      if (response.ok) {
        const data = await response.json();
        if (data[coinId]) {
          const changePercent = data[coinId].usd_24h_change || 0;
          const price = data[coinId].usd || 0;
          const change = price * (changePercent / 100);
          cachedPrices[symbol] = {
            price: price || cachedPrices[symbol]?.price || 0,
            change,
            changePercent,
            time: Date.now(),
          };
          return { priceChange: change, priceChangePercent: changePercent };
        }
      }
    }
  } catch {}

  try {
    const urls = isFutures
      ? [`${BINANCE_FUTURES_URL}/fapi/v1/ticker/24hr`]
      : BINANCE_SPOT_URLS.map(u => `${u}/api/v3/ticker/24hr`);

    for (const url of urls) {
      try {
        const response = await fetchWithTimeout(`${url}?symbol=${symbol}`, 5000);
        if (response.ok) {
          const data = await response.json();
          if (data.priceChange !== undefined) {
            const result = {
              priceChange: parseFloat(data.priceChange) || 0,
              priceChangePercent: parseFloat(data.priceChangePercent) || 0,
            };
            cachedPrices[symbol] = {
              price: cachedPrices[symbol]?.price || 0,
              change: result.priceChange,
              changePercent: result.priceChangePercent,
              time: Date.now(),
            };
            return result;
          }
        }
      } catch {}
    }
  } catch {}

  if (cached) {
    return { priceChange: cached.change, priceChangePercent: cached.changePercent };
  }

  return null;
}
