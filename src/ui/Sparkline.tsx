import Svg, { Polyline } from 'react-native-svg';

import { useTheme } from '@/core/theme';

interface Props {
  values: readonly number[];
  width?: number;
  height?: number;
}

/** A small trend line with no axes, for list cards. Nothing with fewer than two values. */
export function Sparkline({ values, width = 72, height = 28 }: Props) {
  const theme = useTheme();
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const pad = 2;
  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - 2 * pad);
      const y = height - pad - ((v - min) / span) * (height - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <Svg width={width} height={height} accessibilityElementsHidden>
      <Polyline
        points={points}
        fill="none"
        stroke={theme.colors.accent}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
