export type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const SPOTLIGHT_PADDING = 8;
const MIN_SPACE_BELOW = 200;

export function computeSpotlightBox(rect: Rect): Rect {
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
}

export type TooltipPlacement = "top" | "bottom";

export function computeTooltipPlacement(rect: Rect, viewportHeight: number): TooltipPlacement {
  const spaceBelow = viewportHeight - (rect.top + rect.height);
  return spaceBelow < MIN_SPACE_BELOW ? "top" : "bottom";
}
