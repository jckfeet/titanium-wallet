/**
 * Artwork for the Home empty state.
 *
 * An original construction: three offset arcs sweeping out of the Photon disc,
 * suggesting a beam. Drawn from geometry here, not traced from any existing
 * artwork, and deliberately abstract rather than a character.
 */
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '@/theme';

interface EmptyStateArtProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Arc of a circle, from `startDeg` to `endDeg`, as an SVG path. */
function arc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startDeg));
  const y1 = cy + r * Math.sin(rad(startDeg));
  const x2 = cx + r * Math.cos(rad(endDeg));
  const y2 = cy + r * Math.sin(rad(endDeg));
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M${x1.toFixed(2)},${y1.toFixed(2)}A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
}

export function EmptyStateArt({ size = 132, style }: EmptyStateArtProps) {
  const s = size;
  const cx = s * 0.42;
  const cy = s * 0.5;
  const core = s * 0.15;

  return (
    <View style={style}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Defs>
          <LinearGradient id="photonBeam" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="0.9" />
            <Stop offset="1" stopColor={colors.accentDeep} stopOpacity="0.2" />
          </LinearGradient>
        </Defs>

        {/* Three arcs at widening radii, each sweeping the same quadrant. */}
        <Path
          d={arc(cx, cy, core * 1.9, -62, 62)}
          stroke="url(#photonBeam)"
          strokeWidth={s * 0.045}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={arc(cx, cy, core * 2.8, -54, 54)}
          stroke="url(#photonBeam)"
          strokeWidth={s * 0.038}
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />
        <Path
          d={arc(cx, cy, core * 3.7, -46, 46)}
          stroke="url(#photonBeam)"
          strokeWidth={s * 0.03}
          strokeLinecap="round"
          fill="none"
          opacity={0.4}
        />

        <Circle cx={cx} cy={cy} r={core} fill={colors.accent} />
      </Svg>
    </View>
  );
}
