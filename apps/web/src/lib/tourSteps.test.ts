import { describe, expect, it } from "vitest";
import { tourSteps, TOUR_ROUTES } from "./tourSteps";

describe("tourSteps", () => {
  it("has 22 steps", () => {
    expect(tourSteps).toHaveLength(22);
  });

  it("has unique step ids", () => {
    const ids = tourSteps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique target ids", () => {
    const targetIds = tourSteps.map((s) => s.targetId);
    expect(new Set(targetIds).size).toBe(targetIds.length);
  });

  it("only references known routes", () => {
    for (const step of tourSteps) {
      expect(TOUR_ROUTES).toContain(step.path);
    }
  });

  it("has titleKey/bodyKey namespaced under steps.<id> and unique", () => {
    const titleKeys = tourSteps.map((s) => s.titleKey);
    const bodyKeys = tourSteps.map((s) => s.bodyKey);
    expect(new Set(titleKeys).size).toBe(titleKeys.length);
    expect(new Set(bodyKeys).size).toBe(bodyKeys.length);
    for (const step of tourSteps) {
      expect(step.titleKey).toMatch(/^steps\./);
      expect(step.bodyKey).toMatch(/^steps\./);
    }
  });

  it("keeps steps for the same page adjacent (no back-and-forth navigation)", () => {
    const seenPaths: string[] = [];
    for (const step of tourSteps) {
      if (seenPaths[seenPaths.length - 1] !== step.path) {
        expect(seenPaths).not.toContain(step.path);
        seenPaths.push(step.path);
      }
    }
  });
});
