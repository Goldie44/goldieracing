import { createContext, useContext, useEffect, useState } from "react";
import { budgetSections, totalBudget as initialTotalBudget } from "./f1Data";

const BudgetContext = createContext(null);

export function BudgetProvider({ children }) {
  const [sections, setSections] = useState(() =>
    budgetSections.map(s => ({ ...s, spentTotal: 0, allocatedTotal: 0 }))
  );
  const [totalBudget, setTotalBudget] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load all persisted budget data on mount
  useEffect(() => {
    const storage = window.app;
    if (!storage) {
      setDataLoaded(true);
      return;
    }

    let cancelled = false;

    Promise.all([
      storage.budgetSpentTotals?.load().catch(() => ({})) ?? Promise.resolve({}),
      storage.budgetAllocatedTotals?.load().catch(() => ({})) ?? Promise.resolve({}),
      storage.budgetTotalBudget?.load().catch(() => null) ?? Promise.resolve(null),
    ]).then(([spentTotals, allocatedTotals, savedTotalBudget]) => {
      if (cancelled) return;

      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          ...(spentTotals[section.section] !== undefined
            ? { spentTotal: Number(spentTotals[section.section]) || 0 }
            : {}),
          ...(allocatedTotals[section.section] !== undefined
            ? { allocatedTotal: Number(allocatedTotals[section.section]) || 0 }
            : {}),
        }))
      );

      if (savedTotalBudget !== null) {
        setTotalBudget(Number(savedTotalBudget) || initialTotalBudget);
      }

      setDataLoaded(true);
    }).catch(() => {
      if (!cancelled) setDataLoaded(true);
    });

    return () => { cancelled = true; };
  }, []);

  // Save spent totals whenever they change (after initial load)
  useEffect(() => {
    const storage = window.app;
    if (!dataLoaded || !storage?.budgetSpentTotals) return;

    const values = Object.fromEntries(
      sections.map((s) => [s.section, Number(s.spentTotal) || 0])
    );
    void storage.budgetSpentTotals.save(values).catch((err) => {
      console.error("Unable to save budget spentTotal values", err);
    });
  }, [sections, dataLoaded]);

  // Save allocated totals whenever they change (after initial load)
  useEffect(() => {
    const storage = window.app;
    if (!dataLoaded || !storage?.budgetAllocatedTotals) return;

    const values = Object.fromEntries(
      sections.map((s) => [s.section, Number(s.allocatedTotal) || 0])
    );
    void storage.budgetAllocatedTotals.save(values).catch((err) => {
      console.error("Unable to save budget allocatedTotal values", err);
    });
  }, [sections, dataLoaded]);

  // Save totalBudget whenever it changes (after initial load)
  useEffect(() => {
    const storage = window.app;
    if (!dataLoaded || !storage?.budgetTotalBudget) return;

    void storage.budgetTotalBudget.save(totalBudget).catch((err) => {
      console.error("Unable to save totalBudget", err);
    });
  }, [totalBudget, dataLoaded]);

  const reset = () => {
    setSections(budgetSections.map(s => ({ ...s, spentTotal: 0, allocatedTotal: 0 })));
    setTotalBudget(0);
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
