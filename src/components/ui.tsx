/**
 * Shared UI primitives: screens, cards, rows, buttons and badges.
 *
 * Buttons animate their press with Reanimated so taps feel native rather than
 * flashing an opacity change.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, type } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function haptic() {
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

// ------------------------------------------------------------------- surfaces

interface ScreenProps {
  children: ReactNode;
  /** Which safe-area edges to pad. Tab screens skip the bottom. */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edges = ['top'], style }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Separator({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.separator, { marginLeft: inset }]} />;
}

// -------------------------------------------------------------------- buttons

interface PressScaleProps extends PressableProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale applied while held. */
  scaleTo?: number;
  haptics?: boolean;
}

/** Pressable that springs down on touch. The base for every tappable control. */
export function PressScale({
  children,
  style,
  scaleTo = 0.96,
  haptics = true,
  onPressIn,
  onPress,
  ...rest
}: PressScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      onPress={(e) => {
        if (haptics) haptic();
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <PressScale
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.975}
      style={[
        styles.button,
        isPrimary && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text
        style={[
          type.button,
          isPrimary && styles.buttonPrimaryLabel,
          disabled && styles.buttonDisabledLabel,
        ]}
      >
        {label}
      </Text>
    </PressScale>
  );
}

interface CircleActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  /** Renders the filled accent treatment used for the primary action. */
  emphasis?: boolean;
}

/** Circular icon button with a label underneath - the Home action row. */
export function CircleAction({ icon, label, onPress, emphasis = false }: CircleActionProps) {
  return (
    <View style={styles.circleActionWrap}>
      <PressScale onPress={onPress} scaleTo={0.9} style={styles.circleActionHit}>
        <View style={[styles.circleActionCircle, emphasis && styles.circleActionEmphasis]}>
          <Ionicons name={icon} size={22} color={emphasis ? colors.bg : colors.accent} />
        </View>
      </PressScale>
      <Text style={type.actionLabel}>{label}</Text>
    </View>
  );
}

// ----------------------------------------------------------------------- rows

interface ListRowProps {
  left?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  rightTitle?: string;
  rightSubtitle?: string;
  rightSubtitleStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The standard two-line list row used across the token, settings and dApp lists. */
export function ListRow({
  left,
  title,
  subtitle,
  right,
  rightTitle,
  rightSubtitle,
  rightSubtitleStyle,
  onPress,
  chevron = false,
  style,
}: ListRowProps) {
  const content = (
    <View style={[styles.row, style]}>
      {left ? <View style={styles.rowLeft}>{left}</View> : null}
      <View style={styles.rowBody}>
        <Text style={type.body} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[type.caption, styles.rowSubtitle]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? null}
      {rightTitle || rightSubtitle ? (
        <View style={styles.rowRight}>
          {rightTitle ? (
            <Text style={type.body} numberOfLines={1}>
              {rightTitle}
            </Text>
          ) : null}
          {rightSubtitle ? (
            <Text style={[type.caption, styles.rowSubtitle, rightSubtitleStyle]} numberOfLines={1}>
              {rightSubtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      {chevron ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
          style={styles.rowChevron}
        />
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <PressScale onPress={onPress} scaleTo={0.99} haptics={false}>
      {content}
    </PressScale>
  );
}

/** Small pill used for percentage moves and status chips. */
export function ChangeBadge({
  value,
  style,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
}) {
  const positive = value >= 0;
  return (
    <Text style={[type.caption, { color: positive ? colors.positive : colors.negative }, style]}>
      {positive ? '+' : ''}
      {value.toFixed(2)}%
    </Text>
  );
}

/** Section heading above a group of rows. */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[type.caption, styles.sectionHeaderText]}>{title}</Text>
      {action}
    </View>
  );
}

/**
 * The permanent demo disclosure.
 *
 * Titanium simulates a wallet; this label states that plainly and is
 * deliberately not removable from Settings or the demo panel.
 */
export function DemoNotice({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.demoNotice, style]}>
      <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
      <Text style={[type.small, styles.demoNoticeText]}>
        Demo - not real funds. Balances are simulated and no blockchain is involved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },

  button: {
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonPrimaryLabel: {
    color: colors.bg,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceHigh,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceHigh,
  },
  buttonDisabledLabel: {
    color: colors.textTertiary,
  },

  circleActionWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  circleActionHit: {
    borderRadius: radius.pill,
  },
  circleActionCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActionEmphasis: {
    backgroundColor: colors.accent,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 60,
  },
  rowLeft: {
    marginRight: spacing.md,
  },
  rowBody: {
    flex: 1,
    justifyContent: 'center',
  },
  rowRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  rowSubtitle: {
    marginTop: 2,
  },
  rowChevron: {
    marginLeft: spacing.sm,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionHeaderText: {
    textTransform: 'none',
    color: colors.textSecondary,
  },

  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  demoNoticeText: {
    flex: 1,
    color: colors.textTertiary,
    lineHeight: 17,
  },
});
