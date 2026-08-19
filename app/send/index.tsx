/** Send, step 1 - choose which token to send. */
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { TokenIcon } from '@/components/TokenIcon';
import { Card, ListRow, Screen, Separator } from '@/components/ui';
import { formatAmount } from '@/lib/format';
import { useMoney } from '@/store/money';
import { usePortfolio } from '@/store/portfolio';
import { colors, radius, spacing, type } from '@/theme';

export default function SendPicker() {
  const money = useMoney();
  const router = useRouter();
  const { rows } = usePortfolio(true);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = rows.filter(
    (row) =>
      !q || row.token.name.toLowerCase().includes(q) || row.token.symbol.toLowerCase().includes(q),
  );

  return (
    <Screen edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[type.caption, styles.prompt]}>Select a token to send</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search tokens"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Card style={styles.card}>
          {filtered.map((row, index) => (
            <View key={row.token.id}>
              {index > 0 ? <Separator inset={68} /> : null}
              <ListRow
                left={<TokenIcon token={row.token} />}
                title={row.token.name}
                subtitle={`${formatAmount(row.balance)} ${row.token.symbol}`}
                rightTitle={money(row.usdValue)}
                chevron
                onPress={() => router.push(`/send/${row.token.id}`)}
              />
            </View>
          ))}
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={type.caption}>No tokens matched.</Text>
            </View>
          ) : null}
        </Card>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  prompt: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
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
  card: {
    marginHorizontal: spacing.lg,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  notice: {
    marginTop: spacing.lg,
  },
});
