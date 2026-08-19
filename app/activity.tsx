/**
 * Activity - the full transaction feed, newest first and grouped by day.
 *
 * Tapping a row opens a detail sheet with the (fake) signature, which can be
 * copied so the flow feels complete.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActivityRow } from '@/components/ActivityRow';
import { Button, Card, Screen, SectionHeader, Separator } from '@/components/ui';
import { dayLabel, formatAmount } from '@/lib/format';
import { useMoney } from '@/store/money';
import { ActivityItem, useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function Activity() {
  const money = useMoney();
  const activity = useWallet((s) => s.activity);
  const tokens = useWallet((s) => s.tokens);
  const [selected, setSelected] = useState<ActivityItem | null>(null);

  const tokenById = useMemo(
    () => Object.fromEntries(tokens.map((t) => [t.id, t])),
    [tokens],
  );

  // Group into day buckets while preserving the reverse-chronological order.
  const sections = useMemo(() => {
    const sorted = [...activity].sort((a, b) => b.timestamp - a.timestamp);
    const groups: { label: string; items: ActivityItem[] }[] = [];
    for (const item of sorted) {
      const label = dayLabel(item.timestamp);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(item);
      else groups.push({ label, items: [item] });
    }
    return groups;
  }, [activity]);

  const selectedToken = selected ? tokenById[selected.tokenId] : undefined;
  const selectedToToken = selected?.toTokenId ? tokenById[selected.toTokenId] : undefined;

  return (
    <Screen edges={['bottom']}>
      {activity.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={40} color={colors.textTertiary} />
          <Text style={[type.body, styles.emptyTitle]}>No activity yet</Text>
          <Text style={[type.caption, styles.emptyBlurb]}>
Sends, swaps and purchases will show up here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {sections.map((section) => (
            <View key={section.label}>
              <SectionHeader title={section.label} />
              <Card style={styles.card}>
                {section.items.map((item, index) => (
                  <View key={item.id}>
                    {index > 0 ? <Separator inset={68} /> : null}
                    <ActivityRow
                      item={item}
                      token={tokenById[item.tokenId]}
                      toToken={item.toTokenId ? tokenById[item.toTokenId] : undefined}
                      onPress={() => setSelected(item)}
                    />
                  </View>
                ))}
              </Card>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            {selected ? (
              <>
                <View style={styles.grabber} />
                <Text style={[type.title, styles.sheetTitle]}>Transaction</Text>

                <DetailRow label="Type" value={selected.type.toUpperCase()} />
                <DetailRow
                  label="Amount"
                  value={`${formatAmount(selected.amount)} ${selectedToken?.symbol ?? ''}`}
                />
                {selectedToToken ? (
                  <DetailRow
                    label="Received"
                    value={`${formatAmount(selected.toAmount ?? 0)} ${selectedToToken.symbol}`}
                  />
                ) : null}
                <DetailRow label="Value" value={money(selected.usdValue)} />
                {selected.address ? (
                  <DetailRow label="Address" value={selected.address} mono />
                ) : null}
                <DetailRow label="Signature" value={selected.signature} mono />
                <DetailRow
                  label="Date"
                  value={new Date(selected.timestamp).toLocaleString('en-US')}
                />

                <View style={styles.sheetActions}>
                  <Button
                    label="Copy signature"
                    variant="secondary"
                    style={styles.sheetButton}
                    onPress={() => void Clipboard.setStringAsync(selected.signature)}
                  />
                  <Button
                    label="Close"
                    style={styles.sheetButton}
                    onPress={() => setSelected(null)}
                  />
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[type.caption, styles.detailLabel]}>{label}</Text>
      <Text
        style={[mono ? type.mono : type.caption, styles.detailValue]}
        numberOfLines={mono ? 2 : 1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  card: {
    marginHorizontal: spacing.lg,
  },
  notice: {
    marginTop: spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    marginTop: spacing.md,
  },
  emptyBlurb: {
    textAlign: 'center',
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
    padding: spacing.xl,
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
  sheetTitle: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  detailLabel: {
    color: colors.textTertiary,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.text,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  sheetButton: {
    flex: 1,
  },
  sheetNotice: {
    paddingHorizontal: 0,
    marginTop: spacing.sm,
  },
});
