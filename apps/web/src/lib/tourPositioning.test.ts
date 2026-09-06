import { describe, expect, it } from "vitest";
import { clampTooltipTop, computeSpotlightBox, computeTooltipPlacement } from "./tourPositioning";

describe("computeSpotlightBox", () => {
  it("pads the target rect on all sides", () => {
    const box = computeSpotlightBox({ top: 100, left: 50, width: 200, height: 40 });
    expect(box).toEqual({ top: 92, left: 42, width: 216, height: 56 });
  });
});

describe("computeTooltipPlacement", () => {
  it("places the tooltip below when there is enough space", () => {
    const placement = computeTooltipPlacement({ top: 100, left: 0, width: 100, height: 40 }, 800);
    expect(placement).toBe("bottom");
  });

  it("places the tooltip above when there is not enough space below", () => {
    const placement = computeTooltipPlacement({ top: 700, left: 0, width: 100, height: 40 }, 800);
    expect(placement).toBe("top");
  });
});

describe("clampTooltipTop", () => {
  it("returns the desired position when it already fits", () => {
    expect(clampTooltipTop(300, 180, 800)).toBe(300);
  });

  it("clamps to the top margin when the desired position is negative", () => {
    expect(clampTooltipTop(-70, 180, 800)).toBe(16);
  });

  it("clamps to the bottom margin when the desired position overflows the viewport", () => {
    expect(clampTooltipTop(750, 180, 800)).toBe(800 - 180 - 16);
  });

  it("never returns less than the top margin, even for a tooltip taller than the viewport", () => {
    expect(clampTooltipTop(-50, 900, 800)).toBe(16);
  });
});
