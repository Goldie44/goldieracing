import Database from 'better-sqlite3';

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

type SectionRow = { section: string; value: number };
type ConfigRow = { key: string; value: number };

export function createBudgetStorage(dbPath: string): BudgetStorage {
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS budget_spent_totals (
      section TEXT PRIMARY KEY,
      spent_total REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS budget_allocated_totals (
      section TEXT PRIMARY KEY,
      value REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS budget_config (
      key TEXT PRIMARY KEY,
      value REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // spent totals
  const loadSpentStmt = db.prepare('SELECT section, spent_total FROM budget_spent_totals');
  const deleteSpentStmt = db.prepare('DELETE FROM budget_spent_totals');
  const insertSpentStmt = db.prepare(
    'INSERT INTO budget_spent_totals (section, spent_total, updated_at) VALUES (@section, @value, CURRENT_TIMESTAMP)'
  );
  const saveSpentAll = db.transaction((values: BudgetSpentTotals) => {
    deleteSpentStmt.run();
    for (const [section, value] of Object.entries(values)) {
      insertSpentStmt.run({ section, value: Number.isFinite(value) ? value : 0 });
    }
  });

  // allocated totals
  const loadAllocatedStmt = db.prepare('SELECT section, value FROM budget_allocated_totals');
  const deleteAllocatedStmt = db.prepare('DELETE FROM budget_allocated_totals');
  const insertAllocatedStmt = db.prepare(
    'INSERT INTO budget_allocated_totals (section, value, updated_at) VALUES (@section, @value, CURRENT_TIMESTAMP)'
  );
  const saveAllocatedAll = db.transaction((values: BudgetAllocatedTotals) => {
    deleteAllocatedStmt.run();
    for (const [section, value] of Object.entries(values)) {
      insertAllocatedStmt.run({ section, value: Number.isFinite(value) ? value : 0 });
    }
  });

  // total budget config
  const loadConfigStmt = db.prepare('SELECT value FROM budget_config WHERE key = ?');
  const upsertConfigStmt = db.prepare(
    'INSERT INTO budget_config (key, value, updated_at) VALUES (@key, @value, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = CURRENT_TIMESTAMP'
  );

  return {
    loadSpentTotals: () =>
      Object.fromEntries(
        (loadSpentStmt.all() as { section: string; spent_total: number }[]).map((row) => [
          row.section,
          row.spent_total,
        ])
      ),
    saveSpentTotals: (values) => saveSpentAll(values),

    loadAllocatedTotals: () =>
      Object.fromEntries(
        (loadAllocatedStmt.all() as SectionRow[]).map((row) => [row.section, row.value])
      ),
    saveAllocatedTotals: (values) => saveAllocatedAll(values),

    loadTotalBudget: () => {
      const row = loadConfigStmt.get('total_budget') as ConfigRow | undefined;
      return row ? row.value : null;
    },
    saveTotalBudget: (value) =>
      upsertConfigStmt.run({ key: 'total_budget', value: Number.isFinite(value) ? value : 0 }),

    close: () => db.close(),
  };
}

// Legacy alias so old callers keep working during migration
export type BudgetSpentTotalStorage = BudgetStorage;
export function createBudgetSpentTotalStorage(dbPath: string): BudgetStorage {
  return createBudgetStorage(dbPath);
}
