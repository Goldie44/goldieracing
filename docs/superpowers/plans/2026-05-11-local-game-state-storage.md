# Local Game State Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the whole Goldie Racing app state locally with `better-sqlite3`.

**Architecture:** Electron owns SQLite access through a single JSON snapshot row in a `game_state` table. The renderer loads and saves that snapshot through `window.app.gameState`, then shares it through React contexts and page-local state where needed.

**Tech Stack:** Electron, React, TypeScript, Vite, `better-sqlite3`, Node test runner.

---

## File Structure

- Modify: `apps/app/src/storage.ts`
  - Replace budget-only persistence with `createGameStateStorage(dbPath)`.
  - Keep a compatibility export only if needed by existing code during the transition.
- Modify: `apps/app/src/main.ts`
  - Register IPC handlers: `game-state:load`, `game-state:save`, `game-state:reset`.
- Modify: `apps/app/src/preload.ts`
  - Expose `window.app.gameState`.
- Modify: `apps/app/test/storage.test.cjs`
  - Test complete snapshot save/load, empty load, and reset.
- Modify: `apps/web/src/vite-env.d.ts`
  - Define `GameStateSnapshot` and `window.app.gameState`.
- Create: `apps/web/src/lib/gameState.ts`
  - Define default state builders and reusable types.
- Modify: `apps/web/src/lib/BudgetContext.tsx`
  - Load/save budget through the global state context.
- Modify: `apps/web/src/lib/RaceContext.tsx`
  - Load/save completed races through the global state context.
- Modify: `apps/web/src/lib/AtrContext.tsx`
  - Load/save ATR values through the global state context.
- Modify: `apps/web/src/app.tsx`
  - Add `GameStateProvider` around existing providers.
- Modify: `apps/web/src/pages/StockPage.tsx`
  - Load/save stock counts and unit costs through the global state context.
- Modify: `apps/web/src/pages/PerformancePage.tsx`
  - Load/save development projects through the global state context.

### Task 1: SQLite Game State Storage

**Files:**
- Modify: `apps/app/test/storage.test.cjs`
- Modify: `apps/app/src/storage.ts`

- [ ] **Step 1: Write the failing storage tests**

Replace `apps/app/test/storage.test.cjs` with:

```js
const assert = require("node:assert/strict");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createGameStateStorage } = require("../dist/storage");

function withStorage(run) {
  const dir = mkdtempSync(path.join(tmpdir(), "goldie-state-"));
  const dbPath = path.join(dir, "app.sqlite");

  try {
    return run(dbPath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const completeState = {
  version: 1,
  budget: {
    totalBudget: 139200000,
    sections: [{ section: "Developpement", spentTotal: 1200, items: [] }],
  },
  races: { done: { "1": true, "2": false } },
  stock: {
    counts: { Chassis: 4 },
    costs: { Chassis: 550000 },
  },
  atr: {
    sections: [{ label: "Velocite", rows: [{ label: "Vitesse max", v1: "80", moyenne: "79" }] }],
  },
  developmentProjects: [{ atr: "ATR8", race: "Monaco", parts: ["Fond plat"] }],
  staff: [{ role: "Responsable Aero", skills: [{ name: "Grande vitesse", value: 85 }] }],
  rdProjects: [{ id: 1, name: "Fond plat", status: "En cours", progress: 65 }],
};

test("returns null when no game state has been saved", () =>
  withStorage((dbPath) => {
    const storage = createGameStateStorage(dbPath);
    assert.equal(storage.load(), null);
    storage.close();
  }));

test("saves and loads the complete game state locally", () =>
  withStorage((dbPath) => {
    const storage = createGameStateStorage(dbPath);
    storage.save(completeState);
    storage.close();

    const reopened = createGameStateStorage(dbPath);
    assert.deepEqual(reopened.load(), completeState);
    reopened.close();
  }));

test("reset removes the saved game state", () =>
  withStorage((dbPath) => {
    const storage = createGameStateStorage(dbPath);
    storage.save(completeState);
    storage.reset();
    assert.equal(storage.load(), null);
    storage.close();
  }));
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @f1-manager/app build && pnpm --filter @f1-manager/app test`

Expected: build fails or tests fail because `createGameStateStorage` is not exported.

- [ ] **Step 3: Implement storage**

In `apps/app/src/storage.ts`, create a `game_state` table:

```ts
import Database from "better-sqlite3";

export type GameStateSnapshot = Record<string, unknown>;

export type GameStateStorage = {
  load: () => GameStateSnapshot | null;
  save: (state: GameStateSnapshot) => void;
  reset: () => void;
  close: () => void;
};

type GameStateRow = {
  state_json: string;
};

function isObject(value: unknown): value is GameStateSnapshot {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createGameStateStorage(dbPath: string): GameStateStorage {
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_state (
      id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const loadStatement = db.prepare("SELECT state_json FROM game_state WHERE id = ?");
  const saveStatement = db.prepare(`
    INSERT INTO game_state (id, state_json, updated_at)
    VALUES ('default', @stateJson, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      state_json = excluded.state_json,
      updated_at = CURRENT_TIMESTAMP
  `);
  const resetStatement = db.prepare("DELETE FROM game_state WHERE id = ?");

  return {
    load: () => {
      const row = loadStatement.get("default") as GameStateRow | undefined;
      if (!row) return null;

      try {
        const parsed = JSON.parse(row.state_json) as unknown;
        return isObject(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    save: (state) => {
      saveStatement.run({ stateJson: JSON.stringify(state) });
    },
    reset: () => {
      resetStatement.run("default");
    },
    close: () => {
      db.close();
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @f1-manager/app build && pnpm --filter @f1-manager/app test`

Expected: all storage tests pass.

### Task 2: Electron IPC API

**Files:**
- Modify: `apps/app/src/main.ts`
- Modify: `apps/app/src/preload.ts`
- Modify: `apps/web/src/vite-env.d.ts`

- [ ] **Step 1: Update IPC in main process**

In `apps/app/src/main.ts`, replace budget-specific imports and handlers with `GameStateStorage`:

```ts
import { createGameStateStorage, type GameStateStorage } from "./storage";

let gameStateStorage: GameStateStorage | null = null;

function registerGameStateHandlers(storage: GameStateStorage): void {
  ipcMain.handle("game-state:load", () => storage.load());
  ipcMain.handle("game-state:save", (_event, state: Record<string, unknown>) => {
    storage.save(state);
  });
  ipcMain.handle("game-state:reset", () => {
    storage.reset();
  });
}
```

Inside `app.whenReady()`:

```ts
gameStateStorage = createGameStateStorage(path.join(app.getPath("userData"), "goldie-racing.sqlite"));
registerGameStateHandlers(gameStateStorage);
```

Inside `before-quit`:

```ts
gameStateStorage?.close();
gameStateStorage = null;
```

- [ ] **Step 2: Expose preload API**

In `apps/app/src/preload.ts`, expose:

```ts
gameState: {
  load: () => ipcRenderer.invoke("game-state:load"),
  save: (state: Record<string, unknown>) => ipcRenderer.invoke("game-state:save", state),
  reset: () => ipcRenderer.invoke("game-state:reset"),
},
```

- [ ] **Step 3: Update renderer global types**

In `apps/web/src/vite-env.d.ts`, define:

```ts
type GameStateSnapshot = {
  version: 1;
  budget: {
    totalBudget: number;
    sections: unknown[];
  };
  races: {
    done: Record<string, boolean>;
  };
  stock: {
    counts: Record<string, number>;
    costs: Record<string, number>;
  };
  atr: {
    sections: unknown[];
  };
  developmentProjects: unknown[];
  staff: unknown[];
  rdProjects: unknown[];
};
```

Then `window.app.gameState`:

```ts
gameState?: {
  load: () => Promise<GameStateSnapshot | null>;
  save: (state: GameStateSnapshot) => Promise<void>;
  reset: () => Promise<void>;
};
```

- [ ] **Step 4: Verify Electron app builds**

Run: `pnpm --filter @f1-manager/app build`

Expected: TypeScript build passes.

### Task 3: Renderer Global State

**Files:**
- Create: `apps/web/src/lib/gameState.ts`
- Modify: `apps/web/src/app.tsx`

- [ ] **Step 1: Create state helper**

Create `apps/web/src/lib/gameState.ts`:

```ts
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { budgetSections, totalBudget, stock, staff, developmentUpdates } from "./f1Data";

type GameStateSnapshot = {
  version: 1;
  budget: {
    totalBudget: number;
    sections: typeof budgetSections;
  };
  races: {
    done: Record<string, boolean>;
  };
  stock: {
    counts: Record<string, number>;
    costs: Record<string, number>;
  };
  atr: {
    sections: Array<{
      label: string;
      rows: Array<Record<string, string>>;
    }>;
  };
  developmentProjects: Array<{
    atr: string;
    race: string;
    parts: string[];
  }>;
  staff: typeof staff;
  rdProjects: unknown[];
};

type GameStateContextValue = {
  state: GameStateSnapshot;
  setState: React.Dispatch<React.SetStateAction<GameStateSnapshot>>;
  loaded: boolean;
  reset: () => void;
};

const defaultAtrSections = [
  {
    label: "Velocite",
    rows: [
      { label: "Vitesse max", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" },
      { label: "Acceleration", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" },
      { label: "Efficacite du DRS", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" },
    ],
  },
  {
    label: "Virage",
    rows: [
      { label: "Faible vitesse", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" },
      { label: "Vitesse moyenne", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" },
      { label: "Grande vitesse", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" },
      { label: "Tolerance Dirty air", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" },
    ],
  },
  {
    label: "Composants",
    rows: [
      { label: "Preservation des pneus", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" },
      { label: "Refroidissement du moteur", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" },
      { label: "Poids excedentaire totale", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" },
    ],
  },
];

export function createDefaultGameState(): GameStateSnapshot {
  return {
    version: 1,
    budget: {
      totalBudget,
      sections: budgetSections,
    },
    races: {
      done: {},
    },
    stock: {
      counts: Object.fromEntries(stock.map((item) => [item.piece, item.count])),
      costs: Object.fromEntries(stock.map((item) => [item.piece, item.costUnit])),
    },
    atr: {
      sections: defaultAtrSections,
    },
    developmentProjects: developmentUpdates,
    staff,
    rdProjects: [],
  };
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const defaultState = useMemo(() => createDefaultGameState(), []);
  const [state, setState] = useState<GameStateSnapshot>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const storage = window.app?.gameState;

    if (!storage) {
      setLoaded(true);
      return;
    }

    storage
      .load()
      .then((saved) => {
        if (!cancelled && saved) setState({ ...defaultState, ...saved });
      })
      .catch((error) => {
        console.error("Unable to load game state", error);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [defaultState]);

  useEffect(() => {
    const storage = window.app?.gameState;
    if (!loaded || !storage) return;

    void storage.save(state).catch((error) => {
      console.error("Unable to save game state", error);
    });
  }, [loaded, state]);

  const reset = () => {
    setState(defaultState);
    void window.app?.gameState?.reset().catch((error) => {
      console.error("Unable to reset game state", error);
    });
  };

  return (
    <GameStateContext.Provider value={{ state, setState, loaded, reset }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) throw new Error("useGameState must be used within GameStateProvider");
  return context;
}
```

- [ ] **Step 2: Wrap app providers**

In `apps/web/src/app.tsx`, wrap existing providers with `GameStateProvider`:

```tsx
<GameStateProvider>
  <RaceProvider>
    <BudgetProvider>
      <AtrProvider>
        ...
      </AtrProvider>
    </BudgetProvider>
  </RaceProvider>
</GameStateProvider>
```

- [ ] **Step 3: Run renderer typecheck**

Run: `pnpm --filter @f1-manager/web typecheck`

Expected: typecheck passes.

### Task 4: Connect Existing Contexts and Pages

**Files:**
- Modify: `apps/web/src/lib/BudgetContext.tsx`
- Modify: `apps/web/src/lib/RaceContext.tsx`
- Modify: `apps/web/src/lib/AtrContext.tsx`
- Modify: `apps/web/src/pages/StockPage.tsx`
- Modify: `apps/web/src/pages/PerformancePage.tsx`

- [ ] **Step 1: Connect budget context**

Use `useGameState()` in `BudgetContext`. Initialize `sections` and `totalBudget` from `state.budget`, and update global state whenever setters are called.

- [ ] **Step 2: Connect race context**

Use `state.races.done` as the source of truth. `toggle(id)` updates `state.races.done`.

- [ ] **Step 3: Connect ATR context**

Use `state.atr.sections` as the source of truth. `setAtrData` updates `state.atr.sections`.

- [ ] **Step 4: Connect StockPage**

Initialize `counts` from `state.stock.counts` and `costs` from `state.stock.costs`. When inputs change, update both local state and global state.

- [ ] **Step 5: Connect PerformancePage projects**

Initialize `projects` from `state.developmentProjects`. When adding a project, update both local state and global state.

- [ ] **Step 6: Run builds**

Run: `pnpm --filter @f1-manager/web typecheck && pnpm --filter @f1-manager/app build && pnpm --filter @f1-manager/app test`

Expected: all commands pass.
