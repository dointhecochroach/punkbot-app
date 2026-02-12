import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CryptoSymbol } from '@/lib/types';
import { useTheme } from '@/lib/ThemeContext';

interface SymbolListProps {
  symbols: CryptoSymbol[];
  onSelect: (symbol: CryptoSymbol) => void;
  isLoading?: boolean;
}

export function SymbolList({ symbols, onSelect, isLoading }: SymbolListProps) {
  const { theme } = useTheme();
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Scanning the grid...
        </Text>
      </View>
    );
  }
  
  if (symbols.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color={theme.textMuted} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No symbols found</Text>
        <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>Try a different search term</Text>
      </View>
    );
  }
  
  const renderItem = ({ item }: { item: CryptoSymbol }) => (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        pressed && [styles.itemPressed, { backgroundColor: theme.backgroundTertiary }],
      ]}
      onPress={() => onSelect(item)}
    >
      <View style={styles.itemContent}>
        <View style={styles.symbolInfo}>
          <Text style={[styles.symbol, { color: theme.text }]}>{item.baseAsset}</Text>
          <Text style={[styles.quoteAsset, { color: theme.textSecondary }]}>/{item.quoteAsset}</Text>
        </View>
        {item.isFutures && (
          <View style={[styles.futuresBadge, { backgroundColor: theme.accent }]}>
            <Text style={styles.futuresText}>PERP</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
    </Pressable>
  );
  
  return (
    <FlatList
      data={symbols}
      keyExtractor={(item) => `${item.symbol}-${item.isFutures}`}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemPressed: {
    transform: [{ scale: 0.98 }],
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  symbolInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  symbol: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  quoteAsset: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  futuresBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  futuresText: {
    color: '#000',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
