/**
 * Home - account row, portfolio total with a change pill, the cash card, then
 * Tokens and Stocks sections.
 *
 * Tapping the total five times inside three seconds opens the hidden balance
 * panel; see `handleBalanceTap`.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TokenIcon } from '@/components/TokenIcon';
import { Button, Card, PressScale, Separator } from '@/components/ui';
import { buildPortfolioSeries, TIMEFRAMES, type Timeframe } from '@/lib/chart';
import { formatAmount, MASKED } from '@/lib/format';
import { useMoney } from '@/store/money';
import { PriceChart } from '@/components/PriceChart';
import { EmptyStateArt } from '@/components/EmptyStateArt';
import { HoldingRow, usePortfolio } from '@/store/portfolio';
import { usePriceStore, useRefreshPrices } from '@/store/prices';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

/** Taps needed on the balance, and the window they must land in. */
const SECRET_TAP_COUNT = 5;
const SECRET_TAP_WINDOW_MS = 3000;

export default function Home() {
  const money = useMoney();
  const router = useRouter();
  const tokens = useWallet((s) => s.tokens);
  const cashBalance = useWallet((s) => s.cashBalance);
  const hideBalances = useWallet((s) => s.hideBalances);
  const setHideBalances = useWallet((s) => s.setHideBalances);
  const { rows, totalUsd, change24hPct, change24hUsd } = usePortfolio();

  const refresh = usePriceStore((s) => s.refresh);
  const offline = usePriceStore((s) => s.offline);
  const [refreshing, setRefreshing] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');

  useRefreshPrices(tokens);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh(tokens, true);
    setRefreshing(false);
  }, [refresh, tokens]);

  // Timestamps of recent taps on the balance figure.
  const tapTimes = useRef<number[]>([]);
  const handleBalanceTap = useCallback(() => {
    const now = Date.now();
    tapTimes.current = [...tapTimes.current, now].filter((t) => now - t <= SECRET_TAP_WINDOW_MS);
    if (tapTimes.current.length >= SECRET_TAP_COUNT) {
      tapTimes.current = [];
      router.push('/balances');
    }
  }, [router]);

  const series = useMemo(
    () =>
      buildPortfolioSeries(
        rows.map((r) => ({
          id: r.token.id,
          balance: r.balance,
          price: r.price,
          change24h: r.change24h,
        })),
        timeframe,
        cashBalance,
      ),
    [rows, timeframe, cashBalance],
  );

  const accounts = useWallet((s) => s.accounts);
  const activeAccountId = useWallet((s) => s.activeAccountId);
  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];

  // A brand-new account holds nothing at all; show the welcome card rather
  // than a portfolio of zeroes and a flat chart.
  const isEmpty = totalUsd === 0 && cashBalance === 0;

  const { cryptoRows, stockRows } = useMemo(
    () => ({
      cryptoRows: rows.filter((r) => r.token.kind !== 'stock'),
      stockRows: rows.filter((r) => r.token.kind === 'stock'),
    }),
    [rows],
  );

  const positive = change24hPct >= 0;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <PressScale
          scaleTo={0.98}
          haptics={false}
          onPress={() => setAccountOpen(true)}
          style={styles.accountRow}
        >
          <Text style={[type.body, styles.accountLabel]}>{activeAccount?.name ?? 'Account 1'}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </PressScale>

        {isEmpty ? (
          <View style={styles.welcomeCard}>
            <EmptyStateArt size={132} />
            <Text style={[type.title, styles.welcomeTitle]}>
              Welcome, {activeAccount?.handle ?? '@photon'}
            </Text>
            <Text style={[type.caption, styles.welcomeBlurb]}>
              Add Solana (SOL) to this account to get started.
            </Text>
            <Button label="Buy SOL with cash" onPress={() => router.push('/buy')} style={styles.welcomePrimary} />
            <Button
              label="Transfer crypto"
              variant="secondary"
              onPress={() => router.push('/receive')}
              style={styles.welcomeSecondary}
            />
          </View>
        ) : (
        <>
        <PressScale
          onPress={handleBalanceTap}
          scaleTo={0.985}
          haptics={false}
          style={styles.balanceBlock}
        >
          <View style={styles.balanceRow}>
            <Text style={styles.balance}>{money(totalUsd)}</Text>
            <PressScale
              onPress={() => setHideBalances(!hideBalances)}
              scaleTo={0.9}
              accessibilityRole="button"
              accessibilityLabel={hideBalances ? 'Show balances' : 'Hide balances'}
              style={styles.eyeButton}
            >
              <Ionicons
                name={hideBalances ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </PressScale>
          </View>
          <View style={styles.changeRow}>
            <Text style={[styles.changeAmount, { color: positive ? colors.positive : colors.negative }]}>
              {hideBalances ? MASKED : `${positive ? '+' : '-'}${money(Math.abs(change24hUsd))}`}
            </Text>
            <View
              style={[
                styles.changePill,
                { backgroundColor: positive ? 'rgba(33,197,119,0.16)' : 'rgba(252,107,107,0.16)' },
              ]}
            >
              <Text style={[styles.changePillText, { color: positive ? colors.positive : colors.negative }]}>
                {positive ? '+' : ''}
                {change24hPct.toFixed(2)}%
              </Text>
            </View>
          </View>
          {offline ? <Text style={styles.offline}>Offline - showing bundled prices</Text> : null}
        </PressScale>

        <PriceChart
          series={series}
          color={positive ? colors.positive : colors.negative}
          height={140}
        />

        <View style={styles.timeframes}>
          {TIMEFRAMES.map((tf) => {
            const active = tf === timeframe;
            return (
              <PressScale
                key={tf}
                onPress={() => setTimeframe(tf)}
                accessibilityRole="button"
                accessibilityLabel={`Show ${tf} portfolio history`}
                accessibilityState={{ selected: active }}
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

        <Card style={styles.cashCard}>
          <PressScale scaleTo={0.99} haptics={false} onPress={() => router.push('/buy')}>
            <View style={styles.cashRow}>
              <View style={styles.cashIcon}>
                <Ionicons name="cash-outline" size={20} color={colors.text} />
              </View>
              <Text style={[type.body, styles.cashLabel]}>Cash</Text>
              <Text style={type.body}>{money(cashBalance)}</Text>
            </View>
          </PressScale>
        </Card>

        <AssetSection
          title="Tokens"
          rows={cryptoRows}
          onHeaderPress={() => router.push('/manage-tokens')}
          onRowPress={(id) => router.push(`/token/${id}`)}
        />

        {stockRows.length > 0 ? (
          <AssetSection
            title="Stocks"
            rows={stockRows}
            onHeaderPress={() => router.push('/manage-tokens')}
            onRowPress={(id) => router.push(`/token/${id}`)}
          />
        ) : null}

        {rows.length === 0 ? (
          <View style={styles.emptyAssets}>
            <Text style={type.caption}>Every asset is hidden. Manage the list from Settings.</Text>
          </View>
        ) : null}
        </>
        )}

      </ScrollView>

      <AccountSheet visible={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}

/** A titled group of asset rows, with a chevron affordance on the heading. */
function AssetSection({
  title,
  rows,
  onHeaderPress,
  onRowPress,
}: {
  title: string;
  rows: HoldingRow[];
  onHeaderPress: () => void;
  onRowPress: (id: string) => void;
}) {
  const money = useMoney();
  if (rows.length === 0) return null;

  return (
    <View style={styles.section}>
      <PressScale scaleTo={0.98} haptics={false} onPress={onHeaderPress} style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </PressScale>

      <Card>
        {rows.map((row, index) => {
          const zero = row.balance === 0;
          const up = row.change24h >= 0;
          return (
            <View key={row.token.id}>
              {index > 0 ? <Separator inset={68} /> : null}
              <PressScale scaleTo={0.99} haptics={false} onPress={() => onRowPress(row.token.id)}>
                <View style={styles.assetRow}>
                  <TokenIcon token={row.token} size={40} showVerified />

                  <View style={styles.assetBody}>
                    <Text style={type.body} numberOfLines={1}>
                      {row.token.name}
                    </Text>
                    <Text style={styles.assetSub} numberOfLines={1}>
                      {formatAmount(row.balance)} {row.token.symbol}
                    </Text>
                  </View>

                  <View style={styles.assetRight}>
                    <Text style={type.body} numberOfLines={1}>
                      {money(row.usdValue)}
                    </Text>
                    <Text
                      style={[
                        styles.assetChange,
                        // A flat row reads as neutral rather than a false gain.
                        { color: zero ? colors.textTertiary : up ? colors.positive : colors.negative },
                      ]}
                      numberOfLines={1}
                    >
                      {zero
                        ? money(0)
                        : `${up ? '+' : '-'}${money(Math.abs((row.usdValue * row.change24h) / 100))}`}
                    </Text>
                  </View>
                </View>
              </PressScale>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

/** Everything that used to live in the bottom tab bar. */
function AccountSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const addresses = useWallet((s) => s.addresses);

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const items: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }[] = [
    { icon: 'images-outline', label: 'Collectibles', onPress: () => go('/collectibles') },
    { icon: 'time-outline', label: 'Activity', onPress: () => go('/activity') },
    { icon: 'list-outline', label: 'Manage asset list', onPress: () => go('/manage-tokens') },
    { icon: 'settings-outline', label: 'Settings', onPress: () => go('/settings') },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <PressScale haptics={false} scaleTo={1} onPress={onClose} style={styles.scrim}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.sheetHead}>
            <Text style={type.title}>Account 1</Text>
            <Text style={type.mono} numberOfLines={1}>
              {addresses.solana.slice(0, 12)}...{addresses.solana.slice(-6)}
            </Text>
          </View>

          {items.map((item) => (
            <PressScale
              key={item.label}
              scaleTo={0.99}
              onPress={item.onPress}
              style={styles.sheetRow}
            >
              <View style={styles.sheetIcon}>
                <Ionicons name={item.icon} size={20} color={colors.accent} />
              </View>
              <Text style={[type.body, styles.sheetRowLabel]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </PressScale>
          ))}
        </View>
      </PressScale>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  accountLabel: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  welcomeCard: {
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  welcomeTitle: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  welcomeBlurb: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  welcomePrimary: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
  welcomeSecondary: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  timeframes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
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
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  balanceBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  balance: {
    color: colors.text,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -1.1,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  changeAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  changePill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  changePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  offline: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: spacing.sm,
  },

  cashCard: {
    marginHorizontal: spacing.lg,
  },
  cashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  cashIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashLabel: {
    flex: 1,
  },

  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },

  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  assetBody: {
    flex: 1,
  },
  assetSub: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 13,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetChange: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyAssets: {
    padding: spacing.xxl,
    alignItems: 'center',
  },


  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfacePressed,
    marginBottom: spacing.lg,
  },
  sheetHead: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRowLabel: {
    flex: 1,
  },
});
