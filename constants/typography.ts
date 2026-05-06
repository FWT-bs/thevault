import { type TextStyle } from "react-native";

type FontWeight = NonNullable<TextStyle["fontWeight"]>;

function makeTextStyle(weight: FontWeight): TextStyle {
  return {
    fontWeight: weight,
  };
}

export const typography = {
  regular: makeTextStyle("400"),
  medium: makeTextStyle("500"),
  semibold: makeTextStyle("600"),
  bold: makeTextStyle("700"),
} as const;
