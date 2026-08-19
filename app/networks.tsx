/**
 * Active Networks - switch networks on and off.
 *
 * A disabled network disappears from Receive and from the address book's
 * network picker, so the toggle has a visible consequence rather than just
 * storing a flag.
 */
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Card, ListRow, Screen, SectionHeader, Separator } from '@/components/ui';
import { useSettings } from '@/store/settings';
import { NETWORKS } from '@/store/wallet';
import { colors, radius, spacing, type } from '@/theme';

export default function Networks() {
  const disabled = useSettings((s) => s.disabledNetworks);
  const toggleNetwork = useSettings((s) => s.toggleNetwork);

  const activeCount = NETWORKS.length - disabled.length;

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title={`${activeCount} of ${NETWORKS.length} active`} />
        <Card style={styles.card}>
          {NETWORKS.map((network, index) => {
            const on = !disabled.includes(network.id);
            return (
              <View key={network.id}>
                {index > 0 ? <Separator inset={68} /> : null}
                <ListRow
                  left={
                    <View style={[styles.dot, { backgroundColor: network.color }]}>
                      <Text style={styles.dotText}>{network.symbol.slice(0, 1)}</Text>
                    </View>
                  }
                  title={network.name}
                  subtitle={network.symbol}
                  right={
                    <Switch
                      value={on}
                      onValueChange={() => toggleNetwork(network.id)}
                      trackColor={{ false: colors.surfacePressed, true: colors.accentDeep }}
                      thumbColor={colors.text}
                      accessibilityLabel={`${network.name} network`}
                    />
                  }
                />
              </View>
            );
          })}
        </Card>

        <Text style={[type.small, styles.hint]}>
          Switching a network off hides its address on the Receive screen and removes it from the
          address book picker.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  card: { marginHorizontal: spacing.lg },
  dot: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
  hint: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    lineHeight: 17,
  },
});
