import { describe, expect, it } from "vitest";
import { initialTourState, tourReducer } from "./tourReducer";

describe("tourReducer", () => {
  it("starts inactive at step 0", () => {
    expect(initialTourState).toEqual({ active: false, stepIndex: 0 });
  });

  it("START activates the tour at step 0", () => {
    const state = tourReducer({ active: false, stepIndex: 5 }, { type: "START" });
    expect(state).toEqual({ active: true, stepIndex: 0 });
  });

  it("NEXT advances to the next step", () => {
    const state = tourReducer({ active: true, stepIndex: 0 }, { type: "NEXT", totalSteps: 3 });
    expect(state).toEqual({ active: true, stepIndex: 1 });
  });

  it("NEXT past the last step deactivates and resets to 0", () => {
    const state = tourReducer({ active: true, stepIndex: 2 }, { type: "NEXT", totalSteps: 3 });
    expect(state).toEqual({ active: false, stepIndex: 0 });
  });

  it("PREV moves back one step", () => {
    const state = tourReducer({ active: true, stepIndex: 2 }, { type: "PREV" });
    expect(state).toEqual({ active: true, stepIndex: 1 });
  });

  it("PREV never goes below 0", () => {
    const state = tourReducer({ active: true, stepIndex: 0 }, { type: "PREV" });
    expect(state).toEqual({ active: true, stepIndex: 0 });
  });

  it("SKIP deactivates and resets to step 0", () => {
    const state = tourReducer({ active: true, stepIndex: 4 }, { type: "SKIP" });
    expect(state).toEqual({ active: false, stepIndex: 0 });
  });
});
