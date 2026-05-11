import React, { memo, useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

export type PokerChipPalette = {
  baseColor: string;
  centerColor: string;
  stripeColor: string;
  accentColor: string;
  textColor: string;
};

type PokerChipProps = Partial<PokerChipPalette> & {
  value?: string | number;
  label?: string;
  size?: number;
  showCrown?: boolean;
  style?: StyleProp<ViewStyle>;
};

type Point = {
  x: number;
  y: number;
};

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
): Point {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeRingSegment(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function describeDiamond(cx: number, cy: number, size: number): string {
  return [
    `${cx},${cy - size}`,
    `${cx + size},${cy}`,
    `${cx},${cy + size}`,
    `${cx - size},${cy}`,
  ].join(" ");
}

export const chipPresets = {
  white: {
    baseColor: "#F4F1E8",
    centerColor: "#EFE7D2",
    stripeColor: "#C9A44C",
    accentColor: "#C9A44C",
    textColor: "#222222",
  },
  red: {
    baseColor: "#B91C1C",
    centerColor: "#EFE7D2",
    stripeColor: "#F8F5ED",
    accentColor: "#D6AF47",
    textColor: "#7F1D1D",
  },
  blue: {
    baseColor: "#1455A3",
    centerColor: "#EFE7D2",
    stripeColor: "#F8F5ED",
    accentColor: "#D6AF47",
    textColor: "#123E75",
  },
  green: {
    baseColor: "#15803D",
    centerColor: "#EFE7D2",
    stripeColor: "#F8F5ED",
    accentColor: "#D6AF47",
    textColor: "#14532D",
  },
  black: {
    baseColor: "#15171C",
    centerColor: "#1B1D23",
    stripeColor: "#F8F5ED",
    accentColor: "#D6AF47",
    textColor: "#D6AF47",
  },
} satisfies Record<string, PokerChipPalette>;

function PokerChip({
  value = 100,
  label = "$",
  size = 160,
  baseColor = "#15171C",
  centerColor = "#1B1D23",
  stripeColor = "#F8F5ED",
  accentColor = "#D6AF47",
  textColor = "#D6AF47",
  showCrown = true,
  style,
}: PokerChipProps) {
  const id = useMemo(
    () => `chip_${Math.random().toString(36).slice(2)}`,
    [],
  );

  const cx = size / 2;
  const cy = size / 2;

  const outerRadius = size * 0.47;
  const outerStripeInnerRadius = size * 0.36;
  const innerRingRadius = size * 0.315;
  const centerRadius = size * 0.245;

  const valueText = String(value);

  const valueFontSize =
    valueText.length >= 4
      ? size * 0.155
      : valueText.length >= 3
        ? size * 0.18
        : size * 0.215;

  const stripeSegments = useMemo(() => {
    return Array.from({ length: 8 }, (_, index) => {
      const centerAngle = index * 45;
      return {
        start: centerAngle - 8,
        end: centerAngle + 8,
      };
    });
  }, []);

  const tinyGoldBars = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => index * 30 + 15);
  }, []);

  const textureLines = useMemo(() => {
    return Array.from({ length: 13 }, (_, index) => {
      const y = cy - centerRadius + index * ((centerRadius * 2) / 12);
      return y;
    });
  }, [cy, centerRadius]);

  return (
    <View style={[styles.shadowWrap, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={`${id}_body`} cx="38%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <Stop offset="38%" stopColor={baseColor} stopOpacity="1" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
          </RadialGradient>

          <RadialGradient id={`${id}_center`} cx="35%" cy="28%" r="75%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <Stop offset="45%" stopColor={centerColor} stopOpacity="1" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </RadialGradient>

          <LinearGradient id={`${id}_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFF0A8" />
            <Stop offset="35%" stopColor={accentColor} />
            <Stop offset="70%" stopColor="#8A6318" />
            <Stop offset="100%" stopColor="#FFE18A" />
          </LinearGradient>

          <ClipPath id={`${id}_centerClip`}>
            <Circle cx={cx} cy={cy} r={centerRadius} />
          </ClipPath>
        </Defs>

        <Circle cx={cx} cy={cy + size * 0.025} r={outerRadius} fill="#000" opacity={0.22} />

        <Circle
          cx={cx}
          cy={cy}
          r={outerRadius}
          fill={`url(#${id}_body)`}
          stroke="#000"
          strokeOpacity={0.5}
          strokeWidth={size * 0.012}
        />

        <Circle
          cx={cx}
          cy={cy}
          r={outerRadius - size * 0.018}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.12}
          strokeWidth={size * 0.009}
        />

        <Circle
          cx={cx}
          cy={cy}
          r={outerRadius - size * 0.035}
          fill="none"
          stroke="#000000"
          strokeOpacity={0.35}
          strokeWidth={size * 0.01}
        />

        {stripeSegments.map((segment, index) => (
          <Path
            key={`stripe-${index}`}
            d={describeRingSegment(
              cx,
              cy,
              outerRadius - size * 0.012,
              outerStripeInnerRadius,
              segment.start,
              segment.end,
            )}
            fill={stripeColor}
            stroke={`url(#${id}_gold)`}
            strokeWidth={size * 0.004}
            opacity={0.96}
          />
        ))}

        <Circle
          cx={cx}
          cy={cy}
          r={innerRingRadius}
          fill="none"
          stroke={`url(#${id}_gold)`}
          strokeWidth={size * 0.035}
        />

        <Circle
          cx={cx}
          cy={cy}
          r={innerRingRadius - size * 0.033}
          fill="none"
          stroke="#000"
          strokeOpacity={0.45}
          strokeWidth={size * 0.006}
        />

        <Circle
          cx={cx}
          cy={cy}
          r={innerRingRadius + size * 0.026}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.15}
          strokeWidth={size * 0.005}
        />

        {tinyGoldBars.map((angle, index) => {
          const point = polarToCartesian(cx, cy, size * 0.385, angle);

          return (
            <Rect
              key={`bar-${index}`}
              x={point.x - size * 0.022}
              y={point.y - size * 0.006}
              width={size * 0.044}
              height={size * 0.012}
              rx={size * 0.004}
              fill={`url(#${id}_gold)`}
              opacity={0.9}
              transform={`rotate(${angle} ${point.x} ${point.y})`}
            />
          );
        })}

        <Circle
          cx={cx}
          cy={cy}
          r={centerRadius}
          fill={`url(#${id}_center)`}
          stroke={`url(#${id}_gold)`}
          strokeWidth={size * 0.018}
        />

        <G clipPath={`url(#${id}_centerClip)`} opacity={0.16}>
          {textureLines.map((y, index) => (
            <G key={`texture-${index}`}>
              <Line
                x1={cx - centerRadius}
                y1={y}
                x2={cx + centerRadius}
                y2={y + size * 0.035}
                stroke="#FFFFFF"
                strokeWidth={size * 0.004}
              />
              <Line
                x1={cx - centerRadius}
                y1={y + size * 0.02}
                x2={cx + centerRadius}
                y2={y - size * 0.015}
                stroke="#000000"
                strokeWidth={size * 0.003}
              />
            </G>
          ))}
        </G>

        {[0, 90, 180, 270].map((angle, index) => {
          const point = polarToCartesian(cx, cy, size * 0.195, angle);

          return (
            <Polygon
              key={`diamond-${index}`}
              points={describeDiamond(point.x, point.y, size * 0.009)}
              fill={accentColor}
              opacity={0.9}
            />
          );
        })}

        {showCrown && (
          <G transform={`translate(${cx - size * 0.06} ${cy - size * 0.245}) scale(${size / 240})`}>
            <Path
              d="M0 30 L7 10 L18 25 L30 4 L42 25 L53 10 L60 30 L56 38 L4 38 Z"
              fill={`url(#${id}_gold)`}
              stroke="#000"
              strokeOpacity={0.2}
              strokeWidth="1"
            />
            <Rect x="5" y="38" width="50" height="6" rx="2" fill={`url(#${id}_gold)`} />
          </G>
        )}

        <SvgText
          x={cx}
          y={cy + size * 0.035}
          fill={textColor}
          fontSize={valueFontSize}
          fontWeight="900"
          textAnchor="middle"
          alignmentBaseline="middle"
          stroke="#000"
          strokeOpacity={0.18}
          strokeWidth={size * 0.004}
        >
          {valueText}
        </SvgText>

        <SvgText
          x={cx}
          y={cy + size * 0.195}
          fill={textColor}
          fontSize={size * 0.12}
          fontWeight="700"
          textAnchor="middle"
          alignmentBaseline="middle"
          opacity={0.9}
        >
          {label}
        </SvgText>

        <Path
          d={`
            M ${cx - size * 0.28} ${cy - size * 0.34}
            C ${cx - size * 0.08} ${cy - size * 0.45},
              ${cx + size * 0.24} ${cy - size * 0.42},
              ${cx + size * 0.32} ${cy - size * 0.19}
          `}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.12}
          strokeWidth={size * 0.018}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 10,
  },
});

export default memo(PokerChip);
