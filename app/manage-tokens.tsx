/** Manage token list - choose which tokens appear on Home. */
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { TokenIcon } from '@/components/TokenIcon';
import { Button, Card, Screen, SectionHeader, Separator } from '@/components/ui';
import { formatAmount } from '@/lib/format';
import { useMoney } from '@/store/money';
import { usePortfolio } from '@/store/portfolio';
import { useWallet } from '@/store/wallet';
import { colors, spacing, type } from '@/theme';

export default function ManageTokens() {
  const money = useMoney();
  const router = useRouter();
  const { rows } = usePortfolio(true);
  const hidden = useWallet((s) => s.hiddenTokens);
  const toggleTokenHidden = useWallet((s) => s.toggleTokenHidden);

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[type.caption, styles.blurb]}>
          Hidden tokens stay in your wallet and keep their balance - they simply do not appear on
          Home.
        </Text>

        <SectionHeader title={`${rows.length} tokens`} />
        <Card style={styles.card}>
          {rows.map((row, index) => {
            const isHidden = hidden.includes(row.token.id);
            return (
              <View key={row.token.id}>
                {index > 0 ? <Separator inset={68} /> : null}
                <View style={styles.row}>
                  <TokenIcon token={row.token} />
                  <View style={styles.rowText}>
                    <Text style={type.body}>{row.token.name}</Text>
                    <Text style={[type.caption, styles.rowSub]} numberOfLines={1}>
                      {formatAmount(row.balance)} {row.token.symbol} · {money(row.usdValue)}
                    </Text>
                  </View>
                  <Switch
                    value={!isHidden}
                    onValueChange={() => toggleTokenHidden(row.token.id)}
                    trackColor={{ false: colors.surfacePressed, true: colors.accentDeep }}
                    thumbColor={colors.text}
                  />
                </View>
              </View>
            );
          })}
        </Card>

        <Button
          label="Add a custom asset"
          variant="secondary"
          style={styles.addButton}
          onPress={() => router.push('/balances')}
        />

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  blurb: {
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  card: {
    marginHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  rowText: {
    flex: 1,
  },
  rowSub: {
    marginTop: 2,
  },
  addButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  notice: {
    marginTop: spacing.lg,
  },
});
