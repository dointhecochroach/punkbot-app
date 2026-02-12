import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/ThemeContext';
import { themes, ThemeName } from '@/lib/themes';

export function ThemePicker() {
  const { theme, themeName, setTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  
  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVisible(true);
  };
  
  const handleClose = () => {
    setIsVisible(false);
  };
  
  const handleSelect = (name: ThemeName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTheme(name);
    setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };
  
  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.settingsButton,
          { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder },
          pressed && styles.buttonPressed,
        ]}
        hitSlop={8}
        testID="theme-picker-button"
      >
        <Ionicons name="color-palette-outline" size={18} color={theme.accent} />
      </Pressable>
      
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <Pressable 
          style={styles.overlay}
          onPress={handleClose}
        >
          <Pressable 
            style={[styles.modal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Choose Theme</Text>
            
            {(Object.keys(themes) as ThemeName[]).map(name => {
              const t = themes[name];
              const isSelected = name === themeName;
              
              return (
                <Pressable
                  key={name}
                  style={({ pressed }) => [
                    styles.themeOption,
                    { 
                      backgroundColor: isSelected ? theme.accentGlow : theme.backgroundSecondary,
                      borderColor: isSelected ? theme.accent : theme.cardBorder,
                    },
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => handleSelect(name)}
                  testID={`theme-option-${name}`}
                >
                  <View style={styles.themePreview}>
                    <View style={[styles.previewDot, { backgroundColor: t.bullish }]} />
                    <View style={[styles.previewDot, { backgroundColor: t.bearish }]} />
                    <View style={[styles.previewDot, { backgroundColor: t.accent }]} />
                  </View>
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeName, { color: theme.text }]}>{t.displayName}</Text>
                    <Text style={[styles.themeDesc, { color: theme.textMuted }]}>
                      {t.chartType === 'line' ? 'Line chart' : 'Candlestick'}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
                  )}
                </Pressable>
              );
            })}
            
            <Pressable
              style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={handleClose}
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
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.7,
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
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  optionPressed: {
    opacity: 0.8,
  },
  themePreview: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 12,
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  themeDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
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
