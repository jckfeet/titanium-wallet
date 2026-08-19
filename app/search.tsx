/**
 * Global search - assets first, then apps.
 *
 * Reached from the pill on the Home tab bar. Ranking lives in `@/lib/search`
 * so the ordering rules are tested directly rather than through this screen.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { TokenIcon } from '@/components/TokenIcon';
import { Card, ListRow, Screen, SectionHeader, Separator } from '@/components/ui';
import { ALL_DAPPS } from '@/data/dapps';
import { formatUsd, maskIf } from '@/lib/format';
import { search } from '@/lib/search';
import { usePortfolio } from '@/store/portfolio';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { rows } = usePortfolio(true);
  const hideBalances = useWallet((s) => s.hideBalances);

  const assetResults = useMemo(
    () => search(rows, query, (row) => [row.token.symbol, row.token.name]),
    [rows, query],
  );

  const dappResults = useMemo(
    () => search(ALL_DAPPS, query, (dapp) => [dapp.name, dapp.category, dapp.blurb]),
    [query],
  );

  const hasQuery = query.trim().length > 0;
  const empty = hasQuery && assetResults.length === 0 && dappResults.length === 0;

  return (
    <Screen edges={['bottom']}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search assets and apps"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Search assets and apps"
        />
        {hasQuery ? (
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.textTertiary}
            onPress={() => setQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          />
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        showsVerticalScrollIndicator={false}
      >
        {!hasQuery ? (
          <View style={styles.hint}>
            <Text style={[type.caption, styles.hintText]}>
              Search your assets by name or symbol, or find an app by name or category.
            </Text>
          </View>
        ) : null}

        {assetResults.length > 0 ? (
          <>
            <SectionHeader title="Assets" />
            <Card style={styles.card}>
              {assetResults.map((row, index) => (
                <View key={row.token.id}>
                  {index > 0 ? <Separator inset={68} /> : null}
                  <ListRow
                    left={<TokenIcon token={row.token} />}
                    title={row.token.name}
                    subtitle={row.token.symbol}
                    rightTitle={maskIf(hideBalances, formatUsd(row.usdValue))}
                    chevron
                    onPress={() => router.push(`/token/${row.token.id}`)}
                  />
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {dappResults.length > 0 ? (
          <>
            <SectionHeader title="Apps" />
            <Card style={styles.card}>
              {dappResults.map((dapp, index) => (
                <View key={dapp.id}>
                  {index > 0 ? <Separator inset={68} /> : null}
                  <ListRow
                    left={
                      <TokenIcon
                        token={{ color: dapp.color, glyph: dapp.glyph, symbol: dapp.name }}
                      />
                    }
                    title={dapp.name}
                    subtitle={dapp.category}
                    chevron
                    onPress={() => router.push('/(main)/explore')}
                  />
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {empty ? (
          <View style={styles.hint}>
            <Text style={[type.caption, styles.hintText]}>No matches for &ldquo;{query.trim()}&rdquo;.</Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  card: {
    marginHorizontal: spacing.lg,
  },
  hint: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  hintText: {
    textAlign: 'center',
  },
});
