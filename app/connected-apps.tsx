/**
 * Connected Apps.
 *
 * Photon never connects to anything, so this list is genuinely empty rather
 * than seeded with plausible-looking sessions. The disconnect path is wired up
 * so the screen behaves correctly if an entry ever exists.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, ListRow, Screen, SectionHeader, Separator } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { useSettings } from '@/store/settings';
import { colors, spacing, type } from '@/theme';

export default function ConnectedApps() {
  const apps = useSettings((s) => s.connectedApps);
  const disconnectApp = useSettings((s) => s.disconnectApp);

  const confirmDisconnect = (id: string, name: string) =>
    Alert.alert('Disconnect?', `${name} will lose access to this wallet.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => disconnectApp(id) },
    ]);

  if (apps.length === 0) {
    return (
      <Screen edges={['bottom']}>
        <View style={styles.empty}>
          <Ionicons name="link-outline" size={40} color={colors.textTertiary} />
          <Text style={[type.body, styles.emptyTitle]}>No connected apps</Text>
          <Text style={[type.caption, styles.emptyBlurb]}>
            Photon does not connect to external apps. Anything you approve elsewhere will not
            appear here.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title={`${apps.length} connected`} />
        <Card style={styles.card}>
          {apps.map((app, index) => (
            <View key={app.id}>
              {index > 0 ? <Separator inset={68} /> : null}
              <ListRow
                title={app.name}
                subtitle={`${app.url}  ·  ${timeAgo(app.connectedAt)}`}
                rightTitle="Disconnect"
                onPress={() => confirmDisconnect(app.id, app.name)}
              />
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  card: { marginHorizontal: spacing.lg },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: { marginTop: spacing.sm },
  emptyBlurb: { textAlign: 'center', lineHeight: 19 },
});
