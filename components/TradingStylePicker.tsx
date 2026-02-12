import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/ThemeContext';
import { tradingStyles, TradingStyle, getTradingStyle, setTradingStyle } from '@/lib/tradingStyles';

interface TradingStylePickerProps {
  onStyleChange?: (style: TradingStyle) => void;
}

export function TradingStylePicker({ onStyleChange }: TradingStylePickerProps) {
  const { theme } = useTheme();
  const [currentStyle, setCurrentStyle] = useState<TradingStyle>('daytrader');
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    loadStyle();
  }, []);
  
  const loadStyle = async () => {
    const style = await getTradingStyle();
    setCurrentStyle(style);
  };
  
  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVisible(true);
  };
  
  const handleSelect = async (style: TradingStyle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStyle(style);
    await setTradingStyle(style);
    onStyleChange?.(style);
    setTimeout(() => setIsVisible(false), 100);
  };
  
  const config = tradingStyles[currentStyle];
  
  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder },
          pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons name="person-circle-outline" size={16} color={theme.accent} />
        <Text style={[styles.buttonText, { color: theme.text }]}>{config.name}</Text>
        <Ionicons name="chevron-down" size={14} color={theme.textMuted} />
      </Pressable>
      
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
        statusBarTranslucent
      >
        <Pressable 
          style={styles.overlay}
          onPress={() => setIsVisible(false)}
        >
          <Pressable 
            style={[styles.modal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Trading Style</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Customize analysis for your trading approach
            </Text>
            
            {(Object.keys(tradingStyles) as TradingStyle[]).map(styleId => {
              const style = tradingStyles[styleId];
              const isSelected = styleId === currentStyle;
              
              return (
                <Pressable
                  key={styleId}
                  style={({ pressed }) => [
                    styles.styleOption,
                    { 
                      backgroundColor: isSelected ? theme.accentGlow : theme.backgroundSecondary,
                      borderColor: isSelected ? theme.accent : theme.cardBorder,
                    },
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => handleSelect(styleId)}
                >
                  <View style={styles.styleInfo}>
                    <Text style={[styles.styleName, { color: theme.text }]}>{style.name}</Text>
                    <Text style={[styles.styleDesc, { color: theme.textMuted }]}>
                      {style.description}
                    </Text>
                    <View style={styles.timeframeTags}>
                      {style.preferredTimeframes.map(tf => (
                        <View key={tf} style={[styles.tfTag, { backgroundColor: theme.backgroundTertiary }]}>
                          <Text style={[styles.tfTagText, { color: theme.textSecondary }]}>
                            {tf.toUpperCase()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
                  )}
                </Pressable>
              );
            })}
            
            <Pressable
              style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => setIsVisible(false)}
            >
              <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  optionPressed: {
    opacity: 0.8,
  },
  styleInfo: {
    flex: 1,
  },
  styleName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  styleDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
  },
  timeframeTags: {
    flexDirection: 'row',
    gap: 4,
  },
  tfTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tfTagText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  closeButton: {
    marginTop: 6,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
