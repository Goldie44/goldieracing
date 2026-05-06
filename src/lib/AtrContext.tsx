import { createContext, useContext, useState } from "react";

const initialSections = [
  {
    label: "Vélocité",
    rows: [
      { label: "Vitesse max" },
      { label: "Accélération" },
      { label: "Efficacité du DRS" },
    ],
  },
  {
    label: "Virage",
    rows: [
      { label: "Faible vitesse" },
      { label: "Vitesse moyenne" },
      { label: "Grande vitesse" },
      { label: "Tolérance Dirty air" },
    ],
  },
  {
    label: "Composants",
    rows: [
      { label: "Préservation des pneus" },
      { label: "Refroidissement du moteur" },
      { label: "Poids excédentaire totale" },
    ],
  },
];

const defaultData = initialSections.map(s => ({
  ...s,
  rows: s.rows.map(r => ({ ...r, v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" })),
}));

const AtrContext = createContext(null);

export function AtrProvider({ children }) {
  const [atrData, setAtrData] = useState(defaultData);
  return (
    <AtrContext.Provider value={{ atrData, setAtrData, initialSections }}>
      {children}
    </AtrContext.Provider>
  );
}

export function useAtr() {
  return useContext(AtrContext);
}

export { initialSections };