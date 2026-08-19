/**
 * The recovery phrase, revealed on demand.
 *
 * Hidden behind a tap so the words are not on screen the moment the route
 * opens - the same guard a real wallet uses, and the same one that makes a
 * screenshot less likely to catch them.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, DemoNotice, PressScale, Screen } from '@/components/ui';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function RecoveryPhrase() {
  const seedPhrase = useWallet((s) => s.seedPhrase);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(seedPhrase.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[type.caption, styles.blurb]}>
          In a real wallet these twelve words restore access to your funds. In Photon they are
          generated for illustration only - nothing is derived from them and there is nothing to
          lose.
        </Text>

        <Card style={styles.grid}>
          {seedPhrase.map((word, index) => (
            <View key={`${word}-${index}`} style={styles.wordCell}>
              <Text style={[type.small, styles.wordIndex]}>{index + 1}</Text>
              <Text style={[type.body, !revealed && styles.wordHidden]}>
                {revealed ? word : '•••••'}
              </Text>
            </View>
          ))}
        </Card>

        {!revealed ? (
          <PressScale
            onPress={() => setRevealed(true)}
            accessibilityRole="button"
            accessibilityLabel="Reveal recovery phrase"
            style={styles.reveal}
          >
            <Ionicons name="eye-outline" size={18} color={colors.accent} />
            <Text style={[type.body, styles.revealText]}>Tap to reveal</Text>
          </PressScale>
        ) : (
          <Button
            label={copied ? 'Copied' : 'Copy phrase'}
            variant="secondary"
            onPress={handleCopy}
            style={styles.copy}
          />
        )}

        <DemoNotice style={styles.notice} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  blurb: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    lineHeight: 19,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  wordCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  wordIndex: { width: 18, color: colors.textTertiary },
  wordHidden: { letterSpacing: 2, color: colors.textTertiary },
  reveal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  revealText: { color: colors.accent },
  copy: { marginHorizontal: spacing.lg, marginTop: spacing.xl },
  notice: { marginTop: spacing.xl },
});
