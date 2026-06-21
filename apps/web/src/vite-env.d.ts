/// <reference types="vite/client" />

type BudgetValues = Record<string, number>;

interface Window {
  app?: {
    platform: NodeJS.Platform;
    versions: {
      electron: string;
      chrome: string;
      node: string;
    };
    budgetSpentTotals?: {
      load: () => Promise<BudgetValues>;
      save: (values: BudgetValues) => Promise<void>;
    };
    budgetAllocatedTotals?: {
      load: () => Promise<BudgetValues>;
      save: (values: BudgetValues) => Promise<void>;
    };
    budgetTotalBudget?: {
      load: () => Promise<number | null>;
      save: (value: number) => Promise<void>;
    };
  };
}
