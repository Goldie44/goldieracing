const assert = require("node:assert/strict");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createBudgetSpentTotalStorage } = require("../dist/storage");

test("saves and loads budget spentTotal values locally", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "goldie-budget-"));
  const dbPath = path.join(dir, "app.sqlite");

  try {
    const storage = createBudgetSpentTotalStorage(dbPath);
    storage.saveSpentTotals({
      "Developpement de pieces": 1250000,
      "Recherche de pieces": 340000,
    });
    storage.close();

    const reopened = createBudgetSpentTotalStorage(dbPath);
    assert.deepEqual(reopened.loadSpentTotals(), {
      "Developpement de pieces": 1250000,
      "Recherche de pieces": 340000,
    });
    reopened.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
