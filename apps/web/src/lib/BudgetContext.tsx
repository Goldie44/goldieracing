import { createContext, useContext, useState } from "react";
import { budgetSections, totalBudget as initialTotalBudget } from "./f1Data";

const BudgetContext = createContext(null);

export function BudgetProvider({ children }) {
  const [sections, setSections] = useState(budgetSections);
  const [totalBudget, setTotalBudget] = useState(initialTotalBudget);

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