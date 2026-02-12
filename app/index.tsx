import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SearchBar } from '@/components/SearchBar';
import { SymbolList } from '@/components/SymbolList';
import { CryptoSymbol } from '@/lib/types';
import { fetchAllSymbols } from '@/lib/binanceApi';
import { getFavorites } from '@/lib/storage';
import { useTheme } from '@/lib/ThemeContext';

type TabType = 'search' | 'favorites';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [allSymbols, setAllSymbols] = useState<CryptoSymbol[]>([]);
  const [favorites, setFavorites] = useState<CryptoSymbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadSymbols();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'favorites') {
      loadFavorites();
    }
  }, [activeTab]);
  
  const loadSymbols = async () => {
    setIsLoading(true);
    const symbols = await fetchAllSymbols();
    setAllSymbols(symbols);
    setIsLoading(false);
  };
  
  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
  };
  
  const filteredSymbols = useMemo(() => {
    if (!searchQuery.trim()) {
      return allSymbols.slice(0, 100);
    }
    const query = searchQuery.toUpperCase();
    return allSymbols
      .filter(s => 
        s.symbol.includes(query) || 
        s.baseAsset.includes(query) ||
        s.quoteAsset.includes(query)
      )
      .slice(0, 100);
  }, [allSymbols, searchQuery]);
  
  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };
  
  const handleSelectSymbol = useCallback((symbol: CryptoSymbol) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/chart',
      params: {
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        isFutures: symbol.isFutures ? '1' : '0',
      },
    });
  }, []);
  
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  
  return (
    <View style={[styles.container, { paddingTop: topPadding, backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.accent }]}>PunkBot</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Technical Analysis // Crypto Markets
        </Text>
      </View>
      
      <View style={[styles.tabContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Pressable
          style={[
            styles.tab, 
            activeTab === 'search' && [styles.tabActive, { backgroundColor: theme.card }]
          ]}
          onPress={() => handleTabChange('search')}
        >
          <Ionicons
            name="search"
            size={18}
            color={activeTab === 'search' ? theme.accent : theme.textMuted}
          />
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'search' ? theme.text : theme.textMuted }
          ]}>
            Search
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab, 
            activeTab === 'favorites' && [styles.tabActive, { backgroundColor: theme.card }]
          ]}
          onPress={() => handleTabChange('favorites')}
        >
          <Ionicons
            name="star"
            size={18}
            color={activeTab === 'favorites' ? theme.accent : theme.textMuted}
          />
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'favorites' ? theme.text : theme.textMuted }
          ]}>
            Favorites
          </Text>
        </Pressable>
      </View>
      
      {activeTab === 'search' && (
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search BTC, ETH, SOL..."
            onClear={() => setSearchQuery('')}
          />
        </View>
      )}
      
      <View style={styles.listContainer}>
        {activeTab === 'search' ? (
          <SymbolList
            symbols={filteredSymbols}
            onSelect={handleSelectSymbol}
            isLoading={isLoading}
          />
        ) : (
          favorites.length === 0 ? (
            <View style={styles.emptyFavorites}>
              <Ionicons name="star-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No favorites yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>Star symbols to add them here</Text>
            </View>
          ) : (
            <SymbolList
              symbols={favorites}
              onSelect={handleSelectSymbol}
              isLoading={false}
            />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listContainer: {
    flex: 1,
  },
  emptyFavorites: {
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
