/**
 * Security & Privacy - biometric unlock, auto-lock and the recovery phrase.
 *
 * The biometrics switch reflects what the device can actually do: if there is
 * no sensor or nothing enrolled, it says so and stays off rather than storing
 * a preference that would never take effect.
 */
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Card, ListRow, PressScale, Screen, SectionHeader, Separator } from '@/components/ui';
import { AUTO_LOCK_OPTIONS, useSettings, type AutoLockMinutes } from '@/store/settings';
import { colors, spacing, type } from '@/theme';

export default function Security() {
  const router = useRouter();

  const biometricsEnabled = useSettings((s) => s.biometricsEnabled);
  const setBiometricsEnabled = useSettings((s) => s.setBiometricsEnabled);
  const autoLockMinutes = useSettings((s) => s.autoLockMinutes);
  const setAutoLockMinutes = useSettings((s) => s.setAutoLockMinutes);

  const [capability, setCapability] = useState<'checking' | 'ready' | 'unavailable'>('checking');
  const [biometricName, setBiometricName] = useState('Biometrics');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (cancelled) return;

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricName('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricName('Touch ID');
      }

      setCapability(hasHardware && enrolled ? 'ready' : 'unavailable');
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBiometricsToggle = async (next: boolean) => {
    if (!next) {
      setBiometricsEnabled(false);
      return;
    }

    if (capability !== 'ready') {
      Alert.alert(
        `${biometricName} unavailable`,
        'This device has no enrolled biometrics. Set them up in iOS Settings first.',
      );
      return;
    }

    // Verify before enabling, so the switch can never lock someone out.
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Enable ${biometricName} for Photon`,
    });

    if (result.success) setBiometricsEnabled(true);
    else Alert.alert('Not enabled', 'Authentication was cancelled or failed.');
  };

  const autoLockLabel =
    AUTO_LOCK_OPTIONS.find((o) => o.value === autoLockMinutes)?.label ?? 'Never';

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Unlock" />
        <Card style={styles.card}>
          <ListRow
            title={`${biometricName} unlock`}
            subtitle={
              capability === 'checking'
                ? 'Checking this device...'
                : capability === 'ready'
                  ? 'Require authentication to open the wallet'
                  : 'Not available on this device'
            }
            right={
              <Switch
                value={biometricsEnabled}
                onValueChange={handleBiometricsToggle}
                disabled={capability !== 'ready'}
                trackColor={{ false: colors.surfacePressed, true: colors.accentDeep }}
                thumbColor={colors.text}
                accessibilityLabel={`${biometricName} unlock`}
              />
            }
          />
        </Card>

        <SectionHeader title="Auto-lock" />
        <Card style={styles.card}>
          {AUTO_LOCK_OPTIONS.map((option, index) => {
            const active = option.value === autoLockMinutes;
            return (
              <View key={option.value}>
                {index > 0 ? <Separator inset={spacing.lg} /> : null}
                <PressScale
                  onPress={() => setAutoLockMinutes(option.value as AutoLockMinutes)}
                  scaleTo={0.99}
                  haptics={false}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: active }}
                >
                  <View style={styles.optionRow}>
                    <Text style={[type.body, styles.optionLabel]}>{option.label}</Text>
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
          Auto-lock applies when Photon returns to the foreground after being away for longer than
          the selected interval. Current setting: {autoLockLabel.toLowerCase()}.
        </Text>

        <SectionHeader title="Recovery phrase" />
        <Card style={styles.card}>
          <ListRow
            title="View secret recovery phrase"
            subtitle="Twelve cosmetic words - nothing is derived from them"
            chevron
            onPress={() => router.push('/recovery-phrase')}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  card: { marginHorizontal: spacing.lg },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  optionLabel: { flex: 1 },
  hint: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, lineHeight: 17 },
});
