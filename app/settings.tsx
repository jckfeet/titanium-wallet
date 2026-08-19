/** Settings - profile, placeholder security rows, and the way into Demo Settings. */
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LogoMark } from '@/components/Logo';
import { Card, DemoNotice, ListRow, Screen, SectionHeader, Separator } from '@/components/ui';
import { truncateMiddle } from '@/lib/format';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function Settings() {
  const router = useRouter();
  const addresses = useWallet((s) => s.addresses);

  const notSimulated = (feature: string) =>
    Alert.alert(feature, `${feature} is not simulated in this demo. The row is a placeholder.`);

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
            onPress={() => notSimulated('Account management')}
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
            onPress={() => notSimulated('Network settings')}
          />
        </Card>

        <SectionHeader title="Security" />
        <Card style={styles.card}>
          <ListRow
            left={<SettingIcon name="key-outline" />}
            title="Secret recovery phrase"
            subtitle="Cosmetic in this demo"
            chevron
            onPress={() =>
              Alert.alert(
                'Recovery phrase',
                'The phrase shown during onboarding is decorative. Nothing in Titanium derives keys from it, so there is nothing to reveal or protect.',
              )
            }
          />
          <Separator inset={68} />
          <ListRow
            left={<SettingIcon name="finger-print-outline" />}
            title="Face ID & passcode"
            chevron
            onPress={() => notSimulated('Biometric lock')}
          />
          <Separator inset={68} />
          <ListRow
            left={<SettingIcon name="shield-checkmark-outline" />}
            title="Auto-lock"
            subtitle="Never"
            chevron
            onPress={() => notSimulated('Auto-lock')}
          />
        </Card>

        <SectionHeader title="Preferences" />
        <Card style={styles.card}>
          <ListRow
            left={<SettingIcon name="notifications-outline" />}
            title="Notifications"
            chevron
            onPress={() => notSimulated('Notifications')}
          />
          <Separator inset={68} />
          <ListRow
            left={<SettingIcon name="cash-outline" />}
            title="Currency"
            subtitle="USD"
            chevron
            onPress={() => notSimulated('Currency selection')}
          />
        </Card>

        <SectionHeader title="Demo" />
        <Card style={styles.card}>
          <ListRow
            left={<SettingIcon name="flask-outline" accent />}
            title="Demo Settings"
            subtitle="Edit balances, add tokens, reset data"
            chevron
            onPress={() => router.push('/demo-settings')}
          />
        </Card>

        <View style={styles.about}>
          <Text style={type.small}>
            Titanium {Constants.expoConfig?.version ?? '1.0.0'} · Wallet interface simulator
          </Text>
        </View>

        {/* Permanent, non-removable demo disclosure. */}
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
