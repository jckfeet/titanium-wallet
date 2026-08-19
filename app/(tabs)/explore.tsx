/**
 * Explore - a searchable directory of well-known Solana apps.
 *
 * Rows are intentionally inert. Tapping one opens a sheet explaining that
 * Titanium does not connect to anything, rather than pretending to launch a
 * dApp session.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { TokenIcon } from '@/components/TokenIcon';
import { Button, Card, ListRow, Screen, SectionHeader, Separator } from '@/components/ui';
import { ALL_DAPPS, Dapp, DAPP_SECTIONS } from '@/data/dapps';
import { colors, radius, spacing, type } from '@/theme';

export default function Explore() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Dapp | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_DAPPS.filter(
      (dapp) =>
        dapp.name.toLowerCase().includes(q) ||
        dapp.category.toLowerCase().includes(q) ||
        dapp.blurb.toLowerCase().includes(q),
    );
  }, [query]);

  const renderDapp = (dapp: Dapp, index: number, total: number) => (
    <View key={dapp.id}>
      {index > 0 ? <Separator inset={68} /> : null}
      <ListRow
        left={<TokenIcon token={{ color: dapp.color, glyph: dapp.glyph, symbol: dapp.name }} />}
        title={dapp.name}
        subtitle={dapp.category}
        chevron
        onPress={() => setSelected(dapp)}
      />
      {index === total - 1 ? null : null}
    </View>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={type.title}>Explore</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search apps"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.textTertiary}
            onPress={() => setQuery('')}
          />
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {results ? (
          <>
            <SectionHeader title={`${results.length} result${results.length === 1 ? '' : 's'}`} />
            <Card style={styles.card}>
              {results.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={type.caption}>Nothing matched “{query.trim()}”.</Text>
                </View>
              ) : (
                results.map((dapp, i) => renderDapp(dapp, i, results.length))
              )}
            </Card>
          </>
        ) : (
          DAPP_SECTIONS.map((section) => (
            <View key={section.title}>
              <SectionHeader title={section.title} />
              <Card style={styles.card}>
                {section.items.map((dapp, i) => renderDapp(dapp, i, section.items.length))}
              </Card>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            {selected ? (
              <>
                <TokenIcon
                  token={{ color: selected.color, glyph: selected.glyph, symbol: selected.name }}
                  size={56}
                />
                <Text style={[type.title, styles.sheetTitle]}>{selected.name}</Text>
                <Text style={[type.caption, styles.sheetCategory]}>{selected.category}</Text>
                <Text style={[type.bodyRegular, styles.sheetBlurb]}>{selected.blurb}</Text>
                <View style={styles.sheetNotice}>
                  <Ionicons name="lock-closed-outline" size={16} color={colors.warning} />
                  <Text style={[type.small, styles.sheetNoticeText]}>
                    Demo only. Titanium has no network connection and cannot open or sign anything.
                  </Text>
                </View>
                <Button label="Close" variant="secondary" onPress={() => setSelected(null)} />
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    padding: 0,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  card: {
    marginHorizontal: spacing.lg,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
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
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  sheetTitle: {
    marginTop: spacing.md,
  },
  sheetCategory: {
    marginBottom: spacing.sm,
  },
  sheetBlurb: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  sheetNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.lg,
  },
  sheetNoticeText: {
    flex: 1,
    color: colors.warning,
    lineHeight: 17,
  },
});
