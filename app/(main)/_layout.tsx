/**
 * Main app chrome.
 *
 * Navigation lives at the top as a segmented pill bar (Home / Trade / Explore)
 * rather than a bottom tab bar, with a persistent search field and a primary
 * action button pinned to the bottom.
 *
 * The router's own tab bar is suppressed and the pills are rendered around the
 * navigator, which keeps route state and back behaviour intact while giving
 * full control over where the controls sit.
 */
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/Logo';
import { PressScale } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';

const SEGMENTS = [
  { label: 'Home', path: '/(main)' as const, match: /^\/(\(main\))?$/ },
  { label: 'Trade', path: '/(main)/trade' as const, match: /\/trade$/ },
  { label: 'Explore', path: '/(main)/explore' as const, match: /\/explore$/ },
];

export default function MainLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      {/* Top bar: account avatar plus the segmented pills. */}
      <View style={styles.topBar}>
        <PressScale onPress={() => router.push('/settings')} style={styles.avatar}>
          <LogoMark size={30} cutout={colors.surfaceHigh} />
        </PressScale>

        <View style={styles.segments}>
          {SEGMENTS.map((segment) => {
            const active = segment.match.test(pathname);
            return (
              <PressScale
                key={segment.label}
                scaleTo={0.94}
                onPress={() => router.navigate(segment.path)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>
                  {segment.label}
                </Text>
              </PressScale>
            );
          })}
        </View>
      </View>

      <Tabs
        // The pills above are the navigation; the built-in bar is redundant.
        tabBar={() => null}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
          animation: 'shift',
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="trade" options={{ title: 'Trade' }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      </Tabs>

      {/* Bottom bar: search field plus the primary action button. */}
      <View style={styles.bottomBar}>
        <PressScale
          scaleTo={0.99}
          haptics={false}
          onPress={() => router.push('/search')}
          accessibilityRole="search"
          accessibilityLabel="Search assets and apps"
          style={styles.searchField}
        >
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <Text style={styles.searchPlaceholder}>Search Photon</Text>
        </PressScale>

        <PressScale
          scaleTo={0.9}
          onPress={() => setActionsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open actions"
          style={styles.fab}
        >
          <Ionicons name="add" size={28} color={colors.bg} />
        </PressScale>
      </View>

      <ActionSheet visible={actionsOpen} onClose={() => setActionsOpen(false)} />
    </SafeAreaView>
  );
}

/** The quick-action menu behind the bottom action button. */
function ActionSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const actions: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    hint: string;
    onPress: () => void;
  }[] = [
    {
      icon: 'arrow-down',
      label: 'Receive',
      hint: 'Show your address',
      onPress: () => go('/receive'),
    },
    { icon: 'arrow-up', label: 'Send', hint: 'Transfer to an address', onPress: () => go('/send') },
    {
      icon: 'swap-horizontal',
      label: 'Swap',
      hint: 'Trade between assets',
      onPress: () => {
        onClose();
        router.navigate('/(main)/trade');
      },
    },
    { icon: 'card-outline', label: 'Buy', hint: 'Add funds with card', onPress: () => go('/buy') },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <PressScale
        haptics={false}
        scaleTo={1}
        onPress={onClose}
        style={styles.scrim}
        accessibilityLabel="Close menu"
      >
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          {actions.map((action) => (
            <PressScale
              key={action.label}
              scaleTo={0.99}
              onPress={action.onPress}
              style={styles.actionRow}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon} size={22} color={colors.accent} />
              </View>
              <View style={styles.actionText}>
                <Text style={type.body}>{action.label}</Text>
                <Text style={[type.small, styles.actionHint]}>{action.hint}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </PressScale>
          ))}
        </View>
      </PressScale>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  pillLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillLabelActive: {
    color: colors.bg,
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  searchPlaceholder: {
    color: colors.textTertiary,
    fontSize: 16,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfacePressed,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionHint: {
    marginTop: 2,
    color: colors.textTertiary,
  },
});
