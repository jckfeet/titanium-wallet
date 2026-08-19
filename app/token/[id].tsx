/**
 * Token detail - price, interactive chart, holdings, actions and history.
 *
 * The chart series is seeded from the token id, so the curve is stable across
 * visits, and is rescaled to end at the live price.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { ActivityRow } from '@/components/ActivityRow';
import { PriceChart } from '@/components/PriceChart';
import { TokenIcon } from '@/components/TokenIcon';
import {
  Card,
  ListRow,
  PressScale,
  Screen,
  SectionHeader,
  Separator,
} from '@/components/ui';
import { buildSeries, formatSeriesTime, Timeframe, TIMEFRAMES } from '@/lib/chart';
import { formatAmount, formatPercent, formatPrice } from '@/lib/format';
import { useMoney } from '@/store/money';
import { useHolding } from '@/store/portfolio';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function TokenDetail() {
  const money = useMoney();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const holding = useHolding(id);
  const activity = useWallet((s) => s.activity);
  const tokens = useWallet((s) => s.tokens);

  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);

  const series = useMemo(() => {
    if (!holding) return null;
    return buildSeries(holding.token.id, timeframe, holding.price, holding.change24h);
  }, [holding, timeframe]);

  const tokenById = useMemo(() => Object.fromEntries(tokens.map((t) => [t.id, t])), [tokens]);

  const history = useMemo(
    () =>
      activity
        .filter((item) => item.tokenId === id || item.toTokenId === id)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 25),
    [activity, id],
  );

  if (!holding || !series) {
    return (
      <Screen edges={['bottom']}>
        <View style={styles.missing}>
          <Text style={type.body}>This token is no longer in your wallet.</Text>
        </View>
      </Screen>
    );
  }

  const { token } = holding;
  // While scrubbing, the header follows the finger instead of the live price.
  const scrubbing = scrubIndex !== null && series.points[scrubIndex] !== undefined;
  const shownPrice = scrubbing ? series.points[scrubIndex] : holding.price;
  const changePct = scrubbing
    ? ((series.points[scrubIndex] - series.points[0]) / series.points[0]) * 100
    : timeframe === '1D'
      ? holding.change24h
      : series.changePct;
  const positive = changePct >= 0;
  const lineColor = series.changePct >= 0 ? colors.positive : colors.negative;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${token.name} (${token.symbol}) - ${formatPrice(holding.price)}`,
      });
    } catch {
      // The user dismissed the share sheet; nothing to recover from.
    }
  };

  const stub = (title: string, body: string) => Alert.alert(title, body);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: token.symbol }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <TokenIcon token={token} size={44} />
          <View style={styles.headText}>
            <Text style={type.caption}>{token.name}</Text>
            <Text style={type.display}>{formatPrice(shownPrice)}</Text>
            <View style={styles.changeRow}>
              <Text style={[type.caption, { color: positive ? colors.positive : colors.negative }]}>
                {formatPercent(changePct)}
              </Text>
              <Text style={type.caption}>
                {scrubbing
                  ? formatSeriesTime(series.timestamps[scrubIndex], timeframe)
                  : timeframe === '1D'
                    ? 'Past day'
                    : `Past ${timeframe}`}
              </Text>
            </View>
          </View>
        </View>

        <PriceChart series={series} color={lineColor} onScrub={setScrubIndex} />

        <View style={styles.timeframes}>
          {TIMEFRAMES.map((tf) => {
            const active = tf === timeframe;
            return (
              <PressScale
                key={tf}
                onPress={() => {
                  setTimeframe(tf);
                  setScrubIndex(null);
                }}
                style={[styles.timeframeChip, active && styles.timeframeChipActive]}
              >
                <Text
                  style={[
                    type.small,
                    { color: active ? colors.bg : colors.textSecondary, fontWeight: '700' },
                  ]}
                >
                  {tf}
                </Text>
              </PressScale>
            );
          })}
        </View>

        <SectionHeader title="Your holdings" />
        <Card style={styles.card}>
          <View style={styles.holdings}>
            <View>
              <Text style={type.display}>{money(holding.usdValue)}</Text>
              <Text style={[type.caption, styles.holdingsSub]}>
                {formatAmount(holding.balance)} {token.symbol}
              </Text>
            </View>
            <TokenIcon token={token} size={40} />
          </View>
        </Card>

        <SectionHeader title="Actions" />
        <Card style={styles.card}>
          <ListRow
            left={<ActionIcon name="card-outline" />}
            title="Buy"
            subtitle="Add to your position"
            chevron
            onPress={() => router.push('/buy')}
          />
          <Separator inset={68} />
          <ListRow
            left={<ActionIcon name="lock-closed-outline" />}
            title="Stake"
            subtitle="Earn rewards on your holdings"
            chevron
            onPress={() =>
              stub('Staking', `Staking is not available for ${token.symbol} yet.`)
            }
          />
          <Separator inset={68} />
          <ListRow
            left={<ActionIcon name="open-outline" />}
            title="View on explorer"
            chevron
            onPress={async () => {
              await Clipboard.setStringAsync(token.id);
              stub('Copied', `${token.symbol} address copied to your clipboard.`);
            }}
          />
          <Separator inset={68} />
          <ListRow
            left={<ActionIcon name="share-outline" />}
            title="Share"
            chevron
            onPress={handleShare}
          />
        </Card>

        <SectionHeader title="Transactions" />
        <Card style={styles.card}>
          {history.length === 0 ? (
            <View style={styles.empty}>
              <Text style={type.caption}>No {token.symbol} transactions yet.</Text>
            </View>
          ) : (
            history.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <Separator inset={68} /> : null}
                <ActivityRow
                  item={item}
                  token={tokenById[item.tokenId]}
                  toToken={item.toTokenId ? tokenById[item.toTokenId] : undefined}
                />
              </View>
            ))
          )}
        </Card>

      </ScrollView>
    </Screen>
  );
}

function ActionIcon({ name }: { name: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.actionIcon}>
      <Ionicons name={name} size={20} color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headText: {
    flex: 1,
    gap: 2,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  timeframes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  timeframeChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  timeframeChipActive: {
    backgroundColor: colors.accent,
  },
  card: {
    marginHorizontal: spacing.lg,
  },
  holdings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  holdingsSub: {
    marginTop: spacing.xs,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  notice: {
    marginTop: spacing.lg,
  },
});
