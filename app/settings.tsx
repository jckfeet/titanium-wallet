/**
 * Settings hub.
 *
 * A search field, the active account, then two grouped card stacks and a
 * pinned Lock Wallet action. Every row here leads somewhere real - there are
 * no placeholder alerts left on this screen.
 */
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, DemoNotice, ListRow, Screen, Separator } from '@/components/ui';
import { search } from '@/lib/search';
import { useLock } from '@/store/lock';
import { useSettings } from '@/store/settings';
import { NETWORKS, useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsRow {
  key: string;
  icon: IconName;
  title: string;
  value?: string;
  route: string;
  group: 'wallet' | 'connections';
  /** Extra words the search field should match on. */
  keywords: string;
}

export default function Settings() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const accounts = useWallet((s) => s.accounts);
  const activeAccountId = useWallet((s) => s.activeAccountId);
  const lock = useLock((s) => s.lock);

  const currency = useSettings((s) => s.currency);
  const disabledNetworks = useSettings((s) => s.disabledNetworks);
  const addressBook = useSettings((s) => s.addressBook);
  const connectedApps = useSettings((s) => s.connectedApps);
  const biometricsEnabled = useSettings((s) => s.biometricsEnabled);

  const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];
  const activeNetworks = NETWORKS.length - disabledNetworks.length;

  const rows: SettingsRow[] = useMemo(
    () => [
      {
        key: 'accounts',
        icon: 'wallet-outline',
        title: 'Manage Accounts',
        value: String(accounts.length),
        route: '/accounts',
        group: 'wallet',
        keywords: 'account switch add rename remove',
      },
      {
        key: 'preferences',
        icon: 'options-outline',
        title: 'Preferences',
        value: currency,
        route: '/preferences',
        group: 'wallet',
        keywords: 'currency notifications hide balances display',
      },
      {
        key: 'security',
        icon: 'shield-outline',
        title: 'Security & Privacy',
        value: biometricsEnabled ? 'On' : undefined,
        route: '/security',
        group: 'wallet',
        keywords: 'face id touch biometrics auto lock recovery phrase passcode',
      },
      {
        key: 'networks',
        icon: 'globe-outline',
        title: 'Active Networks',
        value: activeNetworks === NETWORKS.length ? 'All' : String(activeNetworks),
        route: '/networks',
        group: 'connections',
        keywords: 'solana ethereum polygon bitcoin chains',
      },
      {
        key: 'address-book',
        icon: 'book-outline',
        title: 'Address Book',
        value: addressBook.length > 0 ? String(addressBook.length) : undefined,
        route: '/address-book',
        group: 'connections',
        keywords: 'saved addresses contacts recipients',
      },
      {
        key: 'connected-apps',
        icon: 'link-outline',
        title: 'Connected Apps',
        value: connectedApps.length > 0 ? String(connectedApps.length) : undefined,
        route: '/connected-apps',
        group: 'connections',
        keywords: 'dapps sessions permissions',
      },
      {
        key: 'tokens',
        icon: 'list-outline',
        title: 'Manage token list',
        route: '/manage-tokens',
        group: 'connections',
        keywords: 'tokens hide show assets',
      },
    ],
    [
      accounts.length,
      currency,
      biometricsEnabled,
      activeNetworks,
      addressBook.length,
      connectedApps.length,
    ],
  );

  const filtered = query.trim() ? search(rows, query, (row) => [row.title, row.keywords]) : null;

  const renderGroup = (items: SettingsRow[]) => (
    <Card style={styles.card}>
      {items.map((row, index) => (
        <View key={row.key}>
          {index > 0 ? <Separator inset={68} /> : null}
          <ListRow
            left={<SettingIcon name={row.icon} />}
            title={row.title}
            rightTitle={row.value}
            chevron
            onPress={() => router.push(row.route as never)}
          />
        </View>
      ))}
    </Card>
  );

  const walletRows = rows.filter((r) => r.group === 'wallet');
  const connectionRows = rows.filter((r) => r.group === 'connections');

  return (
    <Screen edges={['bottom']}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search..."
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search settings"
        />
        {query.length > 0 ? (
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
        showsVerticalScrollIndicator={false}
      >
        {filtered ? (
          filtered.length > 0 ? (
            renderGroup(filtered)
          ) : (
            <Text style={[type.caption, styles.noResults]}>
              Nothing in settings matches that search.
            </Text>
          )
        ) : (
          <>
            <Card style={styles.card}>
              <ListRow
                left={
                  <View style={[styles.avatar, { backgroundColor: active?.color ?? colors.accent }]}>
                    <Text style={styles.avatarText}>{active?.name.slice(-1) ?? '1'}</Text>
                  </View>
                }
                title={active?.handle ?? '@photon'}
                subtitle={active?.name}
                chevron
                onPress={() => router.push('/accounts')}
              />
            </Card>

            {renderGroup(walletRows)}
            {renderGroup(connectionRows)}

            <Text style={[type.small, styles.version]}>
              Photon {Constants.expoConfig?.version ?? '1.0.0'}
            </Text>

            <DemoNotice />
          </>
        )}
      </ScrollView>

      <View style={styles.lockBar}>
        <Button label="Lock Wallet" variant="secondary" onPress={lock} />
      </View>
    </Screen>
  );
}

function SettingIcon({ name }: { name: IconName }) {
  return (
    <View style={styles.settingIcon}>
      <Ionicons name={name} size={18} color={colors.accent} />
    </View>
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
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 16 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
  card: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: {
    textAlign: 'center',
    paddingTop: spacing.md,
    color: colors.textTertiary,
  },
  noResults: {
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  lockBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    backgroundColor: colors.bg,
  },
});
