/**
 * Demo Settings - the hidden configuration panel.
 *
 * Reached by tapping the Home balance five times within three seconds, or from
 * Settings. Every balance in the wallet is editable here, custom tokens can be
 * added, and the whole thing can be reset to factory demo data.
 *
 * The "not real funds" disclosure on this screen is deliberately permanent.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TokenIcon } from '@/components/TokenIcon';
import {
  Button,
  Card,
  DemoNotice,
  PressScale,
  Screen,
  SectionHeader,
  Separator,
} from '@/components/ui';
import { CUSTOM_TOKEN_COLORS } from '@/data/tokens';
import { formatUsd, parseAmount } from '@/lib/format';
import { usePortfolio } from '@/store/portfolio';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function DemoSettings() {
  const router = useRouter();
  const { rows, totalUsd } = usePortfolio(true);
  const setBalance = useWallet((s) => s.setBalance);
  const addCustomToken = useWallet((s) => s.addCustomToken);
  const removeToken = useWallet((s) => s.removeToken);
  const showDemoBanner = useWallet((s) => s.showDemoBanner);
  const setShowDemoBanner = useWallet((s) => s.setShowDemoBanner);
  const cashBalance = useWallet((s) => s.cashBalance);
  const setCashBalance = useWallet((s) => s.setCashBalance);
  const resetAll = useWallet((s) => s.resetAll);

  const [newName, setNewName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newColor, setNewColor] = useState(CUSTOM_TOKEN_COLORS[0]);

  const canAdd = newName.trim().length > 0 && newSymbol.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    addCustomToken({
      name: newName.trim(),
      symbol: newSymbol.trim(),
      balance: parseAmount(newBalance),
      color: newColor,
    });
    setNewName('');
    setNewSymbol('');
    setNewBalance('');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset all data?',
      'Balances, activity, addresses and your recovery phrase go back to factory demo values. You will start again from the welcome screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetAll();
            router.dismissAll();
            router.replace('/onboarding');
          },
        },
      ],
    );
  };

  const confirmRemove = (tokenId: string, symbol: string) => {
    Alert.alert('Remove token?', `${symbol} will be removed from this demo wallet.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeToken(tokenId) },
    ]);
  };

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
          <View style={styles.intro}>
            <Ionicons name="flask" size={22} color={colors.warning} />
            <Text style={[type.caption, styles.introText]}>
              Everything below controls simulated data only. Portfolio total is currently{' '}
              {formatUsd(totalUsd)}.
            </Text>
          </View>

          <SectionHeader title="Token balances" />
          <Card style={styles.card}>
            {rows.map((row, index) => (
              <View key={row.token.id}>
                {index > 0 ? <Separator inset={68} /> : null}
                <BalanceEditor
                  color={row.token.color}
                  glyph={row.token.glyph}
                  symbol={row.token.symbol}
                  name={row.token.name}
                  value={row.balance}
                  usd={row.usdValue}
                  onChange={(value) => setBalance(row.token.id, value)}
                  onRemove={
                    row.token.custom
                      ? () => confirmRemove(row.token.id, row.token.symbol)
                      : undefined
                  }
                />
              </View>
            ))}
          </Card>

          <SectionHeader title="Cash balance" />
          <Card style={styles.card}>
            <View style={styles.cashRow}>
              <Text style={type.body}>Simulated cash</Text>
              <View style={styles.cashInputWrap}>
                <Text style={type.body}>$</Text>
                <TextInput
                  defaultValue={String(cashBalance)}
                  onChangeText={(text) => setCashBalance(parseAmount(text))}
                  keyboardType="decimal-pad"
                  style={styles.cashInput}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
          </Card>

          <SectionHeader title="Add a custom token" />
          <Card style={[styles.card, styles.addCard]}>
            <LabelledInput
              label="Name"
              value={newName}
              onChangeText={setNewName}
              placeholder="Example Token"
            />
            <LabelledInput
              label="Symbol"
              value={newSymbol}
              onChangeText={setNewSymbol}
              placeholder="EXM"
              autoCapitalize="characters"
              maxLength={8}
            />
            <LabelledInput
              label="Balance"
              value={newBalance}
              onChangeText={setNewBalance}
              placeholder="0"
              keyboardType="decimal-pad"
            />

            <Text style={[type.caption, styles.colorLabel]}>Badge colour</Text>
            <View style={styles.swatches}>
              {CUSTOM_TOKEN_COLORS.map((color) => (
                <PressScale
                  key={color}
                  onPress={() => setNewColor(color)}
                  style={[
                    styles.swatch,
                    { backgroundColor: color },
                    newColor === color && styles.swatchSelected,
                  ]}
                >
                  {newColor === color ? (
                    <Ionicons name="checkmark" size={16} color="#101014" />
                  ) : null}
                </PressScale>
              ))}
            </View>

            <Text style={[type.small, styles.hint]}>
              Custom tokens have no market data, so they are valued at a flat $1.00.
            </Text>

            <Button label="Add token" disabled={!canAdd} onPress={handleAdd} />
          </Card>

          <SectionHeader title="Display" />
          <Card style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={type.body}>DEMO FUNDS banner</Text>
                <Text style={[type.caption, styles.switchSub]}>
                  Shows a warning strip at the top of Home
                </Text>
              </View>
              <Switch
                value={showDemoBanner}
                onValueChange={setShowDemoBanner}
                trackColor={{ false: colors.surfacePressed, true: colors.accentDeep }}
                thumbColor={colors.text}
              />
            </View>
          </Card>

          <SectionHeader title="Danger zone" />
          <Card style={styles.card}>
            <View style={styles.resetBlock}>
              <Text style={[type.caption, styles.resetBlurb]}>
                Restore factory demo data: default balances, a fresh activity history, new
                addresses and a new recovery phrase.
              </Text>
              <Button label="Reset all data" variant="secondary" onPress={handleReset} />
            </View>
          </Card>

          {/* Permanent labelling - not removable from this panel. */}
          <DemoNotice style={styles.notice} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function BalanceEditor({
  color,
  glyph,
  symbol,
  name,
  value,
  usd,
  onChange,
  onRemove,
}: {
  color: string;
  glyph: string;
  symbol: string;
  name: string;
  value: number;
  usd: number;
  onChange: (value: number) => void;
  onRemove?: () => void;
}) {
  // Uncontrolled so typing "1." or a trailing zero is not fought by the parser
  // on every keystroke.
  return (
    <View style={styles.balanceRow}>
      <TokenIcon token={{ color, glyph, symbol }} />
      <View style={styles.balanceText}>
        <Text style={type.body}>{symbol}</Text>
        <Text style={[type.small, styles.balanceSub]} numberOfLines={1}>
          {name} · {formatUsd(usd)}
        </Text>
      </View>
      <TextInput
        defaultValue={String(value)}
        onChangeText={(text) => onChange(parseAmount(text))}
        keyboardType="decimal-pad"
        style={styles.balanceInput}
        selectTextOnFocus
      />
      {onRemove ? (
        <PressScale onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={18} color={colors.negative} />
        </PressScale>
      ) : null}
    </View>
  );
}

function LabelledInput({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[type.caption, styles.fieldLabel]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        autoCorrect={false}
        {...props}
        style={styles.field}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingBottom: spacing.xxxl,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
  },
  introText: {
    flex: 1,
    color: colors.warning,
    lineHeight: 19,
  },
  card: {
    marginHorizontal: spacing.lg,
  },
  addCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  balanceText: {
    flex: 1,
  },
  balanceSub: {
    marginTop: 2,
    color: colors.textTertiary,
  },
  balanceInput: {
    minWidth: 96,
    maxWidth: 130,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  removeButton: {
    padding: spacing.xs,
  },

  cashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  cashInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  cashInput: {
    minWidth: 90,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },

  fieldWrap: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textTertiary,
  },
  field: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  colorLabel: {
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  hint: {
    color: colors.textTertiary,
    lineHeight: 17,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  switchText: {
    flex: 1,
  },
  switchSub: {
    marginTop: 2,
  },

  resetBlock: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  resetBlurb: {
    lineHeight: 20,
  },
  notice: {
    marginTop: spacing.lg,
  },
});
