import { describe, expect, it } from "vitest";
import { computeSpotlightBox, computeTooltipPlacement } from "./tourPositioning";

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
