/** Settings - profile, security and preference rows. */
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { LogoMark } from '@/components/Logo';
import { Card, DemoNotice, ListRow, Screen, SectionHeader, Separator } from '@/components/ui';
import { truncateMiddle } from '@/lib/format';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function Settings() {
  const router = useRouter();
  const addresses = useWallet((s) => s.addresses);
  const hideBalances = useWallet((s) => s.hideBalances);
  const setHideBalances = useWallet((s) => s.setHideBalances);

  const comingSoon = (feature: string) =>
    Alert.alert(feature, `${feature} is not available yet.`);

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <LogoMark size={44} cutout={colors.surface} />
          </View>
          <Text style={type.title}>Account 1</Text>
          <Text style={type.mono}>{truncateMiddle(addresses.solana, 6, 6)}</Text>
        </View>

        <SectionHeader title="Wallet" />
        <Card style={styles.card}>
          <ListRow
            left={<SettingIcon name="person-outline" />}
            title="Account"
            subtitle="Account 1"
            chevron
            onPress={() => comingSoon('Account management')}
          />
          <Separator inset={68} />
          <ListRow
            left={<SettingIcon name="list-outline" />}
            title="Manage token list"
            chevron
            onPress={() => router.push('/manage-tokens')}
          />
          <Separator inset={68} />
          <ListRow
            left={<SettingIcon name="git-network-outline" />}
            title="Networks"
            subtitle="Solana, Ethereum, Polygon, Bitcoin"
            chevron
            onPress={() => comingSoon('Network settings')}
          />
        </Card>

        <SectionHeader title="Security" />
        <Card style={styles.card}>
          <ListRow
            left={<SettingIcon name="key-outline" />}
            title="Secret recovery phrase"
            chevron
            onPress={() =>
              Alert.alert(
                'Recovery phrase',
                'Never share your recovery phrase. Anyone who has it can access your wallet.',
              )
            }
          />
          <Separator inset={68} />
          <ListRow
            left={<SettingIcon name="finger-print-outline" />}
            title="Face ID & passcode"
            chevron
            onPress={() => comingSoon('Biometric lock')}
          />
          <Separator inset={68} />
          <ListRow
            left={<SettingIcon name="shield-checkmark-outline" />}
            title="Auto-lock"
            subtitle="Never"
            chevron
            onPress={() => comingSoon('Auto-lock')}
          />
        </Card>

        <SectionHeader title="Preferences" />
        <Card style={styles.card}>
          <ListRow
            left={<SettingIcon name="eye-off-outline" />}
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
          <Separator inset={68} />
          <ListRow
            left={<SettingIcon name="notifications-outline" />}
            title="Notifications"
            chevron
            onPress={() => comingSoon('Notifications')}
          />
          <Separator inset={68} />
          <ListRow
            left={<SettingIcon name="cash-outline" />}
            title="Currency"
            subtitle="USD"
            chevron
            onPress={() => comingSoon('Currency selection')}
          />
        </Card>

        <View style={styles.about}>
          <Text style={type.small}>
Photon {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>

      
        <DemoNotice />
      </ScrollView>
    </Screen>
  );
}

function SettingIcon({
  name,
  accent = false,
}: {
  name: keyof typeof Ionicons.glyphMap;
  accent?: boolean;
}) {
  return (
    <View style={[styles.settingIcon, accent && styles.settingIconAccent]}>
      <Ionicons name={name} size={19} color={accent ? colors.accent : colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  profile: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  card: {
    marginHorizontal: spacing.lg,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconAccent: {
    backgroundColor: colors.accentSoft,
  },
  about: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
  },
});
