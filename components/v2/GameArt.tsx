import React from "react";
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Rect,
  Stop,
  Text as SvgText,
  Circle,
} from "react-native-svg";

import { GT, type GameArtKind } from "../../constants/gameTemplates";

type Props = {
  kind: GameArtKind;
  accent: string;
  width: number;
  height: number;
};

// Mirror of `ART` in design/components/game-templates.jsx — rendered with
// react-native-svg so the same hero illustration ships on iOS.
export function GameArt({ kind, accent, width, height }: Props) {
  if (kind === "blackjack") {
    return (
      <Svg viewBox="0 0 200 160" width={width} height={height}>
        <Defs>
          <LinearGradient id="bjFelt" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={accent} stopOpacity={0.18} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Ellipse cx={100} cy={120} rx={92} ry={22} fill="url(#bjFelt)" />
        {/* back card — Ace of Spades */}
        <G transform="translate(48 40) rotate(-14)">
          <Rect width={60} height={86} rx={9} fill="#fff" stroke="rgba(0,0,0,0.08)" />
          <Rect x={6} y={6} width={48} height={74} rx={6} fill={accent} opacity={0.12} />
          <SvgText
            x={30}
            y={48}
            textAnchor="middle"
            fontSize={28}
            fontWeight="800"
            fill={accent}
          >
            A
          </SvgText>
          <SvgText x={30} y={64} textAnchor="middle" fontSize={14} fill={accent}>
            ♠
          </SvgText>
        </G>
        {/* front card — King of Hearts */}
        <G transform="translate(96 32) rotate(8)">
          <Rect width={60} height={86} rx={9} fill="#fff" stroke="rgba(0,0,0,0.10)" />
          <SvgText
            x={30}
            y={50}
            textAnchor="middle"
            fontSize={32}
            fontWeight="800"
            fill="#E11"
          >
            K
          </SvgText>
          <SvgText x={30} y={68} textAnchor="middle" fontSize={16} fill="#E11">
            ♥
          </SvgText>
        </G>
      </Svg>
    );
  }

  if (kind === "slots") {
    return (
      <Svg viewBox="0 0 200 160" width={width} height={height}>
        <Rect x={20} y={40} width={160} height={80} rx={14} fill="#fff" stroke="rgba(0,0,0,0.08)" />
        {[0, 1, 2].map((i) => (
          <G key={i} transform={`translate(${36 + i * 44} 56)`}>
            <Rect width={40} height={48} rx={8} fill={accent} opacity={i === 1 ? 0.18 : 0.08} />
            <SvgText
              x={20}
              y={34}
              textAnchor="middle"
              fontSize={22}
              fontWeight="800"
              fill={accent}
            >
              7
            </SvgText>
          </G>
        ))}
      </Svg>
    );
  }

  if (kind === "puzzle") {
    const tiles: [number, number, string][] = [
      [40, 40, accent],
      [80, 40, GT.amber],
      [120, 40, accent],
      [40, 80, GT.amber],
      [120, 80, accent],
      [80, 80, accent],
      [40, 120, accent],
      [80, 120, GT.amber],
      [120, 120, accent],
    ];
    return (
      <Svg viewBox="0 0 200 160" width={width} height={height}>
        {tiles.map(([x, y, c], i) => (
          <Rect
            key={i}
            x={x}
            y={y}
            width={36}
            height={36}
            rx={6}
            fill={c}
            opacity={c === accent ? 0.7 : 0.5}
          />
        ))}
      </Svg>
    );
  }

  return (
    <Svg viewBox="0 0 200 160" width={width} height={height}>
      <Circle cx={100} cy={80} r={50} fill={accent} opacity={0.18} />
      <Circle cx={100} cy={80} r={32} fill={accent} opacity={0.4} />
      <Circle cx={100} cy={80} r={14} fill={accent} />
    </Svg>
  );
}
