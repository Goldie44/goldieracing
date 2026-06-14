import Database from 'better-sqlite3';

export type BudgetSpentTotals = Record<string, number>;

export type BudgetSpentTotalStorage = {
  load: () => BudgetSpentTotals;
  save: (values: BudgetSpentTotals) => void;
  close: () => void;
};

type BudgetSpentTotalRow = {
  section: string;
  spent_total: number;
};

export function createBudgetSpentTotalStorage(dbPath: string): BudgetSpentTotalStorage {
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS budget_spent_totals (
      section TEXT PRIMARY KEY,
      spent_total REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const loadStatement = db.prepare('SELECT section, spent_total FROM budget_spent_totals');
  const deleteStatement = db.prepare('DELETE FROM budget_spent_totals');
  const insertStatement = db.prepare(`
    INSERT INTO budget_spent_totals (section, spent_total, updated_at)
    VALUES (@section, @spentTotal, CURRENT_TIMESTAMP)
  `);

  const saveAll = db.transaction((values: BudgetSpentTotals) => {
    deleteStatement.run();

    for (const [section, spentTotal] of Object.entries(values)) {
      insertStatement.run({
        section,
        spentTotal: Number.isFinite(spentTotal) ? spentTotal : 0,
      });
    }
  });

  return {
    load: () =>
      Object.fromEntries(
        loadStatement
          .all()
          .map((row) => {
            const item = row as BudgetSpentTotalRow;
            return [item.section, item.spent_total];
          }),
      ),
    save: (values) => {
      saveAll(values);
    },
    close: () => {
      db.close();
    },
  };
}
