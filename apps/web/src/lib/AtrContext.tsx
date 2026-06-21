import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const initialSections = [
  {
    label: "Vélocité",
    rows: [
      { label: "Vitesse max (km/h)" },
      { label: "Accélération" },
      { label: "Efficacité du DRS (%)" },
    ],
  },
  {
    label: "Virage",
    rows: [
      { label: "Faible vitesse" },
      { label: "Vitesse moyenne" },
      { label: "Grande vitesse" },
      { label: "Tolérance Dirty air (%)" },
    ],
  },
  {
    label: "Composants",
    rows: [
      { label: "Préservation des pneus" },
      { label: "Refroidissement du moteur" },
      { label: "Poids excédentaire totale (Kg)" },
    ],
  },
];

const ATR_STORAGE_KEY = "goldie-racing:atr-data";

const createDefaultData = () => initialSections.map(s => ({
  ...s,
  rows: s.rows.map(r => ({ ...r, v1: "", moyenne: "", delta: "", cd: "", deltaCD: "", gainsAttendus: "" })),
}));

type AtrContextValue = {
  atrData: ReturnType<typeof createDefaultData>;
  setAtrData: (data: ReturnType<typeof createDefaultData>) => void;
  initialSections: typeof initialSections;
  reset: () => void;
};

const loadStoredAtrData = () => {
  if (typeof window === "undefined") return createDefaultData();

  try {
    const stored = window.localStorage.getItem(ATR_STORAGE_KEY);
    if (!stored) return createDefaultData();

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return createDefaultData();

    return createDefaultData().map((section, sectionIndex) => {
      const savedSection = parsed[sectionIndex];
      if (!savedSection || !Array.isArray(savedSection.rows)) return section;

      return {
        ...section,
        rows: section.rows.map((row, rowIndex) => ({
          ...row,
          ...savedSection.rows[rowIndex],
          label: row.label,
        })),
      };
    });
  } catch (error) {
    console.error("Unable to load ATR table values", error);
    return createDefaultData();
  }
};

const AtrContext = createContext<AtrContextValue | null>(null);

export function AtrProvider({ children }: { children: ReactNode }) {
  const [atrData, setAtrData] = useState(loadStoredAtrData);

  const reset = () => setAtrData(createDefaultData());

  useEffect(() => {
    try {
      window.localStorage.setItem(ATR_STORAGE_KEY, JSON.stringify(atrData));
    } catch (error) {
      console.error("Unable to save ATR table values", error);
    }
  }, [atrData]);

  return (
    <AtrContext.Provider value={{ atrData, setAtrData, initialSections, reset }}>
      {children}
    </AtrContext.Provider>
  );
}

export function useAtr(): AtrContextValue {
  const context = useContext(AtrContext);
  if (!context) throw new Error("useAtr must be used within AtrProvider");
  return context;
}

export { initialSections };
