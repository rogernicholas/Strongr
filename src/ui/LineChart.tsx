import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

interface Props {
  /** x is usually epoch ms; points must be sorted by x. */
  points: readonly { x: number; y: number }[];
  formatX(x: number): string;
  formatY(y: number): string;
  height?: number;
  accessibilityLabel?: string;
}

const PAD = 8;

/** Simple line chart: one series, min/max on the left, first/last date underneath. */
export function LineChart({ points, formatX, formatY, height = 200, accessibilityLabel }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (minY === maxY) {
    // Flat line: give it some room so it sits in the middle.
    minY -= 1;
    maxY += 1;
  }
  const sx = (x: number) =>
    maxX === minX ? width / 2 : PAD + ((x - minX) / (maxX - minX)) * (width - 2 * PAD);
  const sy = (y: number) => PAD + (1 - (y - minY) / (maxY - minY)) * (height - 2 * PAD);
  const coords = points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ');

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ height, justifyContent: 'space-between', paddingVertical: PAD - 6 }}>
          <AppText variant="label">{formatY(maxY)}</AppText>
          <AppText variant="label">{formatY(minY)}</AppText>
        </View>
        <View style={{ flex: 1, height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 && points.length > 0 ? (
            <Svg width={width} height={height}>
              {[0, 0.5, 1].map((f) => (
                <Line
                  key={f}
                  x1={0}
                  x2={width}
                  y1={PAD + f * (height - 2 * PAD)}
                  y2={PAD + f * (height - 2 * PAD)}
                  stroke={theme.colors.border}
                  strokeWidth={1}
                />
              ))}
              {points.length > 1 ? (
                <Polyline
                  points={coords}
                  fill="none"
                  stroke={theme.colors.accent}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}
              {points.map((p) => (
                <Circle
                  key={p.x}
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={4}
                  fill={theme.colors.background}
                  stroke={theme.colors.accent}
                  strokeWidth={2}
                />
              ))}
            </Svg>
          ) : null}
        </View>
      </View>
      {points.length > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="label">{formatX(minX)}</AppText>
          {maxX !== minX ? <AppText variant="label">{formatX(maxX)}</AppText> : null}
        </View>
      ) : null}
    </View>
  );
}
