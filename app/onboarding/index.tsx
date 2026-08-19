/** Welcome screen - the first thing a fresh install shows. */
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Wordmark } from '@/components/Logo';
import { Button, DemoNotice, Screen } from '@/components/ui';
import { colors, spacing, type } from '@/theme';

export default function Welcome() {
  const router = useRouter();

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.hero}>
        <Wordmark size={54} />
        <Text style={[type.title, styles.tagline]}>
          A crypto wallet interface you can explore safely
        </Text>
        <Text style={[type.caption, styles.blurb]}>
          Photon is a demo. It simulates balances, transfers and swaps so you can walk through a
          wallet without connecting to any network or risking real assets.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Create new wallet" onPress={() => router.push('/onboarding/create')} />
        <Button
          label="I already have a wallet"
          variant="secondary"
          onPress={() => router.push('/onboarding/create')}
        />
        <DemoNotice />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  tagline: {
    marginTop: spacing.xxl,
    fontSize: 30,
    lineHeight: 38,
  },
  blurb: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  notice: {
    paddingHorizontal: 0,
  },
});
