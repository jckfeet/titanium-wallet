/**
 * Locks the app over the top of whatever is on screen.
 *
 * Renders as an overlay rather than a route so locking never disturbs the
 * navigation stack - unlocking puts the user back exactly where they were.
 */
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';

import { LogoMark } from '@/components/Logo';
import { Button } from '@/components/ui';
import { useLock } from '@/store/lock';
import { useSettings } from '@/store/settings';
import { colors, spacing, type } from '@/theme';

export function LockGate() {
  const locked = useLock((s) => s.locked);
  const unlock = useLock((s) => s.unlock);
  const lock = useLock((s) => s.lock);
  const lastActiveAt = useLock((s) => s.lastActiveAt);

  const biometricsEnabled = useSettings((s) => s.biometricsEnabled);
  const autoLockMinutes = useSettings((s) => s.autoLockMinutes);

  const [error, setError] = useState<string | null>(null);

  const attemptUnlock = useCallback(async () => {
    setError(null);

    if (!biometricsEnabled) {
      unlock();
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    // If the device cannot authenticate, refusing to unlock would strand the
    // user in their own wallet - fall through instead.
    if (!hasHardware || !enrolled) {
      unlock();
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Photon',
      fallbackLabel: 'Use passcode',
    });

    if (result.success) unlock();
    else setError('Authentication failed.');
  }, [biometricsEnabled, unlock]);

  // Auto-lock on returning to the foreground after the configured interval.
  useEffect(() => {
    if (autoLockMinutes === 0) return;

    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      const idleMs = Date.now() - lastActiveAt;
      if (idleMs >= autoLockMinutes * 60_000) lock();
    });

    return () => sub.remove();
  }, [autoLockMinutes, lastActiveAt, lock]);

  if (!locked) return null;

  return (
    <View style={styles.overlay}>
      <LogoMark size={72} />
      <Text style={[type.title, styles.title]}>Photon is locked</Text>
      <Text style={[type.caption, styles.blurb]}>
        {biometricsEnabled
          ? 'Unlock with Face ID to continue.'
          : 'Tap unlock to continue.'}
      </Text>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.negative} />
          <Text style={[type.small, styles.errorText]}>{error}</Text>
        </View>
      ) : null}

      <Button label="Unlock" onPress={attemptUnlock} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 100,
  },
  title: {
    marginTop: spacing.xl,
  },
  blurb: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  errorText: {
    color: colors.negative,
  },
  button: {
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
  },
});
