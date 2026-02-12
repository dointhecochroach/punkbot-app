import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TimeInterval, TIME_INTERVALS } from '@/lib/types';
import { useTheme } from '@/lib/ThemeContext';

interface TimeframeSelectorProps {
  selected: TimeInterval;
  onSelect: (interval: TimeInterval) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TimeframeButton({ label, value, isSelected, onPress, theme }: {
  label: string;
  value: TimeInterval;
  isSelected: boolean;
  onPress: (v: TimeInterval) => void;
  theme: any;
}) {
  const scale = useSharedValue(1);
  const slideX = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: slideX.value },
      { scale: scale.value },
    ],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.88, { damping: 12, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
    slideX.value = withTiming(-6, { duration: 80 }, () => {
      slideX.value = withSpring(0, { damping: 12, stiffness: 300 });
    });
    onPress(value);
  };

  return (
    <AnimatedPressable
      style={[
        styles.button,
        { 
          backgroundColor: isSelected ? theme.accent : theme.backgroundSecondary,
          borderColor: isSelected ? theme.accent : theme.cardBorder,
        },
        animStyle,
      ]}
      onPress={handlePress}
    >
      <Text style={[
        styles.buttonText,
        { color: isSelected ? '#000' : theme.textSecondary },
      ]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function TimeframeSelector({ selected, onSelect }: TimeframeSelectorProps) {
  const { theme } = useTheme();
  
  const handleSelect = (interval: TimeInterval) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(interval);
  };
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {TIME_INTERVALS.map(({ label, value }) => (
        <TimeframeButton
          key={value}
          label={label}
          value={value}
          isSelected={selected === value}
          onPress={handleSelect}
          theme={theme}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
