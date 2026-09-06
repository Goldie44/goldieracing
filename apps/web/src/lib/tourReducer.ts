export type TourState = {
  active: boolean;
  stepIndex: number;
};

export type TourAction =
  | { type: "START" }
  | { type: "NEXT"; totalSteps: number }
  | { type: "PREV" }
  | { type: "SKIP" };

export const initialTourState: TourState = { active: false, stepIndex: 0 };

export function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case "START":
      return { active: true, stepIndex: 0 };
    case "NEXT": {
      const nextIndex = state.stepIndex + 1;
      if (nextIndex >= action.totalSteps) {
        return { active: false, stepIndex: 0 };
      }
      return { active: true, stepIndex: nextIndex };
    }
    case "PREV":
      return { active: state.active, stepIndex: Math.max(0, state.stepIndex - 1) };
    case "SKIP":
      return { active: false, stepIndex: 0 };
    default:
      return state;
  }
}
