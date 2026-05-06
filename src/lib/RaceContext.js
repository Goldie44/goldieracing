import { createContext, useContext, useState } from "react";

const RaceContext = createContext();

export function RaceProvider({ children }) {
  const [done, setDone] = useState({});
  const toggle = (id) => setDone(prev => ({ ...prev, [id]: !prev[id] }));
  return (
    <RaceContext.Provider value={{ done, toggle }}>
      {children}
    </RaceContext.Provider>
  );
}

export const useRace = () => useContext(RaceContext);