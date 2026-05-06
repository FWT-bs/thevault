/** Fraction of label font size (pt) as inset above and below the label body. */
export const LIQUID_GLASS_VERTICAL_INSET_FRAC = 0.95;

/**
 * Total minimum height for liquid-glass label-sized controls (single-line baseline):
 * (1 + 2 × LIQUID_GLASS_VERTICAL_INSET_FRAC) × fontSize.
 * With 0.88 → 2.76 × nominal label font size (pt). Buttons may grow taller when text wraps.
 */
export function liquidGlassControlHeightPt(labelFontSizePt: number): number {
  return labelFontSizePt * (1 + 2 * LIQUID_GLASS_VERTICAL_INSET_FRAC);
}
