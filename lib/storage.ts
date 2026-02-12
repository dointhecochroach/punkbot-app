import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoSymbol } from './types';

const FAVORITES_KEY = 'crypto_favorites';

export async function getFavorites(): Promise<CryptoSymbol[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
}

export async function addFavorite(symbol: CryptoSymbol): Promise<void> {
  try {
    const favorites = await getFavorites();
    const exists = favorites.some(
      f => f.symbol === symbol.symbol && f.isFutures === symbol.isFutures
    );
    if (!exists) {
      favorites.unshift(symbol);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
}

export async function removeFavorite(symbol: CryptoSymbol): Promise<void> {
  try {
    const favorites = await getFavorites();
    const filtered = favorites.filter(
      f => !(f.symbol === symbol.symbol && f.isFutures === symbol.isFutures)
    );
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
}

export async function isFavorite(symbol: CryptoSymbol): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some(
    f => f.symbol === symbol.symbol && f.isFutures === symbol.isFutures
  );
}
