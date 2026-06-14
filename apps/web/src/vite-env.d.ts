/// <reference types="vite/client" />

type BudgetSpentTotals = Record<string, number>;

interface Window {
  app?: {
    platform: NodeJS.Platform;
    versions: {
      electron: string;
      chrome: string;
      node: string;
    };
    budgetSpentTotals?: {
      load: () => Promise<BudgetSpentTotals>;
      save: (values: BudgetSpentTotals) => Promise<void>;
    };
  };
}
