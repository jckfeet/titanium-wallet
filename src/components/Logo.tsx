/**
 * The Photon mark and wordmark.
 *
 * A flat disc carrying a negative-space P: stem, bowl, and a counter punched
 * back out in the disc colour. Drawn from geometry here rather than traced, and
 * deliberately flat - a single fill reads better at tab-bar size than a
 * gradient does.
 */
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Path, Rect } from 'react-native-svg';

import { colors, type } from '@/theme';

interface LogoMarkProps {
  size?: number;
  /** Colour showing through the negative-space P. */
  cutout?: string;
  /** Disc colour. */
  fill?: string;
  style?: ViewStyle;
}

export function LogoMark({ size = 40, cutout = colors.bg, fill = colors.accent, style }: LogoMarkProps) {
  const s = size;
  const c = s / 2;
  const r = s / 2;

  // P geometry, expressed against the disc radius so it scales cleanly.
  const stemW = 0.17 * r;
  const stemX = c - 0.30 * r;
  const top = c - 0.52 * r;
  const stemH = 1.04 * r;
  const bowlOuter = 0.37 * r;
  const bowlInner = 0.20 * r;
  const bowlCx = stemX + stemW;
  const bowlCy = top + bowlOuter;

  return (
    <View style={style}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Defs>
          {/* Clips the bowl to the stem's left edge - without it the ring wraps
              both sides of the stem and the glyph reads as a phi, not a P. */}
          <ClipPath id="photonBowl">
            <Rect x={stemX} y={0} width={s} height={s} />
          </ClipPath>
        </Defs>
        <Circle cx={c} cy={c} r={r} fill={fill} />
        <Circle cx={bowlCx} cy={bowlCy} r={bowlOuter} fill={cutout} clipPath="url(#photonBowl)" />
        <Circle cx={bowlCx} cy={bowlCy} r={bowlInner} fill={fill} clipPath="url(#photonBowl)" />
        {/* Stem last so it closes the join with the bowl cleanly. */}
        <Path d={`M${stemX},${top}h${stemW}v${stemH}h-${stemW}Z`} fill={cutout} />
      </Svg>
    </View>
  );
}

interface WordmarkProps {
  size?: number;
  style?: ViewStyle;
}

/** Mark plus "Photon" set in the system face. */
export function Wordmark({ size = 32, style }: WordmarkProps) {
  return (
    <View style={[styles.wordmark, style]}>
      <LogoMark size={size} />
      <Text style={[type.title, { fontSize: size * 0.72, letterSpacing: -0.4 }]}>Photon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
