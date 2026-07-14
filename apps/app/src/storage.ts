import fs from 'node:fs';
import path from 'node:path';

export type BudgetSpentTotals = Record<string, number>;
export type BudgetAllocatedTotals = Record<string, number>;

export type BudgetStorage = {
  loadSpentTotals: () => BudgetSpentTotals;
  saveSpentTotals: (values: BudgetSpentTotals) => void;
  loadAllocatedTotals: () => BudgetAllocatedTotals;
  saveAllocatedTotals: (values: BudgetAllocatedTotals) => void;
  loadTotalBudget: () => number | null;
  saveTotalBudget: (value: number) => void;
  close: () => void;
};

type StoreData = {
  spentTotals: BudgetSpentTotals;
  allocatedTotals: BudgetAllocatedTotals;
  totalBudget: number | null;
};

const EMPTY: StoreData = { spentTotals: {}, allocatedTotals: {}, totalBudget: null };

export function createBudgetStorage(filePath: string): BudgetStorage {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  function read(): StoreData {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as StoreData;
    } catch {
      return { ...EMPTY };
    }
  }

  function write(data: StoreData): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  return {
    loadSpentTotals: () => read().spentTotals ?? {},
    saveSpentTotals: (values) => write({ ...read(), spentTotals: values }),

    loadAllocatedTotals: () => read().allocatedTotals ?? {},
    saveAllocatedTotals: (values) => write({ ...read(), allocatedTotals: values }),

    loadTotalBudget: () => read().totalBudget ?? null,
    saveTotalBudget: (value) =>
      write({ ...read(), totalBudget: Number.isFinite(value) ? value : null }),

    close: () => {},
  };
}

export type BudgetSpentTotalStorage = BudgetStorage;
export function createBudgetSpentTotalStorage(filePath: string): BudgetStorage {
  return createBudgetStorage(filePath);
}
