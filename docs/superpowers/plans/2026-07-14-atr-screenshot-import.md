# Import ATR depuis capture d'écran (IA Vision) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a button on the Performance page that lets the user paste a screenshot of the F1 game's technical comparison screen, sends it to Claude's vision API from the Electron main process, and lets the user preview/edit the extracted `v1`/`moyenne` values before applying them to the ATR table.

**Architecture:** The API key is stored via the existing Electron main-process JSON storage (`apps/app/src/storage.ts`) and exposed to the renderer over IPC, mirroring the existing `budget-*` handlers. A new `apps/app/src/aiVision.ts` module builds the vision prompt, calls the Anthropic SDK, and parses/validates the JSON response. The renderer (`apps/web`) gets a pure, unit-tested merge function (`atrVisionImport.ts`) that folds extracted entries into the existing `atrData` shape, plus UI in `PerformancePage.tsx` for paste → preview → apply.

**Tech Stack:** Electron (main process, Node/TypeScript), React + Vite (renderer), `@anthropic-ai/sdk`, Node's built-in test runner (`node --test`) for `apps/app`, Vitest (new) for pure logic in `apps/web`.

**Reference spec:** `docs/superpowers/specs/2026-07-14-atr-screenshot-import-design.md`

---

### Task 1: Store the vision API key in the existing Electron storage

**Files:**
- Modify: `apps/app/src/storage.ts`
- Test: `apps/app/test/storage.test.cjs`

- [ ] **Step 1: Write the failing test**

Add to `apps/app/test/storage.test.cjs` (append after the existing test):

```js
test("saves and loads the vision API key locally", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "goldie-vision-key-"));
  const dbPath = path.join(dir, "app.sqlite");

  try {
    const storage = createBudgetSpentTotalStorage(dbPath);
    assert.equal(storage.loadVisionApiKey(), null);

    storage.saveVisionApiKey("sk-ant-test-123");
    storage.close();

    const reopened = createBudgetSpentTotalStorage(dbPath);
    assert.equal(reopened.loadVisionApiKey(), "sk-ant-test-123");
    reopened.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/app && pnpm run build && node --test test/*.test.cjs`
Expected: FAIL with `storage.loadVisionApiKey is not a function`

- [ ] **Step 3: Implement `loadVisionApiKey`/`saveVisionApiKey`**

In `apps/app/src/storage.ts`, update `StoreData`, `EMPTY`, `BudgetStorage`, and the returned object:

```ts
type StoreData = {
  spentTotals: BudgetSpentTotals;
  allocatedTotals: BudgetAllocatedTotals;
  totalBudget: number | null;
  visionApiKey: string | null;
};

const EMPTY: StoreData = { spentTotals: {}, allocatedTotals: {}, totalBudget: null, visionApiKey: null };
```

```ts
export type BudgetStorage = {
  loadSpentTotals: () => BudgetSpentTotals;
  saveSpentTotals: (values: BudgetSpentTotals) => void;
  loadAllocatedTotals: () => BudgetAllocatedTotals;
  saveAllocatedTotals: (values: BudgetAllocatedTotals) => void;
  loadTotalBudget: () => number | null;
  saveTotalBudget: (value: number) => void;
  loadVisionApiKey: () => string | null;
  saveVisionApiKey: (value: string) => void;
  close: () => void;
};
```

Add to the returned object in `createBudgetStorage` (after `saveTotalBudget`):

```ts
    loadVisionApiKey: () => read().visionApiKey ?? null,
    saveVisionApiKey: (value) => write({ ...read(), visionApiKey: value || null }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/app && pnpm run build && node --test test/*.test.cjs`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/app/src/storage.ts apps/app/test/storage.test.cjs
git commit -m "feat(app): store vision API key alongside budget data"
```

---

### Task 2: Parse and validate the vision model's JSON response

**Files:**
- Create: `apps/app/src/aiVision.ts`
- Test: `apps/app/test/aiVision.test.cjs`

This task only covers the pure parsing/validation logic (no network call), so it can be fully unit tested.

- [ ] **Step 1: Write the failing test**

Create `apps/app/test/aiVision.test.cjs`:

```js
const assert = require("node:assert/strict");
const test = require("node:test");

const { parseAtrVisionResponse } = require("../dist/aiVision");

test("parses a well-formed JSON array response", () => {
  const text = 'Voici les valeurs: [{"section":"Vélocité","label":"Vitesse max (km/h)","v1":"312","moyenne":"305"}]';
  const result = parseAtrVisionResponse(text);
  assert.deepEqual(result, [
    { section: "Vélocité", label: "Vitesse max (km/h)", v1: "312", moyenne: "305" },
  ]);
});

test("fills missing v1/moyenne fields with empty strings", () => {
  const text = '[{"section":"Virage","label":"Faible vitesse","moyenne":"70"}]';
  const result = parseAtrVisionResponse(text);
  assert.deepEqual(result, [
    { section: "Virage", label: "Faible vitesse", v1: "", moyenne: "70" },
  ]);
});

test("drops entries missing a section or label", () => {
  const text = '[{"section":"Virage","v1":"70"},{"label":"Sans section","v1":"1"}]';
  const result = parseAtrVisionResponse(text);
  assert.deepEqual(result, []);
});

test("throws when no JSON array is present", () => {
  assert.throws(() => parseAtrVisionResponse("Désolé, je ne peux pas lire cette image."));
});

test("throws when the JSON array is malformed", () => {
  assert.throws(() => parseAtrVisionResponse("[{\"section\": \"Virage\", ]"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/app && pnpm run build && node --test test/*.test.cjs`
Expected: FAIL with `Cannot find module '../dist/aiVision'`

- [ ] **Step 3: Implement `parseAtrVisionResponse` and the shared row labels**

Create `apps/app/src/aiVision.ts`:

```ts
export type AtrVisionEntry = {
  section: string;
  label: string;
  v1: string;
  moyenne: string;
};

export const ATR_SECTIONS: { label: string; rows: string[] }[] = [
  { label: "Vélocité", rows: ["Vitesse max (km/h)", "Accélération", "Efficacité du DRS (%)"] },
  { label: "Virage", rows: ["Faible vitesse", "Vitesse moyenne", "Grande vitesse", "Tolérance Dirty air (%)"] },
  { label: "Composants", rows: ["Préservation des pneus", "Refroidissement du moteur", "Poids excédentaire totale (Kg)"] },
];

export function parseAtrVisionResponse(text: string): AtrVisionEntry[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Aucun tableau JSON trouvé dans la réponse du modèle.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("La réponse du modèle contient un JSON invalide.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("La réponse du modèle n'est pas un tableau.");
  }

  return parsed
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      section: typeof entry.section === "string" ? entry.section : "",
      label: typeof entry.label === "string" ? entry.label : "",
      v1: entry.v1 !== undefined && entry.v1 !== null ? String(entry.v1) : "",
      moyenne: entry.moyenne !== undefined && entry.moyenne !== null ? String(entry.moyenne) : "",
    }))
    .filter((entry) => entry.section !== "" && entry.label !== "");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/app && pnpm run build && node --test test/*.test.cjs`
Expected: PASS (7 tests total)

- [ ] **Step 5: Commit**

```bash
git add apps/app/src/aiVision.ts apps/app/test/aiVision.test.cjs
git commit -m "feat(app): parse and validate the ATR vision model response"
```

---

### Task 3: Call the Anthropic vision API

**Files:**
- Modify: `apps/app/package.json`
- Modify: `apps/app/src/aiVision.ts`

This step adds the network call. It is not covered by an automated test (it needs a real API key and network access) — it's validated manually in Task 7's verification step.

- [ ] **Step 1: Add the Anthropic SDK dependency**

Run: `pnpm add @anthropic-ai/sdk --filter @f1-manager/app`
Expected: `apps/app/package.json` gains a `@anthropic-ai/sdk` entry under `dependencies`, and `pnpm-lock.yaml` updates.

- [ ] **Step 2: Add the prompt builder and API call to `apps/app/src/aiVision.ts`**

Append to `apps/app/src/aiVision.ts`:

```ts
import Anthropic from "@anthropic-ai/sdk";

export function buildAtrVisionPrompt(): string {
  const sectionsDescription = ATR_SECTIONS
    .map((s) => `- ${s.label}: ${s.rows.join(", ")}`)
    .join("\n");

  return `Tu regardes une capture d'écran de l'écran de comparaison technique du jeu F1 Manager. Cet écran affiche, pour chaque caractéristique technique de la monoplace, deux valeurs numériques côte à côte : la valeur de la monoplace du joueur, et la valeur moyenne des concurrents.

Les caractéristiques attendues sont regroupées par section :
${sectionsDescription}

Lis les valeurs affichées sur la capture d'écran et renvoie UNIQUEMENT un tableau JSON (sans texte autour), avec une entrée par caractéristique trouvée, au format :
[{ "section": "<nom de la section>", "label": "<nom exact de la ligne>", "v1": "<valeur monoplace>", "moyenne": "<valeur concurrent>" }]

Si une valeur n'est pas visible ou lisible sur l'image, omets le champ correspondant plutôt que d'inventer une valeur.`;
}

export async function callAtrVisionApi(
  imageBase64: string,
  mediaType: string,
  apiKey: string,
): Promise<AtrVisionEntry[]> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType as "image/png", data: imageBase64 },
          },
          { type: "text", text: buildAtrVisionPrompt() },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Le modèle n'a renvoyé aucun texte exploitable.");
  }

  return parseAtrVisionResponse(textBlock.text);
}
```

- [ ] **Step 3: Typecheck**

Run: `cd apps/app && pnpm run typecheck`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/app/package.json apps/app/src/aiVision.ts pnpm-lock.yaml
git commit -m "feat(app): call the Anthropic vision API to extract ATR values"
```

---

### Task 4: Wire the IPC handlers and expose them to the renderer

**Files:**
- Modify: `apps/app/src/main.ts`
- Modify: `apps/app/src/preload.ts`
- Modify: `apps/web/src/vite-env.d.ts`

- [ ] **Step 1: Add IPC handlers in `apps/app/src/main.ts`**

Add the import at the top:

```ts
import { callAtrVisionApi } from './aiVision';
```

Add a new function after `registerBudgetHandlers`:

```ts
function registerAtrVisionHandlers(storage: BudgetStorage): void {
  ipcMain.handle('atr-vision-api-key:load', () => storage.loadVisionApiKey());
  ipcMain.handle('atr-vision-api-key:save', (_event, value: string) => {
    storage.saveVisionApiKey(value);
  });
  ipcMain.handle(
    'atr-vision:extract',
    async (_event, imageBase64: string, mediaType: string) => {
      const apiKey = storage.loadVisionApiKey();
      if (!apiKey) {
        throw new Error("Aucune clé API configurée. Ajoutez-en une dans Paramètres.");
      }
      return callAtrVisionApi(imageBase64, mediaType, apiKey);
    },
  );
}
```

In `app.whenReady()`, right after `registerBudgetHandlers(budgetStorage);`, add:

```ts
  registerAtrVisionHandlers(budgetStorage);
```

- [ ] **Step 2: Expose the handlers in `apps/app/src/preload.ts`**

Update the `contextBridge.exposeInMainWorld('app', { ... })` call, adding these two entries after `budgetTotalBudget`:

```ts
  atrVisionApiKey: {
    load: () => ipcRenderer.invoke('atr-vision-api-key:load'),
    save: (value: string) => ipcRenderer.invoke('atr-vision-api-key:save', value),
  },
  atrVision: {
    extract: (imageBase64: string, mediaType: string) =>
      ipcRenderer.invoke('atr-vision:extract', imageBase64, mediaType),
  },
```

- [ ] **Step 3: Update the renderer's `Window` type in `apps/web/src/vite-env.d.ts`**

Replace the file contents with:

```ts
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
```

- [ ] **Step 4: Typecheck both packages**

Run: `cd apps/app && pnpm run typecheck && cd ../web && pnpm run typecheck`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/app/src/main.ts apps/app/src/preload.ts apps/web/src/vite-env.d.ts
git commit -m "feat: wire IPC handlers for the vision API key and extraction call"
```

---

### Task 5: Add the API key field to Settings

**Files:**
- Modify: `apps/web/src/pages/settings/SettingsData.tsx`
- Modify: `apps/web/src/i18n/locales/fr/settings.json`
- Modify: `apps/web/src/i18n/locales/en/settings.json`

- [ ] **Step 1: Add the i18n keys**

In `apps/web/src/i18n/locales/fr/settings.json`, inside the `"data"` object, add (after `"saveNamePrefix": "Sauvegarde"`, remember to add a trailing comma there):

```json
    "aiVisionTitle": "IA Vision",
    "aiVisionApiKeyLabel": "Clé API IA (Vision)",
    "aiVisionApiKeyPlaceholder": "sk-ant-...",
    "aiVisionApiKeyHint": "Utilisée pour importer les valeurs du tableau ATR depuis une capture d'écran, sur la page Performance."
```

In `apps/web/src/i18n/locales/en/settings.json`, inside the `"data"` object, add the equivalent (after `"saveNamePrefix": "Save"`):

```json
    "aiVisionTitle": "AI Vision",
    "aiVisionApiKeyLabel": "AI Vision API key",
    "aiVisionApiKeyPlaceholder": "sk-ant-...",
    "aiVisionApiKeyHint": "Used to import ATR table values from a screenshot, on the Performance page."
```

- [ ] **Step 2: Add the field to `SettingsData.tsx`**

Add state and a load effect near the top of the component (after `const importRef = useRef<HTMLInputElement>(null);`):

```tsx
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const storage = window.app?.atrVisionApiKey;
    if (!storage) return;
    storage.load().then((value) => setApiKey(value ?? "")).catch(() => {});
  }, []);

  const handleApiKeyBlur = () => {
    void window.app?.atrVisionApiKey?.save(apiKey);
  };
```

Add `useEffect` to the import at the top of the file (it currently imports `{ useRef, useState }`):

```tsx
import { useEffect, useRef, useState } from "react";
```

Add a new block in the JSX, after the closing `</div>` of the "Reset" block and before the final closing `</div>` of the component:

```tsx
      {/* IA Vision */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t("data.aiVisionTitle")}
        </p>
        <label className="block mb-1 text-sm font-medium">{t("data.aiVisionApiKeyLabel")}</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onBlur={handleApiKeyBlur}
          placeholder={t("data.aiVisionApiKeyPlaceholder")}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-1">{t("data.aiVisionApiKeyHint")}</p>
      </div>
```

- [ ] **Step 3: Typecheck**

Run: `cd apps/web && pnpm run typecheck`
Expected: no errors

- [ ] **Step 4: Manual verification**

Run: `/run` (or `pnpm dev` from repo root), open Settings → Data tab, confirm the "IA Vision" field appears, type a value, tab away, reopen the app and confirm the value persisted (only meaningful when running inside Electron, not the plain browser dev server).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/settings/SettingsData.tsx apps/web/src/i18n/locales/fr/settings.json apps/web/src/i18n/locales/en/settings.json
git commit -m "feat(web): add vision API key field to Settings"
```

---

### Task 6: Add the pure merge function (with Vitest)

**Files:**
- Create: `apps/web/src/lib/atrVisionImport.ts`
- Test: `apps/web/src/lib/atrVisionImport.test.ts`
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`

`apps/web` has no test runner yet. This task adds Vitest (already the natural fit for a Vite project) solely to cover this pure logic.

- [ ] **Step 1: Add Vitest**

Run: `pnpm add -D vitest --filter @f1-manager/web`

Add to `apps/web/package.json` `"scripts"` (after `"typecheck": "tsc --noEmit",`):

```json
    "test": "vitest run",
```

- [ ] **Step 2: Add the Vitest config**

Create `apps/web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Write the failing test**

Create `apps/web/src/lib/atrVisionImport.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mergeAtrVisionEntries } from "./atrVisionImport";

const baseData = [
  {
    label: "Vélocité",
    rows: [
      { label: "Vitesse max (km/h)", v1: "300", moyenne: "290", delta: "", cd: "", deltaCD: "", gainsAttendus: "0" },
      { label: "Accélération", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "", gainsAttendus: "0" },
    ],
  },
];

describe("mergeAtrVisionEntries", () => {
  it("overwrites v1 and moyenne for matching section/label entries", () => {
    const result = mergeAtrVisionEntries(baseData, [
      { section: "Vélocité", label: "Vitesse max (km/h)", v1: "312", moyenne: "305" },
    ]);
    expect(result[0].rows[0].v1).toBe("312");
    expect(result[0].rows[0].moyenne).toBe("305");
  });

  it("leaves rows with no matching entry untouched", () => {
    const result = mergeAtrVisionEntries(baseData, [
      { section: "Vélocité", label: "Vitesse max (km/h)", v1: "312", moyenne: "305" },
    ]);
    expect(result[0].rows[1]).toEqual(baseData[0].rows[1]);
  });

  it("does not overwrite a field when the entry omits it", () => {
    const result = mergeAtrVisionEntries(baseData, [
      { section: "Vélocité", label: "Vitesse max (km/h)", v1: "312", moyenne: "" },
    ]);
    expect(result[0].rows[0].v1).toBe("312");
    expect(result[0].rows[0].moyenne).toBe("290");
  });

  it("ignores entries whose section/label do not match any row", () => {
    const result = mergeAtrVisionEntries(baseData, [
      { section: "Inconnue", label: "Rien", v1: "1", moyenne: "2" },
    ]);
    expect(result).toEqual(baseData);
  });

  it("does not mutate the input data", () => {
    const clone = structuredClone(baseData);
    mergeAtrVisionEntries(baseData, [
      { section: "Vélocité", label: "Vitesse max (km/h)", v1: "999", moyenne: "999" },
    ]);
    expect(baseData).toEqual(clone);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd apps/web && pnpm test`
Expected: FAIL — cannot find module `./atrVisionImport`

- [ ] **Step 5: Implement `mergeAtrVisionEntries`**

Create `apps/web/src/lib/atrVisionImport.ts`:

```ts
export type AtrVisionEntry = {
  section: string;
  label: string;
  v1?: string;
  moyenne?: string;
};

type AtrRow = {
  label: string;
  v1: string;
  moyenne: string;
  [key: string]: unknown;
};

type AtrSection = {
  label: string;
  rows: AtrRow[];
};

export function mergeAtrVisionEntries(
  data: AtrSection[],
  entries: AtrVisionEntry[],
): AtrSection[] {
  return data.map((section) => ({
    ...section,
    rows: section.rows.map((row) => {
      const match = entries.find(
        (entry) => entry.section === section.label && entry.label === row.label,
      );
      if (!match) return row;

      return {
        ...row,
        ...(match.v1 ? { v1: match.v1 } : {}),
        ...(match.moyenne ? { moyenne: match.moyenne } : {}),
      };
    }),
  }));
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd apps/web && pnpm test`
Expected: PASS (5 tests)

- [ ] **Step 7: Commit**

```bash
git add apps/web/package.json apps/web/vitest.config.ts apps/web/src/lib/atrVisionImport.ts apps/web/src/lib/atrVisionImport.test.ts pnpm-lock.yaml
git commit -m "feat(web): add pure merge function for imported ATR vision entries"
```

---

### Task 7: Add the import UI to the Performance page

**Files:**
- Modify: `apps/web/src/pages/PerformancePage.tsx`
- Modify: `apps/web/src/i18n/locales/fr/performance.json`
- Modify: `apps/web/src/i18n/locales/en/performance.json`

- [ ] **Step 1: Add the i18n keys**

In `apps/web/src/i18n/locales/fr/performance.json`, add (after `"noProjects": "Aucun projet de développement"`, adding a trailing comma there):

```json
  "importFromScreenshot": "Importer depuis capture d'écran",
  "importTitle": "Importer depuis capture d'écran",
  "importPasteHint": "Collez votre capture d'écran ici (Ctrl+V)",
  "importPastePlaceholder": "En attente d'une image collée…",
  "importAnalyze": "Analyser",
  "importAnalyzing": "Analyse en cours…",
  "importPreviewTitle": "Aperçu des valeurs extraites",
  "importApply": "Appliquer",
  "importNoEntries": "Aucune valeur n'a pu être extraite de cette image."
```

In `apps/web/src/i18n/locales/en/performance.json`, add the equivalent (after `"noProjects": "No development projects"`):

```json
  "importFromScreenshot": "Import from screenshot",
  "importTitle": "Import from screenshot",
  "importPasteHint": "Paste your screenshot here (Ctrl+V)",
  "importPastePlaceholder": "Waiting for a pasted image…",
  "importAnalyze": "Analyze",
  "importAnalyzing": "Analyzing…",
  "importPreviewTitle": "Preview of extracted values",
  "importApply": "Apply",
  "importNoEntries": "No values could be extracted from this image."
```

- [ ] **Step 2: Import the merge helper and its type in `PerformancePage.tsx`**

Add near the top imports:

```tsx
import { mergeAtrVisionEntries, type AtrVisionEntry } from "../lib/atrVisionImport";
```

- [ ] **Step 3: Add import state and handlers inside `AtrCalTable`**

In `AtrCalTable` (the component holding `data`/`setData`), add state right after the `update` function definition:

```tsx
  const [importOpen, setImportOpen] = useState(false);
  const [pastedImage, setPastedImage] = useState<{ base64: string; mediaType: string } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewEntries, setPreviewEntries] = useState<AtrVisionEntry[] | null>(null);

  const resetImportState = () => {
    setPastedImage(null);
    setImportLoading(false);
    setImportError(null);
    setPreviewEntries(null);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      setPastedImage({ base64, mediaType: item.type });
      setImportError(null);
      setPreviewEntries(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!pastedImage || !window.app?.atrVision) return;
    setImportLoading(true);
    setImportError(null);
    try {
      const entries = await window.app.atrVision.extract(pastedImage.base64, pastedImage.mediaType);
      setPreviewEntries(entries);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImportLoading(false);
    }
  };

  const updatePreviewEntry = (index: number, field: "v1" | "moyenne", value: string) => {
    setPreviewEntries((prev) =>
      prev ? prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)) : prev,
    );
  };

  const handleApplyImport = () => {
    if (!previewEntries) return;
    setData((prev) => mergeAtrVisionEntries(prev, previewEntries));
    setImportOpen(false);
    resetImportState();
  };
```

Add `useState` React import already present at file top (`import { useState, useEffect } from "react";`) — extend it to also cover what's used here (it already covers `useState`; no change needed since `useEffect` is unused in this block).

- [ ] **Step 4: Add the trigger button and dialog to `AtrCalTable`'s JSX**

In the header row of `AtrCalTable` (the `<div className="flex items-center justify-between mb-4">` block), add a button before the existing reset button:

```tsx
        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mr-4"
        >
          {t("importFromScreenshot")}
        </button>
```

Add the dialog just before the closing `</motion.div>` of `AtrCalTable`'s return:

```tsx
      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) resetImportState();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("importTitle")}</DialogTitle>
          </DialogHeader>

          {!previewEntries && (
            <>
              <div
                onPaste={handlePaste}
                tabIndex={0}
                className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground focus:border-primary outline-none"
              >
                {pastedImage ? (
                  <img
                    src={`data:${pastedImage.mediaType};base64,${pastedImage.base64}`}
                    alt=""
                    className="max-h-48 mx-auto rounded"
                  />
                ) : (
                  t("importPasteHint")
                )}
              </div>
              {importError && <p className="text-xs text-red-400">{importError}</p>}
              <DialogFooter>
                <Button
                  variant="primary"
                  disabled={!pastedImage || importLoading}
                  onClick={handleAnalyze}
                >
                  {importLoading ? t("importAnalyzing") : t("importAnalyze")}
                </Button>
              </DialogFooter>
            </>
          )}

          {previewEntries && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("importPreviewTitle")}
              </p>
              {previewEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("importNoEntries")}</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {previewEntries.map((entry, i) => (
                    <div key={`${entry.section}-${entry.label}`} className="grid grid-cols-3 gap-2 items-center text-xs">
                      <span className="text-muted-foreground truncate">{entry.label}</span>
                      <Input
                        type="number"
                        value={entry.v1 ?? ""}
                        onChange={(e) => updatePreviewEntry(i, "v1", e.target.value)}
                      />
                      <Input
                        type="number"
                        value={entry.moyenne ?? ""}
                        onChange={(e) => updatePreviewEntry(i, "moyenne", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
              <DialogFooter>
                <Button variant="secondary" onClick={resetImportState}>
                  {t("cancel")}
                </Button>
                <Button
                  variant="primary"
                  disabled={previewEntries.length === 0}
                  onClick={handleApplyImport}
                >
                  {t("importApply")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
```

- [ ] **Step 5: Typecheck**

Run: `cd apps/web && pnpm run typecheck`
Expected: no errors

- [ ] **Step 6: Manual verification**

Use the `run` skill to launch the Electron app, add a vision API key in Settings, open Performance, click "Importer depuis capture d'écran", paste a real screenshot of the F1 game's technical comparison screen, click "Analyser", confirm the preview shows plausible values, edit one value, click "Appliquer", and confirm the ATR table updates and persists after reload. Also verify the error path by testing with no API key configured (should show the "Ajoutez-en une dans Paramètres" message) and by pasting a non-relevant image (should show a low/empty extraction rather than crashing).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/PerformancePage.tsx apps/web/src/i18n/locales/fr/performance.json apps/web/src/i18n/locales/en/performance.json
git commit -m "feat(web): add screenshot import UI to the ATR table"
```

---

## Self-Review Notes

- **Spec coverage:** API key storage (Task 1), vision call + prompt (Tasks 2-3), IPC wiring (Task 4), Settings field (Task 5), preview-before-apply merge (Tasks 6-7), error handling for missing key/network/malformed JSON (Tasks 2, 4, 7), cost/perf (inherent — single on-demand call, no local model). Tests match the spec's stated scope: unit tests on parsing/merging, manual verification for the real API call.
- **Type consistency:** `AtrVisionEntry` is defined identically (`section`, `label`, `v1`, `moyenne`) in `apps/app/src/aiVision.ts` (main process) and `apps/web/src/lib/atrVisionImport.ts` (renderer) — they're separate packages with no shared build step, so this is an intentional, small duplication rather than a mismatch.
- **Scope:** Single feature, single plan. No unrelated refactors introduced beyond adding Vitest (needed because `apps/web` had zero test infrastructure and the spec requires unit tests on new pure logic).
