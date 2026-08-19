/**
 * Swap - from/to panels, a flip control, shortcuts and a review sheet.
 *
 * Confirming moves local balances and appends a swap record to Activity. A
 * fixed 0.4% spread stands in for price impact plus fees so the quote is not a
 * perfect 1:1 conversion.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TokenIcon } from '@/components/TokenIcon';
import { TokenPickerModal } from '@/components/TokenPickerModal';
import { Button, Card, DemoNotice, PressScale } from '@/components/ui';
import { formatAmount, formatPrice, formatUsd, parseAmount } from '@/lib/format';
import { usePortfolio } from '@/store/portfolio';
import { useRefreshPrices } from '@/store/prices';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

/** Simulated price impact + fee applied to the destination leg. */
const SPREAD = 0.004;

export default function Swap() {
  const tokens = useWallet((s) => s.tokens);
  const swap = useWallet((s) => s.swap);
  const { rows } = usePortfolio(true);
  useRefreshPrices(tokens);

  const [fromId, setFromId] = useState(tokens[0]?.id ?? '');
  const [toId, setToId] = useState(tokens[1]?.id ?? '');
  const [amountText, setAmountText] = useState('');
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [done, setDone] = useState(false);

  const fromRow = rows.find((r) => r.token.id === fromId);
  const toRow = rows.find((r) => r.token.id === toId);

  const amount = parseAmount(amountText);
  const rate = fromRow && toRow && toRow.price > 0 ? fromRow.price / toRow.price : 0;
  const received = amount * rate * (1 - SPREAD);
  const usdValue = amount * (fromRow?.price ?? 0);

  const insufficient = fromRow ? amount > fromRow.balance : false;
  const canReview = Boolean(fromRow && toRow && amount > 0 && !insufficient);

  const setPercent = (fraction: number) => {
    if (!fromRow) return;
    const value = fromRow.balance * fraction;
    setAmountText(value > 0 ? String(Number(value.toFixed(8))) : '');
  };

  const flip = () => {
    setFromId(toId);
    setToId(fromId);
    setAmountText('');
  };

  const confirm = () => {
    if (!fromRow || !toRow) return;
    swap({
      fromTokenId: fromRow.token.id,
      toTokenId: toRow.token.id,
      fromAmount: amount,
      toAmount: received,
      usdValue,
    });
    setReviewing(false);
    setDone(true);
    setAmountText('');
  };

  const rateLine = useMemo(() => {
    if (!fromRow || !toRow || rate <= 0) return null;
    return `1 ${fromRow.token.symbol} ≈ ${formatAmount(rate, 6)} ${toRow.token.symbol}`;
  }, [fromRow, toRow, rate]);

  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* From panel */}
          <Card style={styles.panel}>
            <View style={styles.panelHead}>
              <Text style={type.caption}>You pay</Text>
              <Text style={type.caption}>
                Balance: {fromRow ? formatAmount(fromRow.balance) : '0'}{' '}
                {fromRow?.token.symbol ?? ''}
              </Text>
            </View>

            <View style={styles.panelBody}>
              <PressScale style={styles.tokenChip} onPress={() => setPicker('from')}>
                {fromRow ? <TokenIcon token={fromRow.token} size={28} /> : null}
                <Text style={type.body}>{fromRow?.token.symbol ?? 'Select'}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </PressScale>

              <TextInput
                value={amountText}
                onChangeText={setAmountText}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
            </View>

            <View style={styles.panelFoot}>
              <View style={styles.shortcuts}>
                <Shortcut label="50%" onPress={() => setPercent(0.5)} />
                <Shortcut label="MAX" onPress={() => setPercent(1)} />
              </View>
              <Text style={type.caption}>{formatUsd(usdValue)}</Text>
            </View>
          </Card>

          <View style={styles.flipWrap}>
            <PressScale onPress={flip} style={styles.flipButton} scaleTo={0.88}>
              <Ionicons name="arrow-down" size={20} color={colors.accent} />
            </PressScale>
          </View>

          {/* To panel */}
          <Card style={styles.panel}>
            <View style={styles.panelHead}>
              <Text style={type.caption}>You receive</Text>
              <Text style={type.caption}>
                Balance: {toRow ? formatAmount(toRow.balance) : '0'} {toRow?.token.symbol ?? ''}
              </Text>
            </View>

            <View style={styles.panelBody}>
              <PressScale style={styles.tokenChip} onPress={() => setPicker('to')}>
                {toRow ? <TokenIcon token={toRow.token} size={28} /> : null}
                <Text style={type.body}>{toRow?.token.symbol ?? 'Select'}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </PressScale>

              <Text style={[styles.amountInput, styles.amountOutput]} numberOfLines={1}>
                {received > 0 ? formatAmount(received) : '0'}
              </Text>
            </View>

            <View style={styles.panelFoot}>
              <Text style={type.caption}>
                {toRow ? formatPrice(toRow.price) : ''}
              </Text>
              <Text style={type.caption}>
                {formatUsd(received * (toRow?.price ?? 0))}
              </Text>
            </View>
          </Card>

          {rateLine ? (
            <View style={styles.rateRow}>
              <Text style={type.caption}>Rate</Text>
              <Text style={[type.caption, { color: colors.text }]}>{rateLine}</Text>
            </View>
          ) : null}

          {insufficient ? (
            <Text style={[type.caption, styles.error]}>
              Not enough {fromRow?.token.symbol} for this swap.
            </Text>
          ) : null}

          <Button
            label="Review swap"
            disabled={!canReview}
            style={styles.reviewButton}
            onPress={() => setReviewing(true)}
          />

          <DemoNotice />
        </ScrollView>
      </KeyboardAvoidingView>

      <TokenPickerModal
        visible={picker !== null}
        title={picker === 'from' ? 'Swap from' : 'Swap to'}
        excludeId={picker === 'from' ? toId : fromId}
        onSelect={(id) => {
          if (picker === 'from') setFromId(id);
          else setToId(id);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />

      {/* Review sheet */}
      <Modal
        visible={reviewing}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewing(false)}
      >
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <Text style={[type.title, styles.sheetTitle]}>Review swap</Text>

            <View style={styles.reviewPair}>
              <View style={styles.reviewLeg}>
                {fromRow ? <TokenIcon token={fromRow.token} size={44} /> : null}
                <Text style={[type.body, styles.legAmount]}>
                  {formatAmount(amount)} {fromRow?.token.symbol}
                </Text>
                <Text style={type.small}>{formatUsd(usdValue)}</Text>
              </View>

              <Ionicons name="arrow-forward" size={20} color={colors.textTertiary} />

              <View style={styles.reviewLeg}>
                {toRow ? <TokenIcon token={toRow.token} size={44} /> : null}
                <Text style={[type.body, styles.legAmount]}>
                  {formatAmount(received)} {toRow?.token.symbol}
                </Text>
                <Text style={type.small}>{formatUsd(received * (toRow?.price ?? 0))}</Text>
              </View>
            </View>

            <SummaryRow label="Rate" value={rateLine ?? '-'} />
            <SummaryRow label="Price impact + fee" value={`${(SPREAD * 100).toFixed(2)}%`} />
            <SummaryRow label="Network fee" value="0.000005 SOL (simulated)" />

            <View style={styles.sheetActions}>
              <Button
                label="Cancel"
                variant="secondary"
                style={styles.flex}
                onPress={() => setReviewing(false)}
              />
              <Button label="Confirm swap" style={styles.flex} onPress={confirm} />
            </View>
            <DemoNotice style={styles.sheetNotice} />
          </View>
        </View>
      </Modal>

      {/* Success */}
      <Modal visible={done} transparent animationType="fade" onRequestClose={() => setDone(false)}>
        <View style={[styles.scrim, styles.successScrim]}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={38} color={colors.bg} />
            </View>
            <Text style={type.title}>Swap complete</Text>
            <Text style={[type.caption, styles.successBlurb]}>
              Your simulated balances have been updated and the swap was added to Activity.
            </Text>
            <Button label="Done" style={styles.successButton} onPress={() => setDone(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Shortcut({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} style={styles.shortcut}>
      <Text style={[type.small, { color: colors.accent, fontWeight: '700' }]}>{label}</Text>
    </PressScale>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={type.caption}>{label}</Text>
      <Text style={[type.caption, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  panel: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  amountInput: {
    flex: 1,
    textAlign: 'right',
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    padding: 0,
  },
  amountOutput: {
    color: colors.textSecondary,
  },
  panelFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shortcuts: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  shortcut: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  flipWrap: {
    alignItems: 'center',
    marginVertical: -14,
    zIndex: 2,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 4,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  error: {
    color: colors.negative,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  reviewButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
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
  reviewPair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  reviewLeg: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  legAmount: {
    marginTop: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  sheetNotice: {
    paddingHorizontal: 0,
    marginTop: spacing.sm,
  },

  successScrim: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  successCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.positive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successBlurb: {
    textAlign: 'center',
    lineHeight: 20,
  },
  successButton: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
