# Didacticiel de première visite (onboarding tour) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-launch guided "spotlight" tour that walks a new (or newly-updated) player through ~23 real UI elements across every page of the app, right after the existing `WelcomeDialog`, with skip/replay support.

**Architecture:** Pure step data (`tourSteps.ts`) + a pure `useReducer` state machine (`tourReducer.ts`) + pure geometry helpers (`tourPositioning.ts`) are unit-tested in isolation (matching the project's existing convention of testing only pure functions — there is no jsdom/`@testing-library` setup in this repo). A `TourProvider`/`useTour()` context wires the reducer to `localStorage`, and a `TourOverlay` component (rendered inside the router) navigates to each step's route, locates its target via a `data-tour-id` attribute, and renders a spotlight cutout + tooltip with `framer-motion`. `data-tour-id` attributes are added directly to the existing JSX across 9 page files.

**Tech Stack:** React, react-router-dom (`HashRouter`), react-i18next, framer-motion, vitest (unit tests for pure logic only).

**Design doc:** `docs/superpowers/specs/2026-08-25-onboarding-tour-design.md`

---

## File Structure

Create:
- `apps/web/src/lib/tourSteps.ts` — pure step data
- `apps/web/src/lib/tourSteps.test.ts`
- `apps/web/src/lib/tourReducer.ts` — pure state machine
- `apps/web/src/lib/tourReducer.test.ts`
- `apps/web/src/lib/tourPositioning.ts` — pure geometry helpers
- `apps/web/src/lib/tourPositioning.test.ts`
- `apps/web/src/lib/TourContext.tsx` — `TourProvider` / `useTour()`
- `apps/web/src/components/TourOverlay.tsx` — visual spotlight overlay
- `apps/web/src/i18n/locales/fr/tour.json`
- `apps/web/src/i18n/locales/en/tour.json`

Modify:
- `apps/web/src/i18n/index.ts` — register `tour` namespace
- `apps/web/src/app.tsx` — mount `TourProvider` + `TourOverlay`
- `apps/web/src/components/WelcomeDialog.tsx` — export `ONBOARDED_KEY`, start tour on submit
- `apps/web/src/components/Layout.tsx` — `data-tour-id="nav-sidebar"`
- `apps/web/src/pages/Dashboard.tsx` — 4 `data-tour-id`s
- `apps/web/src/pages/CalendarPage.tsx` — 2 `data-tour-id`s
- `apps/web/src/pages/BudgetPage.tsx` — 3 `data-tour-id`s
- `apps/web/src/pages/RDPage.tsx` — 3 `data-tour-id`s
- `apps/web/src/pages/PerformancePage.tsx` — 3 `data-tour-id`s
- `apps/web/src/pages/StockPage.tsx` — 2 `data-tour-id`s
- `apps/web/src/pages/StrategyPage.tsx` — 3 `data-tour-id`s
- `apps/web/src/pages/SettingsPage.tsx` — 1 `data-tour-id`
- `apps/web/src/pages/settings/SettingsData.tsx` — 1 `data-tour-id` + "Revoir le tutoriel" button
- `apps/web/src/i18n/locales/fr/settings.json`, `apps/web/src/i18n/locales/en/settings.json` — new `data.helpTitle`/`data.replayTour` keys

---

## Task 1: Tour step data (`tourSteps.ts`)

**Files:**
- Create: `apps/web/src/lib/tourSteps.ts`
- Test: `apps/web/src/lib/tourSteps.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/lib/tourSteps.test.ts
import { describe, expect, it } from "vitest";
import { tourSteps, TOUR_ROUTES } from "./tourSteps";

describe("tourSteps", () => {
  it("has 23 steps", () => {
    expect(tourSteps).toHaveLength(23);
  });

  it("has unique step ids", () => {
    const ids = tourSteps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique target ids", () => {
    const targetIds = tourSteps.map((s) => s.targetId);
    expect(new Set(targetIds).size).toBe(targetIds.length);
  });

  it("only references known routes", () => {
    for (const step of tourSteps) {
      expect(TOUR_ROUTES).toContain(step.path);
    }
  });

  it("has titleKey/bodyKey namespaced under steps.<id> and unique", () => {
    const titleKeys = tourSteps.map((s) => s.titleKey);
    const bodyKeys = tourSteps.map((s) => s.bodyKey);
    expect(new Set(titleKeys).size).toBe(titleKeys.length);
    expect(new Set(bodyKeys).size).toBe(bodyKeys.length);
    for (const step of tourSteps) {
      expect(step.titleKey).toMatch(/^steps\./);
      expect(step.bodyKey).toMatch(/^steps\./);
    }
  });

  it("keeps steps for the same page adjacent (no back-and-forth navigation)", () => {
    const seenPaths: string[] = [];
    for (const step of tourSteps) {
      if (seenPaths[seenPaths.length - 1] !== step.path) {
        expect(seenPaths).not.toContain(step.path);
        seenPaths.push(step.path);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/tourSteps.test.ts`
Expected: FAIL with "Failed to resolve import './tourSteps'" (file doesn't exist yet)

- [ ] **Step 3: Write the implementation**

```ts
// apps/web/src/lib/tourSteps.ts
export const TOUR_ROUTES = [
  "/",
  "/calendar",
  "/stock",
  "/performance",
  "/budget",
  "/rd",
  "/strategy",
  "/settings",
] as const;

export type TourRoute = typeof TOUR_ROUTES[number];

export type TourStep = {
  id: string;
  path: TourRoute;
  targetId: string;
  titleKey: string;
  bodyKey: string;
};

const step = (id: string, path: TourRoute): TourStep => ({
  id,
  path,
  targetId: id,
  titleKey: `steps.${toCamelCase(id)}.title`,
  bodyKey: `steps.${toCamelCase(id)}.body`,
});

function toCamelCase(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export const tourSteps: TourStep[] = [
  step("nav-sidebar", "/"),
  step("dashboard-stats", "/"),
  step("dashboard-deficits", "/"),
  step("dashboard-next-race", "/"),
  step("dashboard-stock", "/"),
  step("calendar-list", "/calendar"),
  step("calendar-race-card", "/calendar"),
  step("budget-stats", "/budget"),
  step("budget-cap-usage", "/budget"),
  step("budget-allocation", "/budget"),
  step("rd-create-project", "/rd"),
  step("rd-active-projects", "/rd"),
  step("rd-aero-table", "/rd"),
  step("performance-atr-table", "/performance"),
  step("performance-import-screenshot", "/performance"),
  step("performance-dev-plan", "/performance"),
  step("stock-coverage-chart", "/stock"),
  step("stock-pieces-grid", "/stock"),
  step("strategy-params", "/strategy"),
  step("strategy-ranking", "/strategy"),
  step("strategy-optimal", "/strategy"),
  step("settings-tabs", "/settings"),
  step("settings-saves", "/settings"),
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/tourSteps.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/tourSteps.ts apps/web/src/lib/tourSteps.test.ts
git commit -m "feat(web): add onboarding tour step data"
```

---

## Task 2: Tour state machine (`tourReducer.ts`)

**Files:**
- Create: `apps/web/src/lib/tourReducer.ts`
- Test: `apps/web/src/lib/tourReducer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/lib/tourReducer.test.ts
import { describe, expect, it } from "vitest";
import { initialTourState, tourReducer } from "./tourReducer";

describe("tourReducer", () => {
  it("starts inactive at step 0", () => {
    expect(initialTourState).toEqual({ active: false, stepIndex: 0 });
  });

  it("START activates the tour at step 0", () => {
    const state = tourReducer({ active: false, stepIndex: 5 }, { type: "START" });
    expect(state).toEqual({ active: true, stepIndex: 0 });
  });

  it("NEXT advances to the next step", () => {
    const state = tourReducer({ active: true, stepIndex: 0 }, { type: "NEXT", totalSteps: 3 });
    expect(state).toEqual({ active: true, stepIndex: 1 });
  });

  it("NEXT past the last step deactivates and resets to 0", () => {
    const state = tourReducer({ active: true, stepIndex: 2 }, { type: "NEXT", totalSteps: 3 });
    expect(state).toEqual({ active: false, stepIndex: 0 });
  });

  it("PREV moves back one step", () => {
    const state = tourReducer({ active: true, stepIndex: 2 }, { type: "PREV" });
    expect(state).toEqual({ active: true, stepIndex: 1 });
  });

  it("PREV never goes below 0", () => {
    const state = tourReducer({ active: true, stepIndex: 0 }, { type: "PREV" });
    expect(state).toEqual({ active: true, stepIndex: 0 });
  });

  it("SKIP deactivates and resets to step 0", () => {
    const state = tourReducer({ active: true, stepIndex: 4 }, { type: "SKIP" });
    expect(state).toEqual({ active: false, stepIndex: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/tourReducer.test.ts`
Expected: FAIL with "Failed to resolve import './tourReducer'"

- [ ] **Step 3: Write the implementation**

```ts
// apps/web/src/lib/tourReducer.ts
export type TourState = {
  active: boolean;
  stepIndex: number;
};

export type TourAction =
  | { type: "START" }
  | { type: "NEXT"; totalSteps: number }
  | { type: "PREV" }
  | { type: "SKIP" };

export const initialTourState: TourState = { active: false, stepIndex: 0 };

export function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case "START":
      return { active: true, stepIndex: 0 };
    case "NEXT": {
      const nextIndex = state.stepIndex + 1;
      if (nextIndex >= action.totalSteps) {
        return { active: false, stepIndex: 0 };
      }
      return { active: true, stepIndex: nextIndex };
    }
    case "PREV":
      return { active: state.active, stepIndex: Math.max(0, state.stepIndex - 1) };
    case "SKIP":
      return { active: false, stepIndex: 0 };
    default:
      return state;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/tourReducer.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/tourReducer.ts apps/web/src/lib/tourReducer.test.ts
git commit -m "feat(web): add pure onboarding tour state machine"
```

---

## Task 3: Spotlight geometry helpers (`tourPositioning.ts`)

**Files:**
- Create: `apps/web/src/lib/tourPositioning.ts`
- Test: `apps/web/src/lib/tourPositioning.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/lib/tourPositioning.test.ts
import { describe, expect, it } from "vitest";
import { computeSpotlightBox, computeTooltipPlacement } from "./tourPositioning";

describe("computeSpotlightBox", () => {
  it("pads the target rect on all sides", () => {
    const box = computeSpotlightBox({ top: 100, left: 50, width: 200, height: 40 });
    expect(box).toEqual({ top: 92, left: 42, width: 216, height: 56 });
  });
});

describe("computeTooltipPlacement", () => {
  it("places the tooltip below when there is enough space", () => {
    const placement = computeTooltipPlacement({ top: 100, left: 0, width: 100, height: 40 }, 800);
    expect(placement).toBe("bottom");
  });

  it("places the tooltip above when there is not enough space below", () => {
    const placement = computeTooltipPlacement({ top: 700, left: 0, width: 100, height: 40 }, 800);
    expect(placement).toBe("top");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/tourPositioning.test.ts`
Expected: FAIL with "Failed to resolve import './tourPositioning'"

- [ ] **Step 3: Write the implementation**

```ts
// apps/web/src/lib/tourPositioning.ts
export type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const SPOTLIGHT_PADDING = 8;
const MIN_SPACE_BELOW = 200;

export function computeSpotlightBox(rect: Rect): Rect {
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
}

export type TooltipPlacement = "top" | "bottom";

export function computeTooltipPlacement(rect: Rect, viewportHeight: number): TooltipPlacement {
  const spaceBelow = viewportHeight - (rect.top + rect.height);
  return spaceBelow < MIN_SPACE_BELOW ? "top" : "bottom";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/tourPositioning.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/tourPositioning.ts apps/web/src/lib/tourPositioning.test.ts
git commit -m "feat(web): add pure spotlight geometry helpers"
```

---

## Task 4: i18n `tour` namespace

**Files:**
- Create: `apps/web/src/i18n/locales/fr/tour.json`
- Create: `apps/web/src/i18n/locales/en/tour.json`
- Modify: `apps/web/src/i18n/index.ts`

- [ ] **Step 1: Create the French translations**

```json
// apps/web/src/i18n/locales/fr/tour.json
{
  "stepIndicator": "Étape {{current}} / {{total}}",
  "next": "Suivant",
  "previous": "Précédent",
  "skip": "Passer",
  "finish": "Terminer",
  "steps": {
    "navSidebar": {
      "title": "Votre menu principal",
      "body": "Retrouvez ici toutes les pages de gestion de votre écurie : calendrier, budget, R&D, performance, stock et stratégie."
    },
    "dashboardStats": {
      "title": "Vue d'ensemble",
      "body": "Le nombre de courses de la saison et le pourcentage de budget déjà utilisé, en un coup d'œil."
    },
    "dashboardDeficits": {
      "title": "Points faibles de la voiture",
      "body": "Les trois écarts de performance les plus importants par rapport à la concurrence, à corriger en priorité."
    },
    "dashboardNextRace": {
      "title": "Prochaine course",
      "body": "Le nom, le circuit, le type et la stratégie recommandée pour votre prochaine échéance."
    },
    "dashboardStock": {
      "title": "État des stocks",
      "body": "Un résumé de la santé de votre stock de pièces : ce qui est en bon état, en alerte ou critique."
    },
    "calendarList": {
      "title": "Calendrier de la saison",
      "body": "La liste complète des courses de la saison. Vous pouvez la réorganiser par glisser-déposer."
    },
    "calendarRaceCard": {
      "title": "Détail d'une course",
      "body": "Cochez une course une fois terminée, et repérez son type (Rapide, Équilibre, Déportance, Test) grâce au badge coloré."
    },
    "budgetStats": {
      "title": "Suivi du budget",
      "body": "Le plafond budgétaire, le montant dépensé et le solde restant. Cliquez sur le plafond pour le modifier."
    },
    "budgetCapUsage": {
      "title": "Utilisation du budget",
      "body": "Une jauge visuelle du pourcentage de votre plafond déjà consommé."
    },
    "budgetAllocation": {
      "title": "Répartition par poste",
      "body": "Le détail des dépenses et allocations par poste budgétaire, modifiable et dépliable."
    },
    "rdCreateProject": {
      "title": "Lancer un projet R&D",
      "body": "Choisissez une pièce de la voiture pour démarrer un nouveau projet de développement."
    },
    "rdActiveProjects": {
      "title": "Projets en cours",
      "body": "Suivez l'avancement, le coût et les gains attendus de chacun de vos projets R&D actifs."
    },
    "rdAeroTable": {
      "title": "Tableau aérodynamique",
      "body": "Les statistiques détaillées par pièce : valeur de base, gains, objectif et écart restant."
    },
    "performanceAtrTable": {
      "title": "Tableau de calibration ATR",
      "body": "Comparez les statistiques de votre voiture à celles de la concurrence, section par section."
    },
    "performanceImportScreenshot": {
      "title": "Import par capture d'écran",
      "body": "Collez une capture d'écran de vos données ATR : l'IA les extrait et pré-remplit le tableau pour vous."
    },
    "performanceDevPlan": {
      "title": "Plan de développement",
      "body": "La liste de vos projets de développement en cours et leur impact attendu sur l'ATR."
    },
    "stockCoverageChart": {
      "title": "Couverture du stock",
      "body": "Comparez visuellement votre stock disponible à la capacité nécessaire pour la saison."
    },
    "stockPiecesGrid": {
      "title": "Détail par pièce",
      "body": "Ajustez le nombre de pièces en stock, leur durée de vie et leur coût unitaire."
    },
    "strategyParams": {
      "title": "Paramètres de course",
      "body": "Renseignez le nombre de tours, la perte au stand et les données de dégradation de chaque pneu."
    },
    "strategyRanking": {
      "title": "Classement des stratégies",
      "body": "Toutes les stratégies de pneus viables, classées par temps total estimé."
    },
    "strategyOptimal": {
      "title": "Stratégie optimale",
      "body": "La meilleure stratégie calculée pour cette course, avec le détail des arrêts au stand."
    },
    "settingsTabs": {
      "title": "Paramètres",
      "body": "Personnalisez l'apparence, votre profil, vos données, la navigation et la langue de l'application."
    },
    "settingsSaves": {
      "title": "Sauvegardes",
      "body": "Créez, renommez, exportez ou importez plusieurs emplacements de sauvegarde de votre partie."
    }
  }
}
```

- [ ] **Step 2: Create the English translations**

```json
// apps/web/src/i18n/locales/en/tour.json
{
  "stepIndicator": "Step {{current}} / {{total}}",
  "next": "Next",
  "previous": "Previous",
  "skip": "Skip",
  "finish": "Finish",
  "steps": {
    "navSidebar": {
      "title": "Your main menu",
      "body": "Every page for managing your team lives here: calendar, budget, R&D, performance, stock and strategy."
    },
    "dashboardStats": {
      "title": "Overview",
      "body": "The number of races this season and the percentage of your budget already spent, at a glance."
    },
    "dashboardDeficits": {
      "title": "Car weak points",
      "body": "The three biggest performance gaps versus the competition, worth fixing first."
    },
    "dashboardNextRace": {
      "title": "Next race",
      "body": "The name, circuit, type and recommended strategy for your next upcoming race."
    },
    "dashboardStock": {
      "title": "Stock status",
      "body": "A summary of your parts stock health: what's fine, what's low, and what's critical."
    },
    "calendarList": {
      "title": "Season calendar",
      "body": "The full list of races for the season. You can reorder it by dragging."
    },
    "calendarRaceCard": {
      "title": "Race details",
      "body": "Check off a race once it's done, and spot its type (Fast, Balanced, Downforce, Test) via the colored badge."
    },
    "budgetStats": {
      "title": "Budget tracking",
      "body": "Your budget cap, the amount spent, and what's left. Click the cap to edit it."
    },
    "budgetCapUsage": {
      "title": "Budget usage",
      "body": "A visual gauge of how much of your cap has been used."
    },
    "budgetAllocation": {
      "title": "Breakdown by section",
      "body": "The detail of spending and allocation per budget section, editable and expandable."
    },
    "rdCreateProject": {
      "title": "Start an R&D project",
      "body": "Pick a car part to start a new development project."
    },
    "rdActiveProjects": {
      "title": "Active projects",
      "body": "Track the progress, cost and expected gains of each of your active R&D projects."
    },
    "rdAeroTable": {
      "title": "Aerodynamic table",
      "body": "Detailed per-part stats: base value, gains, target and remaining gap."
    },
    "performanceAtrTable": {
      "title": "ATR calibration table",
      "body": "Compare your car's stats to the competition, section by section."
    },
    "performanceImportScreenshot": {
      "title": "Import from a screenshot",
      "body": "Paste a screenshot of your ATR data: the AI extracts it and pre-fills the table for you."
    },
    "performanceDevPlan": {
      "title": "Development plan",
      "body": "The list of your ongoing development projects and their expected impact on the ATR."
    },
    "stockCoverageChart": {
      "title": "Stock coverage",
      "body": "Visually compare your available stock to what the season requires."
    },
    "stockPiecesGrid": {
      "title": "Per-part detail",
      "body": "Adjust the stock count, lifespan and unit cost for each part."
    },
    "strategyParams": {
      "title": "Race parameters",
      "body": "Set the lap count, pit stop loss, and the degradation data for each tire compound."
    },
    "strategyRanking": {
      "title": "Strategy ranking",
      "body": "Every viable tire strategy, ranked by estimated total time."
    },
    "strategyOptimal": {
      "title": "Optimal strategy",
      "body": "The best computed strategy for this race, with its pit stop breakdown."
    },
    "settingsTabs": {
      "title": "Settings",
      "body": "Customize the appearance, your profile, your data, navigation and the app's language."
    },
    "settingsSaves": {
      "title": "Saves",
      "body": "Create, rename, export or import multiple save slots for your game."
    }
  }
}
```

- [ ] **Step 3: Register the namespace**

In `apps/web/src/i18n/index.ts`, add the imports next to the existing `terms` imports:

```ts
import termsFr from "./locales/fr/terms.json";
import tourFr from "./locales/fr/tour.json";
```

```ts
import termsEn from "./locales/en/terms.json";
import tourEn from "./locales/en/tour.json";
```

And add `tour: tourFr` / `tour: tourEn` to the `resources` object:

```ts
const resources = {
  fr: {
    common: commonFr, layout: layoutFr, settings: settingsFr, welcome: welcomeFr,
    dashboard: dashboardFr, staff: staffFr, budget: budgetFr, calendar: calendarFr,
    performance: performanceFr, rd: rdFr, stock: stockFr, strategy: strategyFr,
    notfound: notfoundFr, terms: termsFr, tour: tourFr,
  },
  en: {
    common: commonEn, layout: layoutEn, settings: settingsEn, welcome: welcomeEn,
    dashboard: dashboardEn, staff: staffEn, budget: budgetEn, calendar: calendarEn,
    performance: performanceEn, rd: rdEn, stock: stockEn, strategy: strategyEn,
    notfound: notfoundEn, terms: termsEn, tour: tourEn,
  },
};
```

- [ ] **Step 4: Verify the JSON parses and typecheck passes**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/i18n/locales/fr/tour.json apps/web/src/i18n/locales/en/tour.json apps/web/src/i18n/index.ts
git commit -m "feat(web): add tour i18n namespace"
```

---

## Task 5: `TourContext` (provider + `useTour`)

**Files:**
- Create: `apps/web/src/lib/onboardingKeys.ts`
- Create: `apps/web/src/lib/TourContext.tsx`
- Modify: `apps/web/src/components/WelcomeDialog.tsx` (use the shared key)

`WelcomeDialog.tsx` will need to import `useTour` from `TourContext.tsx`, and `TourContext.tsx` needs to read the "onboarded" localStorage key. Putting the key constant in `WelcomeDialog.tsx` and importing it from `TourContext.tsx` would create a circular import between the two files, so it's extracted into its own tiny module instead.

- [ ] **Step 1: Create the shared key module**

```ts
// apps/web/src/lib/onboardingKeys.ts
export const ONBOARDED_KEY = "goldie-racing:onboarded";
```

- [ ] **Step 2: Use it from `WelcomeDialog.tsx`**

In `apps/web/src/components/WelcomeDialog.tsx`, change:

```ts
const SAVES_KEY = "goldie_saves";
const ONBOARDED_KEY = "goldie-racing:onboarded";
```

to:

```ts
import { ONBOARDED_KEY } from "@/lib/onboardingKeys";

const SAVES_KEY = "goldie_saves";
```

(place the `import` near the top with the other imports, not inline where the old `const` was)

- [ ] **Step 3: Create `TourContext.tsx`**

```tsx
// apps/web/src/lib/TourContext.tsx
import { createContext, useContext, useEffect, useReducer, ReactNode } from "react";
import { initialTourState, tourReducer } from "./tourReducer";
import { tourSteps, type TourStep } from "./tourSteps";
import { ONBOARDED_KEY } from "./onboardingKeys";

export const TOUR_COMPLETED_KEY = "goldie-racing:tour-completed";

type TourContextValue = {
  active: boolean;
  currentStep: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

function markCompleted() {
  try {
    window.localStorage.setItem(TOUR_COMPLETED_KEY, "true");
  } catch {}
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tourReducer, initialTourState);

  const start = () => dispatch({ type: "START" });

  const next = () => {
    if (state.stepIndex + 1 >= tourSteps.length) markCompleted();
    dispatch({ type: "NEXT", totalSteps: tourSteps.length });
  };

  const prev = () => dispatch({ type: "PREV" });

  const skip = () => {
    markCompleted();
    dispatch({ type: "SKIP" });
  };

  useEffect(() => {
    try {
      const onboarded = window.localStorage.getItem(ONBOARDED_KEY) === "true";
      const toured = window.localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
      if (onboarded && !toured) start();
    } catch {}
    // Only ever runs once, on mount — new users are started explicitly by
    // WelcomeDialog's submit handler instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = state.active ? tourSteps[state.stepIndex] ?? null : null;

  return (
    <TourContext.Provider
      value={{
        active: state.active,
        currentStep,
        stepIndex: state.stepIndex,
        totalSteps: tourSteps.length,
        start,
        next,
        prev,
        skip,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) throw new Error("useTour must be used within TourProvider");
  return context;
}
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors (this task has no automated tests — it's thin React wiring around the already-tested `tourReducer`, consistent with how the rest of the app's contexts, e.g. `AtrContext.tsx`, are untested)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/onboardingKeys.ts apps/web/src/lib/TourContext.tsx apps/web/src/components/WelcomeDialog.tsx
git commit -m "feat(web): add TourProvider and useTour hook"
```

---

## Task 6: Start the tour from `WelcomeDialog`

**Files:**
- Modify: `apps/web/src/components/WelcomeDialog.tsx`

- [ ] **Step 1: Call `start()` after onboarding**

Add the import:

```ts
import { useTour } from "@/lib/TourContext";
```

Add the hook call alongside the other hooks:

```ts
  const { setTeamName: setProfileTeamName } = useProfile();
  const { sections, totalBudget } = useBudget();
  const { done } = useRace();
  const { atrData } = useAtr();
  const { start: startTour } = useTour();
```

And call it right after `setOpen(false)` in `handleSubmit`:

```ts
    localStorage.setItem(ONBOARDED_KEY, "true");
    setOpen(false);
    startTour();
  };
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/WelcomeDialog.tsx
git commit -m "feat(web): start onboarding tour after WelcomeDialog submit"
```

---

## Task 7: `TourOverlay` component

**Files:**
- Create: `apps/web/src/components/TourOverlay.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/TourOverlay.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTour } from "@/lib/TourContext";
import { computeSpotlightBox, computeTooltipPlacement, type Rect } from "@/lib/tourPositioning";

export default function TourOverlay() {
  const { active, currentStep, stepIndex, totalSteps, next, prev, skip } = useTour();
  const { t } = useTranslation("tour");
  const location = useLocation();
  const navigate = useNavigate();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  // Navigate to the step's page.
  useEffect(() => {
    if (!active || !currentStep) return;
    if (location.pathname !== currentStep.path) {
      navigate(currentStep.path);
    }
  }, [active, currentStep, location.pathname, navigate]);

  // Locate the target element once we're on the right page.
  useEffect(() => {
    if (!active || !currentStep) {
      setTargetRect(null);
      return;
    }
    if (location.pathname !== currentStep.path) {
      setTargetRect(null);
      return;
    }

    let frame: number;
    const locate = () => {
      const el = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
      if (!el) {
        frame = requestAnimationFrame(locate);
        return;
      }
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      const rect = el.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    frame = requestAnimationFrame(locate);
    return () => cancelAnimationFrame(frame);
  }, [active, currentStep, location.pathname]);

  // Escape closes the tour.
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, skip]);

  if (!active || !currentStep || !targetRect) return null;

  const spotlight = computeSpotlightBox(targetRect);
  const placement = computeTooltipPlacement(targetRect, window.innerHeight);
  const isLastStep = stepIndex + 1 === totalSteps;

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={(e) => e.stopPropagation()} />
      <motion.div
        className="fixed z-[101] rounded-lg pointer-events-none"
        style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)" }}
        animate={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      />
      <motion.div
        key={currentStep.id}
        initial={{ opacity: 0, y: placement === "bottom" ? -8 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed z-[102] w-[320px] bg-card border border-border rounded-xl p-4 shadow-xl"
        style={{
          top: placement === "bottom" ? spotlight.top + spotlight.height + 12 : undefined,
          bottom: placement === "top" ? window.innerHeight - spotlight.top + 12 : undefined,
          left: Math.min(Math.max(spotlight.left, 16), window.innerWidth - 336),
        }}
      >
        <p className="text-xs font-mono text-primary mb-1">
          {t("stepIndicator", { current: stepIndex + 1, total: totalSteps })}
        </p>
        <h3 className="text-sm font-semibold text-foreground mb-1">{t(currentStep.titleKey)}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t(currentStep.bodyKey)}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={skip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("skip")}
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                onClick={prev}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-secondary transition-colors"
              >
                {t("previous")}
              </button>
            )}
            <button
              onClick={next}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isLastStep ? t("finish") : t("next")}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors (no automated test — this is a purely visual component exercised manually in Task 17)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/TourOverlay.tsx
git commit -m "feat(web): add TourOverlay spotlight component"
```

---

## Task 8: Wire `TourProvider` + `TourOverlay` into `app.tsx`

**Files:**
- Modify: `apps/web/src/app.tsx`

- [ ] **Step 1: Add the imports**

```tsx
import WelcomeDialog from './components/WelcomeDialog';
import { TourProvider } from './lib/TourContext';
import TourOverlay from './components/TourOverlay';
```

- [ ] **Step 2: Wrap `TourProvider` around the router/dialog tree and render `TourOverlay` inside `<Router>`**

Replace:

```tsx
                <AtrProvider>
                  <QueryClientProvider client={queryClientInstance}>
                    <Router>
                      <Routes>
                        <Route element={<Layout />}>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/calendar" element={<CalendarPage />} />
                          <Route path="/stock" element={<StockPage />} />
                          <Route path="/performance" element={<PerformancePage />} />
                          <Route path="/budget" element={<BudgetPage />} />
                          <Route path="/rd" element={<RDPage />} />
                          <Route path="/strategy" element={<StrategyPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="*" element={<PageNotFound />} />
                        </Route>
                      </Routes>
                    </Router>
                    <Toaster />
                    <WelcomeDialog />
                  </QueryClientProvider>
                </AtrProvider>
```

with:

```tsx
                <AtrProvider>
                  <TourProvider>
                    <QueryClientProvider client={queryClientInstance}>
                      <Router>
                        <Routes>
                          <Route element={<Layout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/calendar" element={<CalendarPage />} />
                            <Route path="/stock" element={<StockPage />} />
                            <Route path="/performance" element={<PerformancePage />} />
                            <Route path="/budget" element={<BudgetPage />} />
                            <Route path="/rd" element={<RDPage />} />
                            <Route path="/strategy" element={<StrategyPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="*" element={<PageNotFound />} />
                          </Route>
                        </Routes>
                        <TourOverlay />
                      </Router>
                      <Toaster />
                      <WelcomeDialog />
                    </QueryClientProvider>
                  </TourProvider>
                </AtrProvider>
```

- [ ] **Step 3: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app.tsx
git commit -m "feat(web): mount TourProvider and TourOverlay in the app tree"
```

---

## Task 9: Sidebar target (`Layout.tsx`)

**Files:**
- Modify: `apps/web/src/components/Layout.tsx`

- [ ] **Step 1: Add `data-tour-id="nav-sidebar"` to the desktop nav**

Replace:

```tsx
        <nav className="flex-1 p-4 space-y-1">
          <NavList
            items={orderedItems}
            activePath={location.pathname}
            isEditMode={false}
            droppableId="desktop-nav"
            onReorder={reorder}
            onItemClick={undefined}
          />
        </nav>
```

with:

```tsx
        <nav data-tour-id="nav-sidebar" className="flex-1 p-4 space-y-1">
          <NavList
            items={orderedItems}
            activePath={location.pathname}
            isEditMode={false}
            droppableId="desktop-nav"
            onReorder={reorder}
            onItemClick={undefined}
          />
        </nav>
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/Layout.tsx
git commit -m "feat(web): add tour target to sidebar nav"
```

---

## Task 10: Dashboard targets

**Files:**
- Modify: `apps/web/src/pages/Dashboard.tsx`

- [ ] **Step 1: `dashboard-stats` on the Stats Row**

Replace:

```tsx
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard label={t("races")} value="23" icon={FlagIcon} />
        <StatCard label={t("budgetUsed")} value={budgetPercent + "%"} icon={WalletIcon} />
      </div>
```

with:

```tsx
      {/* Stats Row */}
      <div data-tour-id="dashboard-stats" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard label={t("races")} value="23" icon={FlagIcon} />
        <StatCard label={t("budgetUsed")} value={budgetPercent + "%"} icon={WalletIcon} />
      </div>
```

- [ ] **Step 2: `dashboard-deficits` on the Top 3 Déficits block**

Replace:

```tsx
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-8"
        >
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t("topDeficits")}
          </h3>
```

with:

```tsx
        <motion.div
          data-tour-id="dashboard-deficits"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-8"
        >
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t("topDeficits")}
          </h3>
```

- [ ] **Step 3: `dashboard-next-race` on the Next Race Banner**

Replace:

```tsx
      {/* Next Race Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-primary/10 via-card to-accent/10 border border-primary/20 rounded-xl p-6 mb-8"
      >
```

with:

```tsx
      {/* Next Race Banner */}
      <motion.div
        data-tour-id="dashboard-next-race"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-primary/10 via-card to-accent/10 border border-primary/20 rounded-xl p-6 mb-8"
      >
```

- [ ] **Step 4: `dashboard-stock` on the Stock Summary**

Replace:

```tsx
      {/* Stock Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <div className="flex items-center gap-2 mb-5">
```

with:

```tsx
      {/* Stock Summary */}
      <motion.div
        data-tour-id="dashboard-stock"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <div className="flex items-center gap-2 mb-5">
```

- [ ] **Step 5: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/Dashboard.tsx
git commit -m "feat(web): add tour targets to Dashboard"
```

---

## Task 11: Calendar targets

**Files:**
- Modify: `apps/web/src/pages/CalendarPage.tsx`

- [ ] **Step 1: `calendar-list` on the race list container**

Replace:

```tsx
      <div className="space-y-3">
        {races.map((race, i) => {
```

with:

```tsx
      <div data-tour-id="calendar-list" className="space-y-3">
        {races.map((race, i) => {
```

- [ ] **Step 2: `calendar-race-card` on the first race card**

Replace:

```tsx
            <motion.div
              key={race.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              onDragEnter={() => handleDragEnter(i)}
              onDragLeave={() => handleDragLeave(i)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(i)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-card border rounded-xl p-4 md:p-5 transition-all group ${
                done[race.id] ? 'border-green-500/30 opacity-60' : 'border-border hover:border-primary/20'
              } ${dragIndex === i ? 'opacity-60 bg-primary/10' : ''} ${dragOverIndex === i ? 'border-dashed border-primary/60 bg-primary/5' : ''}`}
            >
```

with:

```tsx
            <motion.div
              key={race.id}
              data-tour-id={i === 0 ? "calendar-race-card" : undefined}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              onDragEnter={() => handleDragEnter(i)}
              onDragLeave={() => handleDragLeave(i)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(i)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-card border rounded-xl p-4 md:p-5 transition-all group ${
                done[race.id] ? 'border-green-500/30 opacity-60' : 'border-border hover:border-primary/20'
              } ${dragIndex === i ? 'opacity-60 bg-primary/10' : ''} ${dragOverIndex === i ? 'border-dashed border-primary/60 bg-primary/5' : ''}`}
            >
```

- [ ] **Step 3: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/CalendarPage.tsx
git commit -m "feat(web): add tour targets to Calendar page"
```

---

## Task 12: Budget targets

**Files:**
- Modify: `apps/web/src/pages/BudgetPage.tsx`

- [ ] **Step 1: `budget-stats` on the Stats grid**

Replace:

```tsx
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors">
```

with:

```tsx
      {/* Stats */}
      <div data-tour-id="budget-stats" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors">
```

- [ ] **Step 2: `budget-cap-usage` on the Progress Bar block**

Replace:

```tsx
      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">{t("capUsage")}</span>
```

with:

```tsx
      {/* Progress Bar */}
      <motion.div
        data-tour-id="budget-cap-usage"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">{t("capUsage")}</span>
```

- [ ] **Step 3: `budget-allocation` on the Allocation Detail table**

Replace:

```tsx
        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold mb-4">{t("allocationDetail")}</h3>
```

with:

```tsx
        {/* Table */}
        <motion.div
          data-tour-id="budget-allocation"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold mb-4">{t("allocationDetail")}</h3>
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/BudgetPage.tsx
git commit -m "feat(web): add tour targets to Budget page"
```

---

## Task 13: R&D targets

**Files:**
- Modify: `apps/web/src/pages/RDPage.tsx`

- [ ] **Step 1: `rd-create-project` on the create-project toolbar**

Replace:

```tsx
      <div className="flex items-center gap-3 mt-8 mb-6">
        <DropdownMenu>
```

with:

```tsx
      <div data-tour-id="rd-create-project" className="flex items-center gap-3 mt-8 mb-6">
        <DropdownMenu>
```

- [ ] **Step 2: `rd-active-projects` on the active projects grid**

Replace:

```tsx
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actifs.map((project, i) => {
```

with:

```tsx
          <div data-tour-id="rd-active-projects" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actifs.map((project, i) => {
```

- [ ] **Step 3: `rd-aero-table` on the aerodynamic table section**

Replace:

```tsx
      {/* ── Aerodynamic Performance Table ─────────────────────────────────────── */}
      <div className="mt-12">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
          {t("aeroPerformance")}
```

with:

```tsx
      {/* ── Aerodynamic Performance Table ─────────────────────────────────────── */}
      <div data-tour-id="rd-aero-table" className="mt-12">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
          {t("aeroPerformance")}
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/RDPage.tsx
git commit -m "feat(web): add tour targets to R&D page"
```

---

## Task 14: Performance targets

**Files:**
- Modify: `apps/web/src/pages/PerformancePage.tsx`

- [ ] **Step 1: `performance-dev-plan` on the Development Projects section**

Replace:

```tsx
      {/* Development Projects */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
          {t("developmentPlan")}
        </h2>
```

with:

```tsx
      {/* Development Projects */}
      <div data-tour-id="performance-dev-plan" className="mt-8">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
          {t("developmentPlan")}
        </h2>
```

- [ ] **Step 2: `performance-import-screenshot` on the import button**

Replace:

```tsx
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mr-4"
          >
            {t("importFromScreenshot")}
          </button>
```

with:

```tsx
          <button
            data-tour-id="performance-import-screenshot"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mr-4"
          >
            {t("importFromScreenshot")}
          </button>
```

- [ ] **Step 3: `performance-atr-table` on the ATR calibration table wrapper**

Replace:

```tsx
      <div className="mt-8">
        <AtrCalTable data={atrData} setData={setAtrData} title={t("calibrationTitle")} />
      </div>
```

with:

```tsx
      <div data-tour-id="performance-atr-table" className="mt-8">
        <AtrCalTable data={atrData} setData={setAtrData} title={t("calibrationTitle")} />
      </div>
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/PerformancePage.tsx
git commit -m "feat(web): add tour targets to Performance page"
```

---

## Task 15: Stock targets

**Files:**
- Modify: `apps/web/src/pages/StockPage.tsx`

- [ ] **Step 1: `stock-coverage-chart` on the Chart block**

Replace:

```tsx
      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <h3 className="text-sm font-semibold mb-4">{t("coverageChart")}</h3>
```

with:

```tsx
      {/* Chart */}
      <motion.div
        data-tour-id="stock-coverage-chart"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <h3 className="text-sm font-semibold mb-4">{t("coverageChart")}</h3>
```

- [ ] **Step 2: `stock-pieces-grid` on the Pieces Grid**

Replace:

```tsx
      {/* Pieces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stock.map((item, i) => {
```

with:

```tsx
      {/* Pieces Grid */}
      <div data-tour-id="stock-pieces-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stock.map((item, i) => {
```

- [ ] **Step 3: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/StockPage.tsx
git commit -m "feat(web): add tour targets to Stock page"
```

---

## Task 16: Strategy targets

**Files:**
- Modify: `apps/web/src/pages/StrategyPage.tsx`

- [ ] **Step 1: `strategy-optimal` on the optimal strategy banner**

Replace:

```tsx
      {best && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
            {t("optimalStrategy")}
          </p>
```

with:

```tsx
      {best && (
        <div data-tour-id="strategy-optimal" className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
            {t("optimalStrategy")}
          </p>
```

- [ ] **Step 2: `strategy-params` on the two-column params/tire-data grid**

Replace:

```tsx
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Colonne gauche : Course, Convertisseur, Classement */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {t("raceParams")}
            </h3>
```

with:

```tsx
      <div data-tour-id="strategy-params" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Colonne gauche : Course, Convertisseur, Classement */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {t("raceParams")}
            </h3>
```

- [ ] **Step 3: `strategy-ranking` on the Classement block**

Replace:

```tsx
          {/* Classement */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("ranking", { count: strategies.length })}
              </h3>
```

with:

```tsx
          {/* Classement */}
          <div data-tour-id="strategy-ranking" className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("ranking", { count: strategies.length })}
              </h3>
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/StrategyPage.tsx
git commit -m "feat(web): add tour targets to Strategy page"
```

---

## Task 17: Settings targets + replay button

**Files:**
- Modify: `apps/web/src/pages/SettingsPage.tsx`
- Modify: `apps/web/src/pages/settings/SettingsData.tsx`
- Modify: `apps/web/src/i18n/locales/fr/settings.json`
- Modify: `apps/web/src/i18n/locales/en/settings.json`

- [ ] **Step 1: `settings-tabs` on the tab bar**

In `apps/web/src/pages/SettingsPage.tsx`, replace:

```tsx
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-8 mt-6">
```

with:

```tsx
      {/* Tab bar */}
      <div data-tour-id="settings-tabs" className="flex gap-1 border-b border-border mb-8 mt-6">
```

- [ ] **Step 2: `settings-saves` on the save slots section**

In `apps/web/src/pages/settings/SettingsData.tsx`, replace:

```tsx
      {/* Sauvegardes */}
      <div>
        <div className="flex items-center justify-between mb-3">
```

with:

```tsx
      {/* Sauvegardes */}
      <div data-tour-id="settings-saves">
        <div className="flex items-center justify-between mb-3">
```

- [ ] **Step 3: Add `data.helpTitle` / `data.replayTour` translation keys**

In `apps/web/src/i18n/locales/fr/settings.json`, inside the `"data"` object, add after `"aiVisionApiKeyHint"`:

```json
    "aiVisionApiKeyHint": "Utilisée pour importer les valeurs du tableau ATR depuis une capture d'écran, sur la page Performance.",
    "helpTitle": "Aide",
    "replayTour": "🔄 Revoir le tutoriel"
```

In `apps/web/src/i18n/locales/en/settings.json`, inside the `"data"` object, add after `"aiVisionApiKeyHint"`:

```json
    "aiVisionApiKeyHint": "Used to import ATR table values from a screenshot, on the Performance page.",
    "helpTitle": "Help",
    "replayTour": "🔄 Replay the tutorial"
```

- [ ] **Step 4: Add the replay button to `SettingsData.tsx`**

Add the import:

```tsx
import { useTour } from "@/lib/TourContext";
```

Add the hook call alongside the others:

```tsx
export default function SettingsData() {
  const { t } = useTranslation("settings");
  const { teamName, setTeamName } = useProfile();
  const { sections, totalBudget, reset: resetBudget } = useBudget();
  const { done, reset: resetRace } = useRace();
  const { atrData, reset: resetAtr } = useAtr();
  const { start: startTour } = useTour();
  const [slots, setSlots] = useState<SaveSlotData[]>(loadSlots);
```

Add a new "Aide" section right after the "IA Vision" section, before the closing `</div>`:

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

      {/* Aide */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t("data.helpTitle")}
        </p>
        <button
          onClick={startTour}
          className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition-colors"
        >
          {t("data.replayTour")}
        </button>
      </div>
    </div>
  );
}
```

(This replaces the old final `</div>\n  );\n}` at the end of the file.)

- [ ] **Step 5: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/SettingsPage.tsx apps/web/src/pages/settings/SettingsData.tsx apps/web/src/i18n/locales/fr/settings.json apps/web/src/i18n/locales/en/settings.json
git commit -m "feat(web): add tour target to Settings and a replay-tour button"
```

---

## Task 18: Full test suite + manual verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit test suite**

Run: `cd apps/web && npx vitest run`
Expected: all tests pass, including the 3 new tour test files

- [ ] **Step 2: Run the full typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Start the dev server**

Run: `cd apps/web && npm run dev`

- [ ] **Step 4: Manually verify the new-user flow in the browser**

1. Open the app in a fresh browser profile (or run `localStorage.clear()` in devtools then reload).
2. The `WelcomeDialog` appears — fill in a save name and team name, submit.
3. The tour should start immediately on the Dashboard: a spotlight highlights the sidebar, with a tooltip and "Suivant"/"Passer" controls.
4. Click "Suivant" repeatedly through all Dashboard steps, then confirm it navigates to `/calendar`, `/budget`, `/rd`, `/performance`, `/stock`, `/strategy`, `/settings` in order, highlighting the right element on each page.
5. On the last step ("Sauvegardes" in Settings), confirm the button reads "Terminer" and clicking it closes the overlay.
6. Reload the page — confirm the tour does **not** restart (localStorage `goldie-racing:tour-completed` is `"true"`).
7. Go to Settings → Données, click "🔄 Revoir le tutoriel" — confirm the tour restarts from the Dashboard.
8. Start the tour again and press "Passer" partway through — confirm it closes immediately and does not reopen on reload.
9. Press Escape while the tour is active — confirm it closes the same way as "Passer".
10. Switch the language to English (Settings → Langue) and replay the tour — confirm all step text is in English.

- [ ] **Step 5: Simulate an existing (pre-tour) user**

1. In devtools: `localStorage.setItem("goldie-racing:onboarded", "true"); localStorage.removeItem("goldie-racing:tour-completed");`
2. Reload the app.
3. Confirm the tour auto-starts on the Dashboard **without** the `WelcomeDialog` reappearing.

- [ ] **Step 6: No commit for this task** (verification only — if any issue is found, fix it in the relevant task above and amend that commit's changes with a new commit)

---

## Self-Review Notes

- **Spec coverage:** every section of the design doc maps to a task — mechanics (Tasks 1, 2, 5, 6, 7, 8), the 23-step content table (Tasks 1, 4, 9–17), persistence/replay (Tasks 5, 17), i18n (Task 4).
- **Type consistency:** `TourStep`, `TourState`, `TourAction`, and the `useTour()` return shape are defined once (Tasks 1, 2, 5) and reused as-is in Tasks 6, 7, 17 — no renamed fields across tasks.
- **No placeholders:** every step shows exact code/diffs; the manual verification task (18) is explicitly scoped as non-automatable UI verification, consistent with this repo's existing test coverage (pure functions only, no jsdom).
