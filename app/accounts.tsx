/** Manage Accounts - switch, add, rename and remove wallet accounts. */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, ListRow, PressScale, Screen, SectionHeader, Separator } from '@/components/ui';
import { truncateMiddle } from '@/lib/format';
import { useMoney } from '@/store/money';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function Accounts() {
  const accounts = useWallet((s) => s.accounts);
  const activeId = useWallet((s) => s.activeAccountId);
  const accountData = useWallet((s) => s.accountData);
  const addresses = useWallet((s) => s.addresses);
  const cashBalance = useWallet((s) => s.cashBalance);
  const addAccount = useWallet((s) => s.addAccount);
  const switchAccount = useWallet((s) => s.switchAccount);
  const renameAccount = useWallet((s) => s.renameAccount);
  const removeAccount = useWallet((s) => s.removeAccount);
  const money = useMoney();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const addressFor = (id: string) =>
    id === activeId ? addresses.solana : accountData[id]?.addresses.solana ?? '';

  const cashFor = (id: string) =>
    id === activeId ? cashBalance : accountData[id]?.cashBalance ?? 0;

  const startRename = (id: string, current: string) => {
    setRenamingId(id);
    setDraftName(current);
  };

  const commitRename = () => {
    if (renamingId) renameAccount(renamingId, draftName);
    setRenamingId(null);
    setDraftName('');
  };

  const confirmRemove = (id: string, name: string) => {
    if (accounts.length <= 1) {
      Alert.alert('Cannot remove', 'A wallet needs at least one account.');
      return;
    }
    Alert.alert('Remove account?', `${name} and its holdings will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeAccount(id) },
    ]);
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title={`${accounts.length} account${accounts.length === 1 ? '' : 's'}`} />
        <Card style={styles.card}>
          {accounts.map((account, index) => {
            const active = account.id === activeId;
            return (
              <View key={account.id}>
                {index > 0 ? <Separator inset={68} /> : null}

                {renamingId === account.id ? (
                  <View style={styles.renameRow}>
                    <TextInput
                      value={draftName}
                      onChangeText={setDraftName}
                      style={styles.renameInput}
                      autoFocus
                      selectTextOnFocus
                      onSubmitEditing={commitRename}
                      returnKeyType="done"
                      accessibilityLabel="Account name"
                    />
                    <PressScale
                      onPress={commitRename}
                      accessibilityRole="button"
                      accessibilityLabel="Save name"
                    >
                      <Ionicons name="checkmark" size={22} color={colors.accent} />
                    </PressScale>
                  </View>
                ) : (
                  <ListRow
                    left={
                      <View style={[styles.avatar, { backgroundColor: account.color }]}>
                        <Text style={styles.avatarText}>{account.name.slice(-1)}</Text>
                      </View>
                    }
                    title={account.name}
                    subtitle={`${account.handle}  ·  ${truncateMiddle(addressFor(account.id), 4, 4)}`}
                    rightTitle={money(cashFor(account.id))}
                    rightSubtitle={active ? 'Active' : undefined}
                    onPress={() => switchAccount(account.id)}
                  />
                )}

                <View style={styles.rowActions}>
                  <PressScale
                    onPress={() => startRename(account.id, account.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Rename ${account.name}`}
                    style={styles.rowAction}
                  >
                    <Text style={[type.small, styles.rowActionText]}>Rename</Text>
                  </PressScale>
                  <PressScale
                    onPress={() => confirmRemove(account.id, account.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${account.name}`}
                    style={styles.rowAction}
                  >
                    <Text style={[type.small, styles.rowActionDanger]}>Remove</Text>
                  </PressScale>
                </View>
              </View>
            );
          })}
        </Card>

        <Button
          label="Add account"
          variant="secondary"
          onPress={() => addAccount()}
          style={styles.add}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  card: { marginHorizontal: spacing.lg },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingLeft: 68,
    paddingRight: spacing.lg,
    paddingBottom: spacing.md,
  },
  rowAction: { paddingVertical: spacing.xs },
  rowActionText: { color: colors.accent },
  rowActionDanger: { color: colors.negative },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  renameInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  add: { marginHorizontal: spacing.lg, marginTop: spacing.xl },
});
