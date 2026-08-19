/** Preferences - display currency, notifications and balance masking. */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Card, ListRow, PressScale, Screen, SectionHeader, Separator } from '@/components/ui';
import { CURRENCIES } from '@/data/currencies';
import { formatMoney } from '@/lib/format';
import { useSettings } from '@/store/settings';
import { useWallet } from '@/store/wallet';
import { colors, spacing, type } from '@/theme';

export default function Preferences() {
  const currency = useSettings((s) => s.currency);
  const setCurrency = useSettings((s) => s.setCurrency);
  const notificationsEnabled = useSettings((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettings((s) => s.setNotificationsEnabled);

  const hideBalances = useWallet((s) => s.hideBalances);
  const setHideBalances = useWallet((s) => s.setHideBalances);

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Display" />
        <Card style={styles.card}>
          <ListRow
            title="Hide balances"
            subtitle="Mask every figure across the app"
            right={
              <Switch
                value={hideBalances}
                onValueChange={setHideBalances}
                trackColor={{ false: colors.surfacePressed, true: colors.accentDeep }}
                thumbColor={colors.text}
                accessibilityLabel="Hide balances"
              />
            }
          />
          <Separator inset={spacing.lg} />
          <ListRow
            title="Notifications"
            subtitle={notificationsEnabled ? 'On' : 'Off'}
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.surfacePressed, true: colors.accentDeep }}
                thumbColor={colors.text}
                accessibilityLabel="Notifications"
              />
            }
          />
        </Card>

        <SectionHeader title="Currency" />
        <Card style={styles.card}>
          {CURRENCIES.map((c, index) => {
            const active = c.code === currency;
            return (
              <View key={c.code}>
                {index > 0 ? <Separator inset={spacing.lg} /> : null}
                <PressScale
                  onPress={() => setCurrency(c.code)}
                  scaleTo={0.99}
                  haptics={false}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name}, ${c.code}`}
                  accessibilityState={{ selected: active }}
                >
                  <View style={styles.currencyRow}>
                    <View style={styles.currencyBody}>
                      <Text style={type.body}>
                        {c.name} ({c.code})
                      </Text>
                      <Text style={[type.caption, styles.sample]}>
                        1,000 USD = {formatMoney(1000, c)}
                      </Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark" size={20} color={colors.accent} />
                    ) : null}
                  </View>
                </PressScale>
              </View>
            );
          })}
        </Card>

        <Text style={[type.small, styles.hint]}>
          Conversion uses a bundled rate table, not a live feed. Balances are always held in USD -
          only the display converts.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  card: { marginHorizontal: spacing.lg },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 60,
  },
  currencyBody: { flex: 1 },
  sample: { marginTop: 2 },
  hint: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, lineHeight: 17 },
});
