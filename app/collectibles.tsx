/**
 * Collectibles.
 *
 * NFT support is out of scope, so this screen is an empty state rather than a
 * stub with placeholder art.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';

export default function Collectibles() {
  const router = useRouter();

  return (
    <Screen edges={['bottom']}>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="images-outline" size={40} color={colors.textTertiary} />
        </View>
        <Text style={[type.body, styles.title]}>No collectibles yet</Text>
        <Text style={[type.caption, styles.blurb]}>
Collectibles you receive will appear here.
        </Text>
        <Button
          label="Explore dApps"
          variant="secondary"
          style={styles.cta}
          onPress={() => router.navigate('/(main)/explore')}
        />
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
  },
  blurb: {
    textAlign: 'center',
    lineHeight: 21,
  },
  cta: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
});
