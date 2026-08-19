/**
 * Buy - pick a token and a USD amount, confirm, and the balance is credited.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { Button, Card, PressScale, Screen } from '@/components/ui';
import { formatAmount, formatPrice, parseAmount } from '@/lib/format';
import { useMoney } from '@/store/money';
import { usePortfolio } from '@/store/portfolio';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

const PRESETS = [25, 50, 100, 250];

export default function Buy() {
  const money = useMoney();
  const router = useRouter();
  const buy = useWallet((s) => s.buy);
  const { rows } = usePortfolio(true);

  const [tokenId, setTokenId] = useState(rows[0]?.token.id ?? '');
  const [usdText, setUsdText] = useState('');
  const [picking, setPicking] = useState(false);
  const [done, setDone] = useState(false);

  const row = rows.find((r) => r.token.id === tokenId) ?? rows[0];
  const usd = parseAmount(usdText);
  const amount = row && row.price > 0 ? usd / row.price : 0;
  const canBuy = Boolean(row && usd > 0);

  const confirm = () => {
    if (!row) return;
    buy({ tokenId: row.token.id, amount, usdValue: usd });
    setDone(true);
    setUsdText('');
  };

  if (!row) {
    return (
      <Screen edges={['bottom']}>
        <View style={styles.missing}>
          <Text style={type.body}>Add a token before buying.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.amountBlock}>
            <Text style={[type.caption, styles.label]}>You spend</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                value={usdText}
                onChangeText={setUsdText}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
            </View>
            <Text style={type.caption}>
              ≈ {formatAmount(amount)} {row.token.symbol}
            </Text>
          </View>

          <View style={styles.presets}>
            {PRESETS.map((preset) => (
              <PressScale
                key={preset}
                style={styles.preset}
                onPress={() => setUsdText(String(preset))}
              >
                <Text style={styles.presetLabel}>${preset}</Text>
              </PressScale>
            ))}
          </View>

          <Card style={styles.card}>
            <PressScale scaleTo={0.99} haptics={false} onPress={() => setPicking(true)}>
              <View style={styles.tokenRow}>
                <TokenIcon token={row.token} />
                <View style={styles.tokenText}>
                  <Text style={type.body}>{row.token.name}</Text>
                  <Text style={[type.caption, styles.tokenSub]}>
                    {formatPrice(row.price)} · You hold {formatAmount(row.balance)}{' '}
                    {row.token.symbol}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </View>
            </PressScale>
          </Card>

          <Button
            label={canBuy ? `Buy ${money(usd)} of ${row.token.symbol}` : 'Enter an amount'}
            disabled={!canBuy}
            style={styles.buyButton}
            onPress={confirm}
          />

        </ScrollView>
      </KeyboardAvoidingView>

      <TokenPickerModal
        visible={picking}
        title="Buy which token?"
        onSelect={(id) => {
          setTokenId(id);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />

      <Modal visible={done} transparent animationType="fade" onRequestClose={() => setDone(false)}>
        <View style={styles.successScrim}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={38} color={colors.bg} />
            </View>
            <Text style={type.title}>Purchase complete</Text>
            <Text style={[type.caption, styles.successBlurb]}>
{row.token.symbol} has been added to your portfolio.
            </Text>
            <Button
              label="Done"
              style={styles.successButton}
              onPress={() => {
                setDone(false);
                router.back();
              }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  label: {
    marginBottom: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    color: colors.textSecondary,
    fontSize: 36,
    fontWeight: '700',
  },
  amountInput: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '700',
    minWidth: 120,
    padding: 0,
    textAlign: 'left',
  },
  presets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  preset: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  presetLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: spacing.lg,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  tokenText: {
    flex: 1,
  },
  tokenSub: {
    marginTop: 2,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
  },
  noticeText: {
    flex: 1,
    color: colors.warning,
    lineHeight: 17,
  },
  buyButton: {
    marginHorizontal: spacing.lg,
  },
  successScrim: {
    flex: 1,
    backgroundColor: colors.scrim,
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
