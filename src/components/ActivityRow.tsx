/** One transaction in the activity feed. Shared by the Activity tab and token detail. */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Token } from '@/data/tokens';
import { formatAmount, formatUsd, timeAgo, truncateMiddle } from '@/lib/format';
import { ActivityItem } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';
import { PressScale } from './ui';

const TYPE_META: Record<
  ActivityItem['type'],
  { icon: keyof typeof Ionicons.glyphMap; verb: string; color: string }
> = {
  send: { icon: 'arrow-up', verb: 'Sent', color: colors.textSecondary },
  receive: { icon: 'arrow-down', verb: 'Received', color: colors.positive },
  swap: { icon: 'swap-horizontal', verb: 'Swapped', color: colors.accent },
  buy: { icon: 'card-outline', verb: 'Bought', color: colors.accent },
};

interface ActivityRowProps {
  item: ActivityItem;
  token?: Token;
  toToken?: Token;
  onPress?: () => void;
}

export function ActivityRow({ item, token, toToken, onPress }: ActivityRowProps) {
  const meta = TYPE_META[item.type];
  const symbol = token?.symbol ?? 'Token';

  const title =
    item.type === 'swap' && toToken
      ? `${meta.verb} ${symbol} for ${toToken.symbol}`
      : `${meta.verb} ${symbol}`;

  // Sends leave the wallet; everything else adds to it.
  const outgoing = item.type === 'send';
  const sign = outgoing ? '-' : '+';
  const amountColor = outgoing ? colors.text : colors.positive;

  const subtitle =
    item.type === 'send' && item.address
      ? `To ${truncateMiddle(item.address, 4, 4)}`
      : item.type === 'receive' && item.address
        ? `From ${truncateMiddle(item.address, 4, 4)}`
        : truncateMiddle(item.signature, 6, 6);

  const content = (
    <View style={styles.row}>
      <View style={styles.iconChip}>
        <Ionicons name={meta.icon} size={18} color={meta.color} />
      </View>

      <View style={styles.body}>
        <Text style={type.body} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[type.small, styles.subtitle]} numberOfLines={1}>
          {subtitle} · {timeAgo(item.timestamp)}
        </Text>
      </View>

      <View style={styles.right}>
        {item.type === 'swap' && toToken ? (
          <>
            <Text style={[type.body, { color: colors.positive }]} numberOfLines={1}>
              +{formatAmount(item.toAmount ?? 0)} {toToken.symbol}
            </Text>
            <Text style={[type.small, styles.subtitle]} numberOfLines={1}>
              -{formatAmount(item.amount)} {symbol}
            </Text>
          </>
        ) : (
          <>
            <Text style={[type.body, { color: amountColor }]} numberOfLines={1}>
              {sign}
              {formatAmount(item.amount)} {symbol}
            </Text>
            <Text style={[type.small, styles.subtitle]} numberOfLines={1}>
              {formatUsd(item.usdValue)}
            </Text>
          </>
        )}
      </View>
    </View>
  );

  if (!onPress) return content;
  return (
    <PressScale onPress={onPress} scaleTo={0.99} haptics={false}>
      {content}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
    color: colors.textTertiary,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
});
