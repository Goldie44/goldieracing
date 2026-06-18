








import { createContext, useContext, useEffect, useState } from "react";
import { budgetSections, totalBudget as initialTotalBudget } from "./f1Data";

const BudgetContext = createContext(null);

export function BudgetProvider({ children }) {
  const [sections, setSections] = useState(budgetSections);
  const [totalBudget, setTotalBudget] = useState(initialTotalBudget);
  const [spentTotalsLoaded, setSpentTotalsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const storage = window.app?.budgetSpentTotals;

    if (!storage) {
      setSpentTotalsLoaded(true);
      return;
    }

    storage
      .load()
      .then((spentTotals) => {
        if (cancelled) return;

        setSections((prev) =>
          prev.map((section) => ({
            ...section,
            spentTotal:
              spentTotals[section.section] !== undefined
                ? Number(spentTotals[section.section]) || 0
                : section.spentTotal,
          })),
        );
      })
      .catch((error) => {
        console.error("Unable to load budget spentTotal values", error);
      })
      .finally(() => {
        if (!cancelled) setSpentTotalsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const storage = window.app?.budgetSpentTotals;
    if (!spentTotalsLoaded || !storage) return;

    const spentTotals = Object.fromEntries(
      sections.map((section) => [section.section, Number(section.spentTotal) || 0]),
    );

    void storage.save(spentTotals).catch((error) => {
      console.error("Unable to save budget spentTotal values", error);
    });
  }, [sections, spentTotalsLoaded]);

  const reset = () => {
    setSections(budgetSections);
    setTotalBudget(initialTotalBudget);
  };

  return (
    <BudgetContext.Provider value={{ sections, setSections, totalBudget, setTotalBudget, reset }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  return useContext(BudgetContext);
}
