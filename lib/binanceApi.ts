import { Candle, CryptoSymbol, TimeInterval } from './types';
import { getApiUrl } from './query-client';

export async function fetchSpotSymbols(): Promise<CryptoSymbol[]> {
  try {
    const baseUrl = getApiUrl();
    const response = await fetch(`${baseUrl}api/symbols/spot`);
    if (!response.ok) {
      console.error('Failed to fetch spot symbols:', response.status);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching spot symbols:', error);
    return [];
  }
}

export async function fetchFuturesSymbols(): Promise<CryptoSymbol[]> {
  try {
    const baseUrl = getApiUrl();
    const response = await fetch(`${baseUrl}api/symbols/futures`);
    if (!response.ok) {
      console.error('Failed to fetch futures symbols:', response.status);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching futures symbols:', error);
    return [];
  }
}

export async function fetchAllSymbols(): Promise<CryptoSymbol[]> {
  try {
    const [spot, futures] = await Promise.all([
      fetchSpotSymbols(),
      fetchFuturesSymbols(),
    ]);
    
    const spotArray = Array.isArray(spot) ? spot : [];
    const futuresArray = Array.isArray(futures) ? futures : [];
    
    return [...spotArray, ...futuresArray];
  } catch (error) {
    console.error('Error fetching all symbols:', error);
    return [];
  }
}

export async function fetchKlines(
  symbol: string,
  interval: TimeInterval,
  isFutures: boolean = false,
  limit: number = 100
): Promise<Candle[]> {
  try {
    const baseUrl = getApiUrl();
    const response = await fetch(
      `${baseUrl}api/klines/${symbol}?interval=${interval}&limit=${limit}&futures=${isFutures}`
    );
    if (!response.ok) {
      console.error('Failed to fetch klines:', response.status);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching klines:', error);
    return [];
  }
}

export async function fetchCurrentPrice(
  symbol: string,
  isFutures: boolean = false
): Promise<number | null> {
  try {
    const baseUrl = getApiUrl();
    const response = await fetch(`${baseUrl}api/price/${symbol}?futures=${isFutures}`);
    if (!response.ok) {
      console.error('Failed to fetch price:', response.status);
      return null;
    }
    const data = await response.json();
    return data.price || null;
  } catch (error) {
    console.error('Error fetching price:', error);
    return null;
  }
}

export async function fetch24hrChange(
  symbol: string,
  isFutures: boolean = false
): Promise<{ priceChange: number; priceChangePercent: number } | null> {
  try {
    const baseUrl = getApiUrl();
    const response = await fetch(`${baseUrl}api/ticker/${symbol}?futures=${isFutures}`);
    if (!response.ok) {
      console.error('Failed to fetch 24hr change:', response.status);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching 24hr change:', error);
    return null;
  }
}
