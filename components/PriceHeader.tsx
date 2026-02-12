import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/ThemeContext';
import { ThemePicker } from './ThemePicker';

interface PriceHeaderProps {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
  isFutures: boolean;
  onBack: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function PriceHeader({
  symbol,
  baseAsset,
  quoteAsset,
  price,
  priceChange,
  priceChangePercent,
  isFutures,
  onBack,
  onFavorite,
  isFavorite,
}: PriceHeaderProps) {
  const { theme } = useTheme();
  
  const isPositive = (priceChange ?? 0) >= 0;
  const changeColor = isPositive ? theme.bullish : theme.bearish;
  
  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.0001) return p.toFixed(6);
    return p.toFixed(8);
  };
  
  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFavorite?.();
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.divider }]}>
      <View style={styles.topRow}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        
        <View style={styles.symbolContainer}>
          <View style={styles.symbolRow}>
            <Text style={[styles.baseAsset, { color: theme.text }]}>{baseAsset}</Text>
            <Text style={[styles.quoteAsset, { color: theme.textSecondary }]}>/{quoteAsset}</Text>
          </View>
          {isFutures && (
            <View style={[styles.futuresBadge, { backgroundColor: theme.accent }]}>
              <Text style={styles.futuresText}>PERP</Text>
            </View>
          )}
        </View>
        
        <View style={styles.rightActions}>
          <ThemePicker />
          <Pressable onPress={handleFavorite} hitSlop={12}>
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite ? theme.accent : theme.textMuted}
            />
          </Pressable>
        </View>
      </View>
      
      <View style={styles.priceRow}>
        <Text style={[styles.price, { color: theme.text }]}>
          {price !== null ? formatPrice(price) : '---'}
        </Text>
        <View style={[
          styles.changeContainer, 
          { backgroundColor: isPositive ? 'rgba(0, 255, 170, 0.15)' : 'rgba(255, 0, 100, 0.15)' }
        ]}>
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={changeColor}
          />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {priceChangePercent !== null ? `${isPositive ? '+' : ''}${priceChangePercent.toFixed(2)}%` : '---'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  symbolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  baseAsset: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  quoteAsset: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  futuresBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  futuresText: {
    color: '#000',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
