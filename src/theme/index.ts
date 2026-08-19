/**
 * Titanium design language.
 *
 * Pure-black canvas, lifted card surfaces, hairline separators and a
 * violet accent family. All original values - no third-party brand assets.
 */
import { Platform, TextStyle } from 'react-native';

export const colors = {
  /** App canvas. */
  bg: '#000000',
  /** Raised surfaces: cards, list groups, sheets. */
  surface: '#1C1C24',
  /** A step above `surface`, for controls sitting on a card. */
  surfaceHigh: '#26262F',
  /** Pressed / selected state for rows. */
  surfacePressed: '#2E2E38',
  /** Hairline separators between list rows. */
  separator: '#26262E',

  /** Primary accent - buttons, active tab, highlights. */
  accent: '#AB9FF2',
  /** Deeper accent for gradients and pressed primary buttons. */
  accentDeep: '#7C63D8',
  /** Translucent accent wash for icon chips. */
  accentSoft: 'rgba(171, 159, 242, 0.14)',

  text: '#FFFFFF',
  textSecondary: '#9A9AA3',
  textTertiary: '#6B6B75',

  positive: '#21C577',
  negative: '#FC6B6B',
  warning: '#F5A623',

  /** Scrim behind modal sheets. */
  scrim: 'rgba(0, 0, 0, 0.6)',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

/**
 * iOS ships SF Pro as the system face; on Android we fall back to Roboto.
 * Using the platform default keeps the type feeling native rather than
 * shipping a lookalike font file.
 */
const systemFont = Platform.select({ ios: 'System', default: 'sans-serif' });
const monoFont = Platform.select({ ios: 'Menlo', default: 'monospace' });

export const type = {
  /** Portfolio total on Home. */
  hero: {
    fontFamily: systemFont,
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '700',
    letterSpacing: -1.2,
    color: colors.text,
  } as TextStyle,
  /** Balance figures on token detail and review sheets. */
  display: {
    fontFamily: systemFont,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.text,
  } as TextStyle,
  title: {
    fontFamily: systemFont,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  } as TextStyle,
  /** Screen headers in the nav bar. */
  header: {
    fontFamily: systemFont,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  /** Primary list row text. */
  body: {
    fontFamily: systemFont,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  bodyRegular: {
    fontFamily: systemFont,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    color: colors.text,
  } as TextStyle,
  /** Muted secondary line under a row title. */
  caption: {
    fontFamily: systemFont,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.textSecondary,
  } as TextStyle,
  small: {
    fontFamily: systemFont,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  } as TextStyle,
  /** Labels under the circular action buttons. */
  actionLabel: {
    fontFamily: systemFont,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  button: {
    fontFamily: systemFont,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  /** Addresses and transaction signatures. */
  mono: {
    fontFamily: monoFont,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.textSecondary,
  } as TextStyle,
} as const;

/** Bottom tab bar height, excluding the safe-area inset. */
export const TAB_BAR_HEIGHT = 56;
