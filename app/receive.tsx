/**
 * Receive - network selector, QR code and the generated address for each chain.
 *
 * Addresses are random strings in the right shape, generated once and persisted
 * so the same install always shows the same "wallet".
 */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button, Card, PressScale, Screen, Separator } from '@/components/ui';
import { TokenIcon } from '@/components/TokenIcon';
import { useSettings } from '@/store/settings';
import { NetworkId, NETWORKS, useWallet } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function Receive() {
  const addresses = useWallet((s) => s.addresses);
  const [network, setNetwork] = useState<NetworkId>('solana');
  const [copied, setCopied] = useState(false);

  const disabledNetworks = useSettings((s) => s.disabledNetworks);
  // Only networks left switched on in Settings > Active Networks are offered.
  const available = NETWORKS.filter((n) => !disabledNetworks.includes(n.id));
  const shown = available.length > 0 ? available : NETWORKS;

  const active = shown.find((n) => n.id === network) ?? shown[0];
  const address = addresses[network];

  const handleCopy = async () => {
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My ${active.name} address: ${address}`,
      });
    } catch {
      // Share sheet dismissed.
    }
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.networkCard}>
          {shown.map((item, index) => {
            const selected = item.id === network;
            return (
              <View key={item.id}>
                {index > 0 ? <Separator inset={68} /> : null}
                <PressScale
                  scaleTo={0.99}
                  haptics={false}
                  onPress={() => setNetwork(item.id)}
                  style={styles.networkRow}
                >
                  <TokenIcon
                    token={{ color: item.color, glyph: item.symbol.slice(0, 1), symbol: item.symbol }}
                  />
                  <View style={styles.networkText}>
                    <Text style={type.body}>{item.name}</Text>
                    <Text style={[type.caption, styles.networkSub]}>{item.symbol}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                </PressScale>
              </View>
            );
          })}
        </Card>

        <View style={styles.qrBlock}>
          <View style={styles.qrFrame}>
            <QRCode
              value={address}
              size={200}
              backgroundColor="#FFFFFF"
              color="#101014"
              quietZone={12}
            />
          </View>

          <Text style={[type.caption, styles.qrCaption]}>
            Your {active.name} address
          </Text>
          <Text style={[type.mono, styles.address]} numberOfLines={3}>
            {address}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            label={copied ? 'Copied' : 'Copy address'}
            variant="secondary"
            style={styles.actionButton}
            onPress={handleCopy}
          />
          <Button label="Share" style={styles.actionButton} onPress={handleShare} />
        </View>

        <View style={styles.warning}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={[type.small, styles.warningText]}>
            This address is generated on this device and cannot receive assets. Do not send
            anything to it.
          </Text>
        </View>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  networkCard: {
    marginHorizontal: spacing.lg,
  },
  networkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  networkText: {
    flex: 1,
  },
  networkSub: {
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  qrBlock: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  qrFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  qrCaption: {
    marginTop: spacing.lg,
  },
  address: {
    textAlign: 'center',
    color: colors.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  warningText: {
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});
