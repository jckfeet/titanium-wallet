/**
 * The Titanium mark and wordmark.
 *
 * An original construction: a faceted octagon carrying a negative-space T,
 * matching the generated app icon. Drawn as SVG so it stays crisp at any size.
 */
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors, type } from '@/theme';

interface LogoMarkProps {
  size?: number;
  /** Colour showing through the negative-space T. */
  cutout?: string;
  style?: ViewStyle;
}

/** Regular octagon path, flat side up, inscribed in a circle of radius r. */
function octagonPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 8) * (2 * i + 1);
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(3)},${(cy + r * Math.sin(angle)).toFixed(3)}`);
  }
  return `M${pts.join('L')}Z`;
}

export function LogoMark({ size = 40, cutout = colors.bg, style }: LogoMarkProps) {
  const s = size;
  const c = s / 2;
  const r = s * 0.5;

  // T geometry, expressed against the octagon radius so it scales cleanly.
  const barLeft = c - 0.54 * r;
  const barW = 1.08 * r;
  const barTop = c - 0.48 * r;
  const barH = 0.31 * r;
  const stemLeft = c - 0.155 * r;
  const stemW = 0.31 * r;
  const stemH = 1.02 * r;
  const corner = 0.05 * r;

  return (
    <View style={style}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Defs>
          <LinearGradient id="titaniumMark" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#C6BBFF" />
            <Stop offset="1" stopColor="#7C63D8" />
          </LinearGradient>
        </Defs>
        <Path d={octagonPath(c, c, r)} fill="url(#titaniumMark)" />
        <Path
          d={
            `M${barLeft + corner},${barTop}h${barW - corner * 2}a${corner},${corner} 0 0 1 ${corner},${corner}` +
            `v${barH - corner * 2}a${corner},${corner} 0 0 1 -${corner},${corner}h-${barW - corner * 2}` +
            `a${corner},${corner} 0 0 1 -${corner},-${corner}v-${barH - corner * 2}` +
            `a${corner},${corner} 0 0 1 ${corner},-${corner}Z`
          }
          fill={cutout}
        />
        <Path
          d={
            `M${stemLeft},${barTop}h${stemW}v${stemH - corner}a${corner},${corner} 0 0 1 -${corner},${corner}` +
            `h-${stemW - corner * 2}a${corner},${corner} 0 0 1 -${corner},-${corner}Z`
          }
          fill={cutout}
        />
      </Svg>
    </View>
  );
}

interface WordmarkProps {
  size?: number;
  style?: ViewStyle;
}

/** Mark plus "Titanium" set in the system face. */
export function Wordmark({ size = 32, style }: WordmarkProps) {
  return (
    <View style={[styles.wordmark, style]}>
      <LogoMark size={size} />
      <Text style={[type.title, { fontSize: size * 0.72, letterSpacing: -0.4 }]}>Titanium</Text>
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
