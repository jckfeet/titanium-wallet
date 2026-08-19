/**
 * Asset badges.
 *
 * Renders the issuer's own logo when one is available, and falls back to a
 * generated colour-and-letter badge whenever the image is missing, still
 * loading or the device is offline. The fallback sits underneath the image
 * rather than replacing it, so a slow network never leaves an empty hole in
 * the list.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Token } from '@/data/tokens';
import { colors, radius } from '@/theme';

type IconToken = Pick<Token, 'color' | 'glyph' | 'symbol'> &
  Partial<Pick<Token, 'logoUrl' | 'verified'>>;

interface TokenIconProps {
  token: IconToken;
  size?: number;
  /** Draws the small verification tick over the badge. */
  showVerified?: boolean;
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

export function TokenIcon({ token, size = 40, showVerified = false, style }: TokenIconProps) {
  const [failed, setFailed] = useState(false);
  const foreground = readableForeground(token.color);
  const showImage = Boolean(token.logoUrl) && !failed;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: showImage ? colors.surfaceHigh : token.color,
          },
        ]}
      >
        {showImage ? null : (
          <Text
            style={[
              styles.glyph,
              { fontSize: size * 0.42, lineHeight: size * 0.5, color: foreground },
            ]}
          >
            {token.glyph}
          </Text>
        )}
      </View>

      {showImage ? (
        <Image
          source={{ uri: token.logoUrl }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          onError={() => setFailed(true)}
          resizeMode="cover"
        />
      ) : null}

      {showVerified && token.verified ? (
        <View style={[styles.verified, { right: -1, bottom: -1 }]}>
          <Ionicons name="checkmark-circle" size={size * 0.36} color={colors.accent} />
        </View>
      ) : null}
    </View>
  );
}

/** Overlapping pair used for swap rows in the activity feed. */
export function TokenPairIcon({
  from,
  to,
  size = 40,
}: {
  from: IconToken;
  to: IconToken;
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
        }}
      />
    </View>
  );
}

/** Neutral circular chip for non-asset rows (settings, dApps, activity types). */
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
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  glyph: {
    fontWeight: '800',
    textAlign: 'center',
  },
  verified: {
    position: 'absolute',
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
  },
});
