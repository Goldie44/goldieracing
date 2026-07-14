/// <reference types="vite/client" />

type BudgetValues = Record<string, number>;

type AtrVisionEntry = {
  section: string;
  label: string;
  v1: string;
  moyenne: string;
};

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
    atrVisionApiKey?: {
      load: () => Promise<string | null>;
      save: (value: string) => Promise<void>;
    };
    atrVision?: {
      extract: (imageBase64: string, mediaType: string) => Promise<AtrVisionEntry[]>;
    };
  };
}
