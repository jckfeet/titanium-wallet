/** Bottom-sheet token picker, shared by the swap and send flows. */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatAmount } from '@/lib/format';
import { useMoney } from '@/store/money';
import { usePortfolio } from '@/store/portfolio';
import { colors, radius, spacing, type } from '@/theme';
import { TokenIcon } from './TokenIcon';
import { ListRow, PressScale, Separator } from './ui';

interface TokenPickerModalProps {
  visible: boolean;
  title?: string;
  /** Token id to exclude - stops a swap selecting the same token twice. */
  excludeId?: string;
  onSelect: (tokenId: string) => void;
  onClose: () => void;
}

export function TokenPickerModal({
  visible,
  title = 'Select token',
  excludeId,
  onSelect,
  onClose,
}: TokenPickerModalProps) {
  const money = useMoney();
  const { rows } = usePortfolio(true);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((row) => row.token.id !== excludeId)
      .filter(
        (row) =>
          !q ||
          row.token.name.toLowerCase().includes(q) ||
          row.token.symbol.toLowerCase().includes(q),
      );
  }, [rows, query, excludeId]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={type.title}>{title}</Text>
            <PressScale onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </PressScale>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={colors.textTertiary}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((row, index) => (
              <View key={row.token.id}>
                {index > 0 ? <Separator inset={68} /> : null}
                <ListRow
                  left={<TokenIcon token={row.token} />}
                  title={row.token.name}
                  subtitle={`${formatAmount(row.balance)} ${row.token.symbol}`}
                  rightTitle={money(row.usdValue)}
                  onPress={() => {
                    onSelect(row.token.id);
                    setQuery('');
                  }}
                />
              </View>
            ))}
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Text style={type.caption}>No tokens matched.</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfacePressed,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  close: {
    padding: spacing.xs,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    padding: 0,
  },
  list: {
    flexGrow: 0,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
});
