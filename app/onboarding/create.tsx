/**
 * Recovery-phrase screen.
 *
 * Shows twelve words drawn from the BIP-39 list. They are decorative: no key,
 * address or signature in this app is derived from them, and the screen says so
 * rather than implying the phrase protects anything.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, PressScale, Screen } from '@/components/ui';
import { useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function CreateWallet() {
  const router = useRouter();
  const seedPhrase = useWallet((s) => s.seedPhrase);
  const createWallet = useWallet((s) => s.createWallet);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(seedPhrase.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleContinue = () => {
    createWallet();
    router.replace('/(tabs)');
  };

  return (
    <Screen edges={['bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[type.title, styles.heading]}>Your secret recovery phrase</Text>
        <Text style={[type.caption, styles.blurb]}>
          In a real wallet these twelve words restore access to your funds. In Titanium they are
          generated for illustration only - nothing is derived from them and there is nothing to
          lose.
        </Text>

        <Card style={styles.grid}>
          {seedPhrase.map((word, index) => (
            <View key={`${word}-${index}`} style={styles.wordCell}>
              <Text style={[type.small, styles.wordIndex]}>{index + 1}</Text>
              <Text style={type.body}>{word}</Text>
            </View>
          ))}
        </Card>

        <PressScale onPress={handleCopy} style={styles.copyButton}>
          <Ionicons
            name={copied ? 'checkmark-circle' : 'copy-outline'}
            size={18}
            color={colors.accent}
          />
          <Text style={[type.caption, styles.copyLabel]}>
            {copied ? 'Copied' : 'Copy to clipboard'}
          </Text>
        </PressScale>

        <PressScale
          onPress={() => setSaved((v) => !v)}
          scaleTo={0.99}
          style={styles.checkboxRow}
        >
          <View style={[styles.checkbox, saved && styles.checkboxChecked]}>
            {saved ? <Ionicons name="checkmark" size={16} color={colors.bg} /> : null}
          </View>
          <Text style={[type.bodyRegular, styles.checkboxLabel]}>
            I saved my secret recovery phrase
          </Text>
        </PressScale>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Continue" onPress={handleContinue} disabled={!saved} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.xl,
  },
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  heading: {
    marginTop: spacing.sm,
  },
  blurb: {
    lineHeight: 21,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
  },
  wordCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  wordIndex: {
    color: colors.textTertiary,
    width: 18,
    textAlign: 'right',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  copyLabel: {
    color: colors.accent,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 15,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
});
