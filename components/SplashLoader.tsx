import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const CYAN = '#00ffcc';
const PURPLE = '#cc44ff';
const BLUE = '#00aaff';
const DIM = '#334455';

interface SplashLoaderProps {
  onFinish: () => void;
}

function TerminalLine({ text, delay, color }: { text: string; delay: number; color: string }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.termLine, style]}>
      <Text style={[styles.termText, { color }]}>{text}</Text>
    </Animated.View>
  );
}

export function SplashLoader({ onFinish }: SplashLoaderProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);
  const scanLineY = useSharedValue(-2);
  const borderOpacity = useSharedValue(0);
  const fadeOut = useSharedValue(1);
  const cursorBlink = useSharedValue(1);
  const [showLines, setShowLines] = useState(false);

  useEffect(() => {
    borderOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));

    logoOpacity.value = withDelay(700, withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }));
    logoScale.value = withDelay(700, withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.2)) }));

    glowOpacity.value = withDelay(1100, withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));

    scanLineY.value = withDelay(800, withRepeat(
      withTiming(80, { duration: 2400, easing: Easing.linear }),
      -1,
      false
    ));

    cursorBlink.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );

    setTimeout(() => setShowLines(true), 1200);

    setTimeout(() => {
      fadeOut.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) }, () => {
        runOnJS(onFinish)();
      });
    }, 4200);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const scanStyle = useAnimatedStyle(() => ({
    top: `${scanLineY.value}%`,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorBlink.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.scanLine, scanStyle]} />

      <View style={styles.centerContent}>
        <Animated.View style={[styles.logoFrame, borderStyle]}>
          <View style={[styles.frameCornerTL]} />
          <View style={[styles.frameCornerTR]} />
          <View style={[styles.frameCornerBL]} />
          <View style={[styles.frameCornerBR]} />

          <View style={styles.circuitTop} />
          <View style={styles.circuitDotTop} />
          <View style={styles.circuitRight} />
          <View style={styles.circuitDotRight} />

          <Animated.View style={[styles.logoGlow, glowStyle]} />

          <Animated.View style={logoStyle}>
            <View style={styles.logoInner}>
              <Text style={styles.logoBracketLeft}>{'['}</Text>
              <View style={styles.logoTextWrap}>
                <Text style={styles.logoPunk}>PUNK</Text>
                <Text style={styles.logoBot}>BOT</Text>
              </View>
              <Text style={styles.logoBracketRight}>{']'}</Text>
            </View>

            <View style={styles.versionRow}>
              <View style={styles.versionLine} />
              <Text style={styles.versionText}>v2.0.1</Text>
              <View style={styles.versionLine} />
            </View>
          </Animated.View>
        </Animated.View>

        {showLines && (
          <View style={styles.terminalBlock}>
            <TerminalLine text="> SYS.INIT..." delay={0} color={DIM} />
            <TerminalLine text="> LOADING MARKET FEEDS" delay={400} color={BLUE} />
            <TerminalLine text="> INDICATORS [OK]" delay={900} color={CYAN} />
            <TerminalLine text="> AI ENGINE [OK]" delay={1400} color={CYAN} />
            <View style={styles.cursorRow}>
              <TerminalLine text="> READY" delay={1900} color={PURPLE} />
              <Animated.View style={[styles.cursor, cursorStyle]} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.bottomLineLeft} />
        <Text style={styles.bottomText}>PUNKBOT</Text>
        <View style={styles.bottomLineRight} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 255, 204, 0.06)',
  },
  centerContent: {
    alignItems: 'center',
  },
  logoFrame: {
    width: 220,
    height: 120,
    borderWidth: 1,
    borderColor: CYAN + '33',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 255, 204, 0.02)',
  },
  frameCornerTL: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: CYAN,
  },
  frameCornerTR: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: CYAN,
  },
  frameCornerBL: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    width: 16,
    height: 16,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: CYAN,
  },
  frameCornerBR: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: CYAN,
  },
  circuitTop: {
    position: 'absolute',
    top: 10,
    left: 0,
    width: 28,
    height: 1,
    backgroundColor: CYAN + '33',
  },
  circuitDotTop: {
    position: 'absolute',
    top: 8,
    left: 26,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: CYAN + '55',
  },
  circuitRight: {
    position: 'absolute',
    bottom: 18,
    right: 0,
    width: 20,
    height: 1,
    backgroundColor: PURPLE + '33',
  },
  circuitDotRight: {
    position: 'absolute',
    bottom: 16,
    right: 18,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PURPLE + '44',
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 60,
    borderRadius: 30,
    backgroundColor: CYAN,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 0,
  },
  logoInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  logoBracketLeft: {
    fontSize: 36,
    fontFamily: 'Inter_400Regular',
    color: CYAN + '66',
    marginRight: 2,
  },
  logoTextWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoPunk: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: CYAN,
    letterSpacing: 3,
  },
  logoBot: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: PURPLE,
    letterSpacing: 3,
  },
  logoBracketRight: {
    fontSize: 36,
    fontFamily: 'Inter_400Regular',
    color: CYAN + '66',
    marginLeft: 2,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  versionLine: {
    width: 24,
    height: 1,
    backgroundColor: DIM,
  },
  versionText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: DIM,
    letterSpacing: 2,
  },
  terminalBlock: {
    marginTop: 32,
    alignSelf: 'stretch',
    paddingHorizontal: 48,
  },
  termLine: {
    marginBottom: 4,
  },
  termText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.8,
  },
  cursorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cursor: {
    width: 7,
    height: 14,
    backgroundColor: PURPLE,
    marginLeft: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomLineLeft: {
    width: 40,
    height: 1,
    backgroundColor: DIM,
  },
  bottomText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: DIM,
    letterSpacing: 4,
  },
  bottomLineRight: {
    width: 40,
    height: 1,
    backgroundColor: DIM,
  },
});
