/**
 * Token badges.
 *
 * Generated from each token's own colour and glyph rather than shipping any
 * third-party logo files, so the app carries no borrowed artwork.
 */
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Token } from '@/data/tokens';
import { colors, radius } from '@/theme';

interface TokenIconProps {
  token: Pick<Token, 'color' | 'glyph' | 'symbol'>;
  size?: number;
  style?: ViewStyle;
}

/** Dark glyph on a light badge, light glyph on a dark badge. */
function readableForeground(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  // Rec. 601 luma.
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? '#101014' : '#FFFFFF';
}

export function TokenIcon({ token, size = 40, style }: TokenIconProps) {
  const foreground = readableForeground(token.color);
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: token.color,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.glyph,
          { fontSize: size * 0.42, lineHeight: size * 0.5, color: foreground },
        ]}
      >
        {token.glyph}
      </Text>
    </View>
  );
}

/** Overlapping pair used for swap rows in the activity feed. */
export function TokenPairIcon({
  from,
  to,
  size = 40,
}: {
  from: Pick<Token, 'color' | 'glyph' | 'symbol'>;
  to: Pick<Token, 'color' | 'glyph' | 'symbol'>;
  size?: number;
}) {
  const small = size * 0.66;
  return (
    <View style={{ width: size, height: size }}>
      <TokenIcon token={from} size={small} />
      <TokenIcon
        token={to}
        size={small}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          borderWidth: 2,
          borderColor: colors.bg,
        }}
      />
    </View>
  );
}

/** Neutral circular chip for non-token rows (settings, dApps, activity types). */
export function IconChip({
  children,
  size = 40,
  background = colors.surfaceHigh,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  background?: string;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: radius.pill, backgroundColor: background },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
