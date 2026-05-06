import { createContext, useContext, useState, type ReactNode } from "react";

type RaceState = Record<string, boolean>;

type RaceContextValue = {
  done: RaceState;
  toggle: (id: string | number) => void;
};

const RaceContext = createContext<RaceContextValue>({
  done: {},
  toggle: () => undefined,
});

export function RaceProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState<RaceState>({});
  const toggle = (id: string | number) =>
    setDone(prev => ({ ...prev, [String(id)]: !prev[String(id)] }));
  return (
    <RaceContext.Provider value={{ done, toggle }}>
      {children}
    </RaceContext.Provider>
  );
}

export const useRace = (): RaceContextValue => useContext(RaceContext);
