/**
 * Address Book - saved send destinations.
 *
 * Entries appear in the Send flow's recipient field, so saving one here has a
 * real effect rather than filling a list nothing reads.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Button,
  Card,
  ListRow,
  PressScale,
  Screen,
  SectionHeader,
  Separator,
} from '@/components/ui';
import { truncateMiddle } from '@/lib/format';
import { useSettings } from '@/store/settings';
import { NETWORKS, NetworkId } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function AddressBook() {
  const entries = useSettings((s) => s.addressBook);
  const addAddress = useSettings((s) => s.addAddress);
  const removeAddress = useSettings((s) => s.removeAddress);
  const disabledNetworks = useSettings((s) => s.disabledNetworks);

  const availableNetworks = NETWORKS.filter((n) => !disabledNetworks.includes(n.id));

  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState<NetworkId>(availableNetworks[0]?.id ?? 'solana');

  const canAdd = label.trim().length > 0 && address.trim().length >= 8;

  const handleAdd = () => {
    if (!canAdd) return;
    addAddress({ label: label.trim(), address: address.trim(), network });
    setLabel('');
    setAddress('');
  };

  const confirmRemove = (id: string, name: string) =>
    Alert.alert('Remove entry?', `${name} will be removed from the address book.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeAddress(id) },
    ]);

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
          {entries.length > 0 ? (
            <>
              <SectionHeader title="Saved" />
              <Card style={styles.card}>
                {entries.map((entry, index) => {
                  const net = NETWORKS.find((n) => n.id === entry.network);
                  return (
                    <View key={entry.id}>
                      {index > 0 ? <Separator inset={spacing.lg} /> : null}
                      <ListRow
                        title={entry.label}
                        subtitle={`${net?.name ?? entry.network}  ·  ${truncateMiddle(entry.address, 6, 6)}`}
                        right={
                          <PressScale
                            onPress={() => confirmRemove(entry.id, entry.label)}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${entry.label}`}
                          >
                            <Ionicons name="trash-outline" size={18} color={colors.negative} />
                          </PressScale>
                        }
                      />
                    </View>
                  );
                })}
              </Card>
            </>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={36} color={colors.textTertiary} />
              <Text style={[type.caption, styles.emptyText]}>
                No saved addresses yet. Anything you add here shows up when you send.
              </Text>
            </View>
          )}

          <SectionHeader title="Add an address" />
          <Card style={styles.card}>
            <View style={styles.field}>
              <Text style={[type.small, styles.label]}>Label</Text>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="Hardware wallet"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
                accessibilityLabel="Label"
              />
            </View>

            <Separator inset={spacing.lg} />

            <View style={styles.field}>
              <Text style={[type.small, styles.label]}>Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Paste an address"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, styles.mono]}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Address"
              />
            </View>

            <Separator inset={spacing.lg} />

            <View style={styles.field}>
              <Text style={[type.small, styles.label]}>Network</Text>
              <View style={styles.networkRow}>
                {availableNetworks.map((n) => {
                  const active = n.id === network;
                  return (
                    <PressScale
                      key={n.id}
                      onPress={() => setNetwork(n.id)}
                      accessibilityRole="button"
                      accessibilityLabel={n.name}
                      accessibilityState={{ selected: active }}
                      style={[styles.networkChip, active && styles.networkChipActive]}
                    >
                      <Text
                        style={[
                          type.small,
                          { color: active ? colors.bg : colors.textSecondary, fontWeight: '700' },
                        ]}
                      >
                        {n.symbol}
                      </Text>
                    </PressScale>
                  );
                })}
              </View>
            </View>
          </Card>

          <Button
            label="Save address"
            disabled={!canAdd}
            onPress={handleAdd}
            style={styles.save}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxxl },
  card: { marginHorizontal: spacing.lg },
  field: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  label: { marginBottom: spacing.xs },
  input: { color: colors.text, fontSize: 16, paddingVertical: spacing.xs },
  mono: { fontSize: 14 },
  networkRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  networkChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh,
  },
  networkChipActive: { backgroundColor: colors.accent },
  save: { marginHorizontal: spacing.lg, marginTop: spacing.xl },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: { textAlign: 'center', lineHeight: 19 },
});
