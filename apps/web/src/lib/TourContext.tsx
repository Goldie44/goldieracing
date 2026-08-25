import { createContext, useContext, useEffect, useReducer, ReactNode } from "react";
import { initialTourState, tourReducer } from "./tourReducer";
import { tourSteps, type TourStep } from "./tourSteps";
import { ONBOARDED_KEY } from "./onboardingKeys";

export const TOUR_COMPLETED_KEY = "goldie-racing:tour-completed";

type TourContextValue = {
  active: boolean;
  currentStep: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

function markCompleted() {
  try {
    window.localStorage.setItem(TOUR_COMPLETED_KEY, "true");
  } catch {}
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tourReducer, initialTourState);

  const start = () => dispatch({ type: "START" });

  const next = () => {
    if (state.stepIndex + 1 >= tourSteps.length) markCompleted();
    dispatch({ type: "NEXT", totalSteps: tourSteps.length });
  };

  const prev = () => dispatch({ type: "PREV" });

  const skip = () => {
    markCompleted();
    dispatch({ type: "SKIP" });
  };

  useEffect(() => {
    try {
      const onboarded = window.localStorage.getItem(ONBOARDED_KEY) === "true";
      const toured = window.localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
      if (onboarded && !toured) start();
    } catch {}
    // Only ever runs once, on mount — new users are started explicitly by
    // WelcomeDialog's submit handler instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = state.active ? tourSteps[state.stepIndex] ?? null : null;

  return (
    <TourContext.Provider
      value={{
        active: state.active,
        currentStep,
        stepIndex: state.stepIndex,
        totalSteps: tourSteps.length,
        start,
        next,
        prev,
        skip,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) throw new Error("useTour must be used within TourProvider");
  return context;
}
