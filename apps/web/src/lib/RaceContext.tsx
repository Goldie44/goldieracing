import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type RaceState = Record<string, boolean>;

type RaceContextValue = {
  done: RaceState;
  toggle: (id: string | number) => void;
  reset: () => void;
};

const RACE_STORAGE_KEY = "goldie-racing:race-done";

const RaceContext = createContext<RaceContextValue>({
  done: {},
  toggle: () => undefined,
  reset: () => undefined,
});

export function RaceProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState<RaceState>(() => {
    try {
      const stored = window.localStorage.getItem(RACE_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  const toggle = (id: string | number) =>
    setDone(prev => ({ ...prev, [String(id)]: !prev[String(id)] }));

  const reset = () => setDone({});

  useEffect(() => {
    try {
      window.localStorage.setItem(RACE_STORAGE_KEY, JSON.stringify(done));
    } catch {}
  }, [done]);

  return (
    <RaceContext.Provider value={{ done, toggle, reset }}>
      {children}
    </RaceContext.Provider>
  );
}

export const useRace = (): RaceContextValue => useContext(RaceContext);
