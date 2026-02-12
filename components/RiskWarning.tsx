import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/ThemeContext';

interface RiskWarningProps {
  level: 'low' | 'medium' | 'high' | 'extreme';
  warning: string;
  timeframe: string;
}

export function RiskWarning({ level, warning, timeframe }: RiskWarningProps) {
  const { theme } = useTheme();
  
  const getRiskConfig = (riskLevel: string) => {
    switch (riskLevel) {
      case 'extreme':
        return {
          color: '#ff0044',
          bgColor: 'rgba(255, 0, 68, 0.15)',
          borderColor: 'rgba(255, 0, 68, 0.4)',
          icon: 'skull' as const,
          label: 'EXTREME RISK',
        };
      case 'high':
        return {
          color: '#ff6600',
          bgColor: 'rgba(255, 102, 0, 0.15)',
          borderColor: 'rgba(255, 102, 0, 0.4)',
          icon: 'alert-circle' as const,
          label: 'HIGH RISK',
        };
      case 'medium':
        return {
          color: '#ffaa00',
          bgColor: 'rgba(255, 170, 0, 0.15)',
          borderColor: 'rgba(255, 170, 0, 0.4)',
          icon: 'warning' as const,
          label: 'MODERATE RISK',
        };
      default:
        return {
          color: '#00cc66',
          bgColor: 'rgba(0, 204, 102, 0.15)',
          borderColor: 'rgba(0, 204, 102, 0.4)',
          icon: 'shield-checkmark' as const,
          label: 'LOWER RISK',
        };
    }
  };
  
  const config = getRiskConfig(level);
  
  return (
    <View style={[styles.container, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
      <View style={styles.header}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
        <View style={[styles.timeframeBadge, { backgroundColor: theme.backgroundTertiary }]}>
          <Text style={[styles.timeframeText, { color: theme.textSecondary }]}>{timeframe}</Text>
        </View>
      </View>
      <Text style={[styles.warning, { color: theme.textSecondary }]}>{warning}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    flex: 1,
  },
  timeframeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeframeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  warning: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
