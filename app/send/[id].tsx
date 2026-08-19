/**
 * Send, step 2 - recipient and amount, then review and a success animation.
 *
 * Any string is accepted as a recipient: there is no chain to validate against,
 * and rejecting input would only get in the way of the demo.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { TokenIcon } from '@/components/TokenIcon';
import { Button, Card, DemoNotice, PressScale, Screen } from '@/components/ui';
import { fakeSolanaAddress } from '@/lib/base58';
import { formatAmount, formatUsd, parseAmount, truncateMiddle } from '@/lib/format';
import { useHolding } from '@/store/portfolio';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function SendCompose() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const holding = useHolding(id);
  const send = useWallet((s) => s.send);

  const [address, setAddress] = useState('');
  const [amountText, setAmountText] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [sent, setSent] = useState(false);

  const amount = parseAmount(amountText);
  const usdValue = amount * (holding?.price ?? 0);
  const insufficient = holding ? amount > holding.balance : false;
  const canReview = Boolean(holding && amount > 0 && !insufficient && address.trim().length >= 8);

  const confirm = () => {
    if (!holding) return;
    send({ tokenId: holding.token.id, amount, address: address.trim(), usdValue });
    setReviewing(false);
    setSent(true);
  };

  if (!holding) {
    return (
      <Screen edges={['bottom']}>
        <View style={styles.missing}>
          <Text style={type.body}>This token is no longer in your wallet.</Text>
        </View>
      </Screen>
    );
  }

  const { token } = holding;

  const setPercent = (fraction: number) => {
    const value = holding.balance * fraction;
    setAmountText(value > 0 ? String(Number(value.toFixed(8))) : '');
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: `Send ${token.symbol}` }} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[type.caption, styles.label]}>Recipient</Text>
          <Card style={styles.inputCard}>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Address or username"
              placeholderTextColor={colors.textTertiary}
              style={styles.addressInput}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
            <View style={styles.inputActions}>
              <PressScale
                style={styles.miniButton}
                onPress={async () => {
                  const text = await Clipboard.getStringAsync();
                  if (text) setAddress(text.trim());
                }}
              >
                <Ionicons name="clipboard-outline" size={16} color={colors.accent} />
                <Text style={styles.miniLabel}>Paste</Text>
              </PressScale>
              <PressScale
                style={styles.miniButton}
                onPress={() => setAddress(fakeSolanaAddress())}
              >
                <Ionicons name="shuffle-outline" size={16} color={colors.accent} />
                <Text style={styles.miniLabel}>Demo address</Text>
              </PressScale>
            </View>
          </Card>

          <Text style={[type.caption, styles.label]}>Amount</Text>
          <Card style={styles.inputCard}>
            <View style={styles.amountRow}>
              <TokenIcon token={token} size={32} />
              <TextInput
                value={amountText}
                onChangeText={setAmountText}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
              <Text style={type.body}>{token.symbol}</Text>
            </View>

            <View style={styles.amountFoot}>
              <Text style={type.caption}>{formatUsd(usdValue)}</Text>
              <View style={styles.shortcuts}>
                <PressScale style={styles.shortcut} onPress={() => setPercent(0.5)}>
                  <Text style={styles.shortcutLabel}>50%</Text>
                </PressScale>
                <PressScale style={styles.shortcut} onPress={() => setPercent(1)}>
                  <Text style={styles.shortcutLabel}>MAX</Text>
                </PressScale>
              </View>
            </View>

            <Text style={[type.small, styles.balanceHint]}>
              Balance: {formatAmount(holding.balance)} {token.symbol}
            </Text>
          </Card>

          {insufficient ? (
            <Text style={[type.caption, styles.error]}>
              Not enough {token.symbol} for this transfer.
            </Text>
          ) : null}

          <Button
            label="Review"
            disabled={!canReview}
            style={styles.reviewButton}
            onPress={() => setReviewing(true)}
          />

          <DemoNotice />
        </ScrollView>
      </KeyboardAvoidingView>

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
            <Text style={[type.title, styles.sheetTitle]}>Review send</Text>

            <View style={styles.reviewHead}>
              <TokenIcon token={token} size={56} />
              <Text style={[type.display, styles.reviewAmount]}>
                {formatAmount(amount)} {token.symbol}
              </Text>
              <Text style={type.caption}>{formatUsd(usdValue)}</Text>
            </View>

            <SummaryRow label="To" value={truncateMiddle(address.trim(), 8, 8)} />
            <SummaryRow label="Network" value="Solana (simulated)" />
            <SummaryRow label="Network fee" value="0.000005 SOL" />

            <View style={styles.sheetActions}>
              <Button
                label="Cancel"
                variant="secondary"
                style={styles.flex}
                onPress={() => setReviewing(false)}
              />
              <Button label="Confirm send" style={styles.flex} onPress={confirm} />
            </View>
            <DemoNotice style={styles.sheetNotice} />
          </View>
        </View>
      </Modal>

      <SuccessOverlay
        visible={sent}
        token={token.symbol}
        amount={formatAmount(amount)}
        onDone={() => {
          setSent(false);
          router.dismissAll();
        }}
      />
    </Screen>
  );
}

/** Spring-in checkmark shown after a confirmed send. */
function SuccessOverlay({
  visible,
  token,
  amount,
  onDone,
}: {
  visible: boolean;
  token: string;
  amount: string;
  onDone: () => void;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.12, { damping: 9, stiffness: 190 }),
        withSpring(1, { damping: 14, stiffness: 220 }),
      );
      opacity.value = withDelay(140, withTiming(1, { duration: 220 }));
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible, scale, opacity]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.successScrim}>
        <View style={styles.successCard}>
          <Animated.View style={[styles.successIcon, iconStyle]}>
            <Ionicons name="checkmark" size={40} color={colors.bg} />
          </Animated.View>
          <Animated.View style={[styles.successText, textStyle]}>
            <Text style={type.title}>Sent</Text>
            <Text style={[type.caption, styles.successBlurb]}>
              {amount} {token} left your simulated balance and the transfer was added to Activity.
            </Text>
          </Animated.View>
          <Button label="Done" style={styles.successButton} onPress={onDone} />
        </View>
      </View>
    </Modal>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    paddingTop: spacing.md,
  },
  inputCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  addressInput: {
    color: colors.text,
    fontSize: 16,
    minHeight: 44,
    padding: 0,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  miniLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  amountInput: {
    flex: 1,
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'right',
    padding: 0,
  },
  amountFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  shortcutLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  balanceHint: {
    color: colors.textTertiary,
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
  reviewHead: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  reviewAmount: {
    marginTop: spacing.md,
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
  },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.positive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  successBlurb: {
    textAlign: 'center',
    lineHeight: 20,
  },
  successButton: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
});
