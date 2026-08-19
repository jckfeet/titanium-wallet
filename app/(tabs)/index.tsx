/**
 * Home - portfolio total, quick actions, cash and the token list.
 *
 * Tapping the total five times inside three seconds opens the hidden demo
 * panel; see `handleBalanceTap`.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LogoMark } from '@/components/Logo';
import { TokenIcon } from '@/components/TokenIcon';
import {
  Card,
  ChangeBadge,
  CircleAction,
  ListRow,
  PressScale,
  Screen,
  Separator,
} from '@/components/ui';
import { formatAmount, formatUsd } from '@/lib/format';
import { usePortfolio } from '@/store/portfolio';
import { usePriceStore, useRefreshPrices } from '@/store/prices';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

/** Taps needed on the balance, and the window they must land in. */
const SECRET_TAP_COUNT = 5;
const SECRET_TAP_WINDOW_MS = 3000;

export default function Home() {
  const router = useRouter();
  const tokens = useWallet((s) => s.tokens);
  const cashBalance = useWallet((s) => s.cashBalance);
  const showDemoBanner = useWallet((s) => s.showDemoBanner);
  const { rows, totalUsd, change24hPct, change24hUsd } = usePortfolio();

  const refresh = usePriceStore((s) => s.refresh);
  const offline = usePriceStore((s) => s.offline);
  const [refreshing, setRefreshing] = useState(false);

  useRefreshPrices(tokens);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const ids = tokens.map((t) => t.coingeckoId).filter((id): id is string => Boolean(id));
    await refresh(ids, true);
    setRefreshing(false);
  }, [refresh, tokens]);

  // Timestamps of recent taps on the balance figure.
  const tapTimes = useRef<number[]>([]);

  const handleBalanceTap = useCallback(() => {
    const now = Date.now();
    tapTimes.current = [...tapTimes.current, now].filter(
      (t) => now - t <= SECRET_TAP_WINDOW_MS,
    );
    if (tapTimes.current.length >= SECRET_TAP_COUNT) {
      tapTimes.current = [];
      router.push('/demo-settings');
    }
  }, [router]);

  const positive = change24hPct >= 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.topBar}>
          <PressScale style={styles.account} onPress={() => router.push('/settings')}>
            <LogoMark size={30} />
            <Text style={type.body}>Account 1</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </PressScale>
          <PressScale onPress={() => router.push('/settings')} style={styles.iconButton}>
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </PressScale>
        </View>

        {showDemoBanner ? (
          <View style={styles.banner}>
            <Ionicons name="flask-outline" size={16} color={colors.warning} />
            <Text style={[type.small, styles.bannerText]}>
              DEMO FUNDS - simulated balances, no real assets
            </Text>
          </View>
        ) : null}

        <PressScale
          onPress={handleBalanceTap}
          scaleTo={0.985}
          haptics={false}
          style={styles.balanceBlock}
        >
          <Text style={type.hero}>{formatUsd(totalUsd)}</Text>
          <View style={styles.changeRow}>
            <Text style={[type.caption, { color: positive ? colors.positive : colors.negative }]}>
              {positive ? '+' : ''}
              {formatUsd(Math.abs(change24hUsd)).replace('$', positive ? '$' : '-$')}
            </Text>
            <ChangeBadge value={change24hPct} />
            <Text style={type.caption}>24h</Text>
          </View>
          {offline ? (
            <Text style={[type.small, styles.offline]}>Offline - showing bundled prices</Text>
          ) : null}
        </PressScale>

        <View style={styles.actionRow}>
          <CircleAction
            icon="arrow-down"
            label="Receive"
            onPress={() => router.push('/receive')}
          />
          <CircleAction icon="arrow-up" label="Send" onPress={() => router.push('/send')} />
          <CircleAction
            icon="swap-horizontal"
            label="Swap"
            emphasis
            onPress={() => router.navigate('/(tabs)/swap')}
          />
          <CircleAction icon="card-outline" label="Buy" onPress={() => router.push('/buy')} />
        </View>

        <Card style={styles.cashCard}>
          <ListRow
            left={
              <View style={styles.cashIcon}>
                <Ionicons name="cash-outline" size={20} color={colors.accent} />
              </View>
            }
            title="Cash balance"
            subtitle="Simulated fiat"
            rightTitle={formatUsd(cashBalance)}
            rightSubtitle="Available"
            onPress={() => router.push('/buy')}
          />
        </Card>

        <Card style={styles.tokenCard}>
          {rows.map((row, index) => (
            <View key={row.token.id}>
              {index > 0 ? <Separator inset={68} /> : null}
              <ListRow
                left={<TokenIcon token={row.token} />}
                title={row.token.name}
                subtitle={`${formatAmount(row.balance)} ${row.token.symbol}`}
                rightTitle={formatUsd(row.usdValue)}
                rightSubtitle={
                  row.token.custom ? 'Custom token' : `${row.change24h >= 0 ? '+' : ''}${row.change24h.toFixed(2)}%`
                }
                rightSubtitleStyle={
                  row.token.custom
                    ? undefined
                    : { color: row.change24h >= 0 ? colors.positive : colors.negative }
                }
                onPress={() => router.push(`/token/${row.token.id}`)}
              />
            </View>
          ))}

          {rows.length === 0 ? (
            <View style={styles.emptyTokens}>
              <Text style={type.caption}>Every token is hidden. Manage the list below.</Text>
            </View>
          ) : null}
        </Card>

        <PressScale
          onPress={() => router.push('/manage-tokens')}
          scaleTo={0.99}
          style={styles.manageRow}
        >
          <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
          <Text style={[type.body, styles.manageLabel]}>Manage token list</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </PressScale>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconButton: {
    padding: spacing.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
  },
  bannerText: {
    color: colors.warning,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  balanceBlock: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  offline: {
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  cashCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  cashIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenCard: {
    marginHorizontal: spacing.lg,
  },
  emptyTokens: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
  },
  manageLabel: {
    flex: 1,
    color: colors.textSecondary,
  },
});
