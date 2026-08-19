/**
 * Interactive price chart.
 *
 * Drawn directly with react-native-svg: a smoothed line, a gradient area fill
 * and a draggable scrubber. Doing it by hand keeps the chart on the same
 * renderer as the rest of the app's vector work and avoids pulling a second
 * native charting engine into the iOS build.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Line } from 'react-native-svg';

import { PriceSeries } from '@/lib/chart';
import { colors } from '@/theme';

interface PriceChartProps {
  series: PriceSeries;
  /** Line colour - green or red depending on the window's direction. */
  color: string;
  height?: number;
  /** Fires with the hovered sample index, or null when the touch ends. */
  onScrub?: (index: number | null) => void;
}

/**
 * Cardinal spline through the samples.
 *
 * A polyline over 90+ noisy points reads as jagged; a light tension smooths it
 * without inventing peaks the data does not have.
 */
function buildPath(xs: number[], ys: number[], tension = 0.5): string {
  if (xs.length < 2) return '';
  let d = `M${xs[0].toFixed(2)},${ys[0].toFixed(2)}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = i > 0 ? xs[i - 1] : xs[i];
    const y0 = i > 0 ? ys[i - 1] : ys[i];
    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[i + 1];
    const y2 = ys[i + 1];
    const x3 = i + 2 < xs.length ? xs[i + 2] : x2;
    const y3 = i + 2 < ys.length ? ys[i + 2] : y2;

    const c1x = x1 + ((x2 - x0) / 6) * tension;
    const c1y = y1 + ((y2 - y0) / 6) * tension;
    const c2x = x2 - ((x3 - x1) / 6) * tension;
    const c2y = y2 - ((y3 - y1) / 6) * tension;

    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`;
  }
  return d;
}

export function PriceChart({ series, color, height = 200, onScrub }: PriceChartProps) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // PanResponder callbacks close over state, so the latest width is kept in a
  // ref to avoid rebuilding the responder on every layout pass.
  const widthRef = useRef(0);
  const pointCount = series.points.length;

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
  }, []);

  const { linePath, areaPath, xs, ys } = useMemo(() => {
    if (width <= 0 || pointCount < 2) {
      return { linePath: '', areaPath: '', xs: [] as number[], ys: [] as number[] };
    }
    // Inset vertically so the stroke and the scrubber dot are never clipped.
    const padY = 12;
    const usableH = height - padY * 2;
    const span = series.max - series.min || 1;

    const nextXs = series.points.map((_, i) => (i / (pointCount - 1)) * width);
    const nextYs = series.points.map(
      (value) => padY + (1 - (value - series.min) / span) * usableH,
    );

    const line = buildPath(nextXs, nextYs);
    const area = line
      ? `${line}L${width.toFixed(2)},${height}L0,${height}Z`
      : '';

    return { linePath: line, areaPath: area, xs: nextXs, ys: nextYs };
  }, [series, width, height, pointCount]);

  const updateFromTouch = useCallback(
    (e: GestureResponderEvent) => {
      const w = widthRef.current;
      if (w <= 0 || pointCount < 2) return;
      const x = Math.max(0, Math.min(w, e.nativeEvent.locationX));
      const index = Math.round((x / w) * (pointCount - 1));
      setActiveIndex(index);
      onScrub?.(index);
    },
    [onScrub, pointCount],
  );

  const endScrub = useCallback(() => {
    setActiveIndex(null);
    onScrub?.(null);
  }, [onScrub]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Claim the gesture so the parent ScrollView does not steal horizontal
        // drags mid-scrub.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: updateFromTouch,
        onPanResponderMove: updateFromTouch,
        onPanResponderRelease: endScrub,
        onPanResponderTerminate: endScrub,
      }),
    [updateFromTouch, endScrub],
  );

  const gradientId = 'titaniumChartFill';

  return (
    <View style={[styles.container, { height }]} onLayout={handleLayout} {...panResponder.panHandlers}>
      {width > 0 && linePath ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.26} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          <Path d={areaPath} fill={`url(#${gradientId})`} />
          <Path
            d={linePath}
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {activeIndex !== null && xs[activeIndex] !== undefined ? (
            <>
              <Line
                x1={xs[activeIndex]}
                y1={0}
                x2={xs[activeIndex]}
                y2={height}
                stroke={colors.textTertiary}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <Circle
                cx={xs[activeIndex]}
                cy={ys[activeIndex]}
                r={6}
                fill={color}
                stroke={colors.bg}
                strokeWidth={2.5}
              />
            </>
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
  },
});
