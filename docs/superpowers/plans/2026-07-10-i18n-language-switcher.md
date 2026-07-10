# Sélecteur de langue (i18n) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working FR/EN language switcher to the Settings page and translate all UI chrome across the app using react-i18next.

**Architecture:** `react-i18next` + `i18next-browser-languagedetector`, initialized once in `apps/web/src/i18n/index.ts` and imported before render in `main.tsx`. Translation strings live in namespaced JSON files under `apps/web/src/i18n/locales/{fr,en}/*.json`. Each page/component calls `useTranslation('<namespace>')` and replaces hardcoded French strings with `t('key')`. Language choice persists to `localStorage` (key `goldie-racing:language`) via the detector; changing language calls `i18n.changeLanguage()` and re-renders instantly, no reload.

**Tech Stack:** React 18, TypeScript, Vite, react-i18next, i18next, i18next-browser-languagedetector.

**Scope note:** Per user decision, technical/business-logic labels that double as data keys or comparison values (R&D piece names like "Châssis", aero parameter names like "Réduction traînée", Performance radar subjects like "Vitesse Max", and all `lib/f1Data` content — calendar, staff, stock) stay hardcoded in French. Only UI chrome (titles, buttons, dialogs, generic labels, nav) is translated. This avoids breaking existing localStorage saves and business-logic string comparisons (e.g. `piece === "Châssis"`).

---

### Task 1: Install i18n dependencies

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install packages**

Run:
```bash
cd "apps/web" && npm install i18next react-i18next i18next-browser-languagedetector
```

- [ ] **Step 2: Verify install**

Run: `node -e "require('e:/Documents/Projet perso/goldie-racing/apps/web/node_modules/i18next/package.json')"`
Expected: no error (package resolves).

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json
git commit -m "chore: add react-i18next dependencies"
```

---

### Task 2: i18n bootstrap (config + empty locale files)

**Files:**
- Create: `apps/web/src/i18n/index.ts`
- Create: `apps/web/src/i18n/locales/fr/common.json`, `layout.json`, `settings.json`, `welcome.json`, `dashboard.json`, `staff.json`, `budget.json`, `calendar.json`, `performance.json`, `rd.json`, `stock.json`, `strategy.json`, `notfound.json`
- Create: same 13 files under `apps/web/src/i18n/locales/en/`
- Modify: `apps/web/src/main.tsx`

- [ ] **Step 1: Create the 26 empty namespace files**

Each of the 13 fr files and 13 en files starts as:
```json
{}
```
Paths (fr): `apps/web/src/i18n/locales/fr/common.json`, `.../layout.json`, `.../settings.json`, `.../welcome.json`, `.../dashboard.json`, `.../staff.json`, `.../budget.json`, `.../calendar.json`, `.../performance.json`, `.../rd.json`, `.../stock.json`, `.../strategy.json`, `.../notfound.json`.
Paths (en): same filenames under `apps/web/src/i18n/locales/en/`.

They are filled in with real content task-by-task below (each later task edits its own namespace's fr and en file). Creating them empty now lets `i18n/index.ts` import all 26 upfront without missing-module errors.

- [ ] **Step 2: Write `apps/web/src/i18n/index.ts`**

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonFr from "./locales/fr/common.json";
import layoutFr from "./locales/fr/layout.json";
import settingsFr from "./locales/fr/settings.json";
import welcomeFr from "./locales/fr/welcome.json";
import dashboardFr from "./locales/fr/dashboard.json";
import staffFr from "./locales/fr/staff.json";
import budgetFr from "./locales/fr/budget.json";
import calendarFr from "./locales/fr/calendar.json";
import performanceFr from "./locales/fr/performance.json";
import rdFr from "./locales/fr/rd.json";
import stockFr from "./locales/fr/stock.json";
import strategyFr from "./locales/fr/strategy.json";
import notfoundFr from "./locales/fr/notfound.json";

import commonEn from "./locales/en/common.json";
import layoutEn from "./locales/en/layout.json";
import settingsEn from "./locales/en/settings.json";
import welcomeEn from "./locales/en/welcome.json";
import dashboardEn from "./locales/en/dashboard.json";
import staffEn from "./locales/en/staff.json";
import budgetEn from "./locales/en/budget.json";
import calendarEn from "./locales/en/calendar.json";
import performanceEn from "./locales/en/performance.json";
import rdEn from "./locales/en/rd.json";
import stockEn from "./locales/en/stock.json";
import strategyEn from "./locales/en/strategy.json";
import notfoundEn from "./locales/en/notfound.json";

const resources = {
  fr: {
    common: commonFr, layout: layoutFr, settings: settingsFr, welcome: welcomeFr,
    dashboard: dashboardFr, staff: staffFr, budget: budgetFr, calendar: calendarFr,
    performance: performanceFr, rd: rdFr, stock: stockFr, strategy: strategyFr,
    notfound: notfoundFr,
  },
  en: {
    common: commonEn, layout: layoutEn, settings: settingsEn, welcome: welcomeEn,
    dashboard: dashboardEn, staff: staffEn, budget: budgetEn, calendar: calendarEn,
    performance: performanceEn, rd: rdEn, stock: stockEn, strategy: strategyEn,
    notfound: notfoundEn,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    ns: Object.keys(resources.fr),
    defaultNS: "common",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "goldie-racing:language",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
    debug: import.meta.env.DEV,
  });

export default i18n;
```

- [ ] **Step 3: Import the config before render in `apps/web/src/main.tsx`**

```ts
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app'
import '@/i18n'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
```

- [ ] **Step 4: Verify the app still boots**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors (empty `{}` JSON namespaces typecheck fine since `resources` is inferred as `Record<string, {}>`).

Run: `cd "apps/web" && npm run dev` (then stop it once the Vite server prints "ready" with no console errors), or `npm run build` for a non-interactive check.
Expected: build succeeds, no i18next warnings about missing namespaces.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/i18n apps/web/src/main.tsx
git commit -m "feat: bootstrap i18next with fr/en namespaces"
```

---

### Task 3: Navigation & Layout translation

**Files:**
- Modify: `apps/web/src/lib/NavOrderContext.tsx`
- Modify: `apps/web/src/components/NavList.tsx`
- Modify: `apps/web/src/components/Layout.tsx`
- Modify: `apps/web/src/i18n/locales/fr/layout.json`, `apps/web/src/i18n/locales/en/layout.json`

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/layout.json`**

```json
{
  "appTitle": "F1 Manager",
  "mobileTitle": "GOLDIE F1",
  "betaVersion": "Beta Version 1.8.1",
  "nav": {
    "dashboard": "Dashboard",
    "calendar": "Calendrier",
    "stock": "Stock Pièces",
    "performance": "Performance",
    "budget": "Budget",
    "rd": "R&D",
    "strategy": "Stratégie",
    "settings": "Paramètres"
  }
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/layout.json`**

```json
{
  "appTitle": "F1 Manager",
  "mobileTitle": "GOLDIE F1",
  "betaVersion": "Beta Version 1.8.1",
  "nav": {
    "dashboard": "Dashboard",
    "calendar": "Calendar",
    "stock": "Parts Stock",
    "performance": "Performance",
    "budget": "Budget",
    "rd": "R&D",
    "strategy": "Strategy",
    "settings": "Settings"
  }
}
```

- [ ] **Step 3: Switch nav items to translation keys in `apps/web/src/lib/NavOrderContext.tsx`**

Replace lines 15-29:
```ts
export const settingsNavItem = {
  path: "/settings",
  icon: Cog6ToothIcon,
  labelKey: "nav.settings",
};

const navItemsSource = [
  { path: "/", icon: Squares2X2Icon, labelKey: "nav.dashboard" },
  { path: "/calendar", icon: CalendarDaysIcon, labelKey: "nav.calendar" },
  { path: "/stock", icon: CubeIcon, labelKey: "nav.stock" },
  { path: "/performance", icon: ChartBarIcon, labelKey: "nav.performance" },
  { path: "/budget", icon: WalletIcon, labelKey: "nav.budget" },
  { path: "/rd", icon: BeakerIcon, labelKey: "nav.rd" },
  { path: "/strategy", icon: FlagIcon, labelKey: "nav.strategy" },
];
```
(Only the `label:` → `labelKey:` rename per entry; nothing else in this file changes — `mergeOrder`, `loadStoredOrder`, `reorder`, etc. keep working since they operate on `path`.)

- [ ] **Step 4: Render translated labels in `apps/web/src/components/NavList.tsx`**

Add the import at the top:
```jsx
import { useTranslation } from "react-i18next";
```

Add inside the component, first line of the function body:
```jsx
export default function NavList({
  items,
  activePath,
  isEditMode,
  droppableId,
  onReorder,
  onItemClick,
}) {
  const { t } = useTranslation("layout");
  const handleDragEnd = result => {
```

Replace the draggable-mode label (`{item.label}` inside the `Draggable` render, currently line 35) with:
```jsx
                      {t(item.labelKey)}
```

Replace the normal-mode label (`{item.label}` inside the `Link`, currently line 64) with:
```jsx
            {t(item.labelKey)}
```

- [ ] **Step 5: Translate `apps/web/src/components/Layout.tsx`**

Add the import:
```jsx
import { useTranslation } from "react-i18next";
```

Add inside `Layout()`, alongside the existing hooks:
```jsx
  const { t } = useTranslation("layout");
```

Replace `<h1 className="text-lg font-bold text-primary tracking-tight">F1 Manager</h1>` with:
```jsx
            <h1 className="text-lg font-bold text-primary tracking-tight">{t("appTitle")}</h1>
```

Replace both occurrences of `{settingsItem.label}` (desktop sidebar link and mobile nav link) with:
```jsx
            {t(settingsItem.labelKey)}
```

Replace `<span className="font-bold text-primary">GOLDIE F1</span>` with:
```jsx
            <span className="font-bold text-primary">{t("mobileTitle")}</span>
```

Replace `<p>Beta Version 1.8.1</p>` with:
```jsx
            <p>{t("betaVersion")}</p>
```

- [ ] **Step 6: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Manual check**

Run: `cd "apps/web" && npm run dev`, open the app, confirm the sidebar nav labels, app title, and "Paramètres" link still render correctly in French (default/system-detected language). Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/lib/NavOrderContext.tsx apps/web/src/components/NavList.tsx apps/web/src/components/Layout.tsx apps/web/src/i18n/locales/fr/layout.json apps/web/src/i18n/locales/en/layout.json
git commit -m "feat: translate navigation and layout chrome"
```

---

### Task 4: Settings pages + language switcher

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/settings.json`, `apps/web/src/i18n/locales/en/settings.json`
- Modify: `apps/web/src/pages/SettingsPage.tsx`
- Modify: `apps/web/src/pages/settings/SettingsAppearance.tsx`
- Modify: `apps/web/src/pages/settings/SettingsProfile.tsx`
- Modify: `apps/web/src/pages/settings/SettingsData.tsx`
- Modify: `apps/web/src/pages/settings/SettingsNavigation.tsx`
- Create: `apps/web/src/pages/settings/SettingsLanguage.tsx`

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/settings.json`**

```json
{
  "title": "Paramètres",
  "subtitle": "Personnalise l'application",
  "tabs": {
    "appearance": "🎨 Apparence",
    "profile": "🏎️ Profil",
    "data": "💾 Données",
    "navigation": "🧭 Navigation",
    "language": "🌐 Langue"
  },
  "appearance": {
    "theme": "Thème",
    "themeDark": "🌙 Sombre",
    "themeLight": "☀️ Clair",
    "themeSystem": "💻 Système",
    "accentColor": "Couleur d'accent",
    "font": "Police",
    "fontColorLabel": "Couleur",
    "fontColorTitle": "Couleur du texte",
    "preview": "Aperçu — F1 Manager 2023 · Goldie Racing",
    "backgroundImage": "Image de fond",
    "changeImage": "Changer l'image",
    "dropImage": "Clique ou glisse une image",
    "opacity": "Opacité",
    "blur": "Flou",
    "matchAccent": "🎨 Matcher la couleur d'accent",
    "removeImage": "🗑️ Supprimer",
    "fontFamilies": {
      "inter": "Inter (défaut)",
      "robotoMono": "Roboto Mono",
      "spaceGrotesk": "Space Grotesk",
      "orbitron": "Orbitron",
      "rajdhani": "Rajdhani",
      "georgia": "Georgia",
      "system": "Système"
    },
    "fontSizes": {
      "xs": "Très petite — 11px",
      "sm": "Petite — 13px",
      "md": "Normale — 15px",
      "lg": "Grande — 17px",
      "xl": "Très grande — 20px"
    }
  },
  "profile": {
    "teamName": "Nom de l'équipe",
    "teamNamePlaceholder": "Goldie Racing",
    "activeSeason": "Saison active"
  },
  "data": {
    "saves": "Sauvegardes ({{count}}/{{max}})",
    "importJson": "Importer JSON",
    "newSave": "+ Nouvelle sauvegarde",
    "noSaves": "Aucune sauvegarde. Crée-en une !",
    "resetTitle": "Réinitialisation",
    "resetBudgetLabel": "Reset Budget",
    "resetBudgetDesc": "Remet toutes les dépenses et allocations à zéro.",
    "resetRaceLabel": "Reset Courses",
    "resetRaceDesc": "Décoche toutes les courses marquées comme terminées.",
    "resetAtrLabel": "Reset ATR",
    "resetAtrDesc": "Efface toutes les valeurs du tableau ATR.",
    "resetArrow": "Réinitialiser →",
    "resetIrreversible": "Cette action est irréversible.",
    "confirm": "Confirmer",
    "cancel": "Annuler",
    "invalidFile": "Fichier JSON invalide.",
    "importedSuffix": " (importé)",
    "saveNamePrefix": "Sauvegarde"
  },
  "navigation": {
    "order": "Ordre des pages",
    "hint": "Glisse les pages pour réorganiser la navigation.",
    "finish": "Terminer",
    "edit": "Modifier l'ordre"
  },
  "language": {
    "title": "Langue",
    "fr": "Français",
    "en": "English"
  }
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/settings.json`**

```json
{
  "title": "Settings",
  "subtitle": "Customize the application",
  "tabs": {
    "appearance": "🎨 Appearance",
    "profile": "🏎️ Profile",
    "data": "💾 Data",
    "navigation": "🧭 Navigation",
    "language": "🌐 Language"
  },
  "appearance": {
    "theme": "Theme",
    "themeDark": "🌙 Dark",
    "themeLight": "☀️ Light",
    "themeSystem": "💻 System",
    "accentColor": "Accent color",
    "font": "Font",
    "fontColorLabel": "Color",
    "fontColorTitle": "Text color",
    "preview": "Preview — F1 Manager 2023 · Goldie Racing",
    "backgroundImage": "Background image",
    "changeImage": "Change image",
    "dropImage": "Click or drop an image",
    "opacity": "Opacity",
    "blur": "Blur",
    "matchAccent": "🎨 Match accent color",
    "removeImage": "🗑️ Remove",
    "fontFamilies": {
      "inter": "Inter (default)",
      "robotoMono": "Roboto Mono",
      "spaceGrotesk": "Space Grotesk",
      "orbitron": "Orbitron",
      "rajdhani": "Rajdhani",
      "georgia": "Georgia",
      "system": "System"
    },
    "fontSizes": {
      "xs": "Extra small — 11px",
      "sm": "Small — 13px",
      "md": "Normal — 15px",
      "lg": "Large — 17px",
      "xl": "Extra large — 20px"
    }
  },
  "profile": {
    "teamName": "Team name",
    "teamNamePlaceholder": "Goldie Racing",
    "activeSeason": "Active season"
  },
  "data": {
    "saves": "Saves ({{count}}/{{max}})",
    "importJson": "Import JSON",
    "newSave": "+ New save",
    "noSaves": "No saves yet. Create one!",
    "resetTitle": "Reset",
    "resetBudgetLabel": "Reset Budget",
    "resetBudgetDesc": "Resets all spending and allocations to zero.",
    "resetRaceLabel": "Reset Races",
    "resetRaceDesc": "Unchecks all races marked as completed.",
    "resetAtrLabel": "Reset ATR",
    "resetAtrDesc": "Clears all values in the ATR table.",
    "resetArrow": "Reset →",
    "resetIrreversible": "This action is irreversible.",
    "confirm": "Confirm",
    "cancel": "Cancel",
    "invalidFile": "Invalid JSON file.",
    "importedSuffix": " (imported)",
    "saveNamePrefix": "Save"
  },
  "navigation": {
    "order": "Page order",
    "hint": "Drag pages to reorder the navigation.",
    "finish": "Done",
    "edit": "Edit order"
  },
  "language": {
    "title": "Language",
    "fr": "Français",
    "en": "English"
  }
}
```

- [ ] **Step 3: Rewrite `apps/web/src/pages/SettingsPage.tsx`**

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/PageHeader";
import SettingsAppearance from "./settings/SettingsAppearance";
import SettingsProfile from "./settings/SettingsProfile";
import SettingsData from "./settings/SettingsData";
import SettingsNavigation from "./settings/SettingsNavigation";
import SettingsLanguage from "./settings/SettingsLanguage";

const TABS = [
  { id: "appearance", labelKey: "tabs.appearance" },
  { id: "profile", labelKey: "tabs.profile" },
  { id: "data", labelKey: "tabs.data" },
  { id: "navigation", labelKey: "tabs.navigation" },
  { id: "language", labelKey: "tabs.language" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SettingsPage() {
  const { t } = useTranslation("settings");
  const [activeTab, setActiveTab] = useState<TabId>("appearance");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-8 mt-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "appearance" && <SettingsAppearance />}
      {activeTab === "profile" && <SettingsProfile />}
      {activeTab === "data" && <SettingsData />}
      {activeTab === "navigation" && <SettingsNavigation />}
      {activeTab === "language" && <SettingsLanguage />}
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `apps/web/src/pages/settings/SettingsAppearance.tsx`**

Replace lines 1-22 (imports + `FONT_FAMILIES`/`FONT_SIZES` constants) with:
```tsx
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/ThemeContext";
import { useAppearance } from "@/lib/AppearanceContext";
import ColorPicker from "@/components/ColorPicker";

const FONT_FAMILIES = [
  { labelKey: "appearance.fontFamilies.inter", value: "Inter, sans-serif" },
  { labelKey: "appearance.fontFamilies.robotoMono", value: "'Roboto Mono', monospace" },
  { labelKey: "appearance.fontFamilies.spaceGrotesk", value: "'Space Grotesk', sans-serif" },
  { labelKey: "appearance.fontFamilies.orbitron", value: "'Orbitron', sans-serif" },
  { labelKey: "appearance.fontFamilies.rajdhani", value: "'Rajdhani', sans-serif" },
  { labelKey: "appearance.fontFamilies.georgia", value: "Georgia, serif" },
  { labelKey: "appearance.fontFamilies.system", value: "system-ui, sans-serif" },
];

const FONT_SIZES = [
  { labelKey: "appearance.fontSizes.xs", value: "11px" },
  { labelKey: "appearance.fontSizes.sm", value: "13px" },
  { labelKey: "appearance.fontSizes.md", value: "15px" },
  { labelKey: "appearance.fontSizes.lg", value: "17px" },
  { labelKey: "appearance.fontSizes.xl", value: "20px" },
];
```

In `export default function SettingsAppearance()`, add right after the existing hooks (after the `useAppearance()` destructure):
```tsx
  const { t } = useTranslation("settings");
```

Then apply these replacements in the JSX (each is a direct string swap):
- `Thème` → `{t("appearance.theme")}`
- `{t === "dark" ? "🌙 Sombre" : t === "light" ? "☀️ Clair" : "💻 Système"}` → rename the map variable to avoid shadowing `t` from `useTranslation`: change `{(["dark", "light", "system"] as const).map((t) => (` to `{(["dark", "light", "system"] as const).map((themeOption) => (`, update `key={t}` → `key={themeOption}`, `onClick={() => setTheme(t)}` → `onClick={() => setTheme(themeOption)}`, the className ternary `theme === t` → `theme === themeOption`, and the label to:
```tsx
              {themeOption === "dark" ? t("appearance.themeDark") : themeOption === "light" ? t("appearance.themeLight") : t("appearance.themeSystem")}
```
- `Couleur d'accent` → `{t("appearance.accentColor")}`
- `Police` → `{t("appearance.font")}`
- `{FONT_FAMILIES.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}` → `{FONT_FAMILIES.map((f) => (<option key={f.value} value={f.value}>{t(f.labelKey)}</option>))}`
- `{FONT_SIZES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}` → `{FONT_SIZES.map((s) => (<option key={s.value} value={s.value}>{t(s.labelKey)}</option>))}`
- `title="Couleur du texte"` → `title={t("appearance.fontColorTitle")}`
- `<span className="text-xs text-muted-foreground">Couleur</span>` → `<span className="text-xs text-muted-foreground">{t("appearance.fontColorLabel")}</span>`
- `Aperçu — F1 Manager 2023 · Goldie Racing` → `{t("appearance.preview")}`
- `Image de fond` → `{t("appearance.backgroundImage")}`
- `{bgImage ? "Changer l'image" : "Clique ou glisse une image"}` → `{bgImage ? t("appearance.changeImage") : t("appearance.dropImage")}`
- `Opacité` → `{t("appearance.opacity")}`
- `Flou` → `{t("appearance.blur")}`
- `🎨 Matcher la couleur d'accent` → `{t("appearance.matchAccent")}`
- `🗑️ Supprimer` → `{t("appearance.removeImage")}`

- [ ] **Step 5: Rewrite `apps/web/src/pages/settings/SettingsProfile.tsx`**

```tsx
import { useTranslation } from "react-i18next";
import { useProfile } from "@/lib/ProfileContext";

const SEASONS = ["2023", "2024", "2025"];

export default function SettingsProfile() {
  const { t } = useTranslation("settings");
  const { teamName, setTeamName, season, setSeason } = useProfile();

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
          {t("profile.teamName")}
        </label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
          placeholder={t("profile.teamNamePlaceholder")}
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
          {t("profile.activeSeason")}
        </label>
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="bg-card border border-border rounded-lg text-sm text-foreground px-3 py-2 outline-none cursor-pointer"
        >
          {SEASONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Edit `apps/web/src/pages/settings/SettingsData.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Add inside `SettingsData()`, first line:
```tsx
export default function SettingsData() {
  const { t } = useTranslation("settings");
```

Replace the save-name template (currently ``name: `Sauvegarde ${new Date().toLocaleDateString("fr-FR")}`,``) with:
```tsx
      name: `${t("data.saveNamePrefix")} ${new Date().toLocaleDateString("fr-FR")}`,
```

Replace ``name: `${slot.name} (importé)`,`` with:
```tsx
        name: `${slot.name}${t("data.importedSuffix")}`,
```

Replace `alert("Fichier JSON invalide.");` with:
```tsx
        alert(t("data.invalidFile"));
```

Replace the "Sauvegardes (…)" header:
```tsx
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("data.saves", { count: slots.length, max: MAX_SLOTS })}
          </p>
```

Replace `Importer JSON` → `{t("data.importJson")}`, `+ Nouvelle sauvegarde` → `{t("data.newSave")}`, `Aucune sauvegarde. Crée-en une !` → `{t("data.noSaves")}`, `Réinitialisation` → `{t("data.resetTitle")}`.

Replace the reset-actions array:
```tsx
          {[
            { label: t("data.resetBudgetLabel"), action: resetBudget, desc: t("data.resetBudgetDesc") },
            { label: t("data.resetRaceLabel"), action: resetRace, desc: t("data.resetRaceDesc") },
            { label: t("data.resetAtrLabel"), action: resetAtr, desc: t("data.resetAtrDesc") },
          ].map(({ label, action, desc }) => (
```

Replace `Réinitialiser →` → `{t("data.resetArrow")}`, ``{desc} Cette action est irréversible.`` → `` {`${desc} ${t("data.resetIrreversible")}`} ``, `Annuler` → `{t("data.cancel")}`, `Confirmer` → `{t("data.confirm")}`.

- [ ] **Step 7: Rewrite `apps/web/src/pages/settings/SettingsNavigation.tsx`**

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavOrder } from "@/lib/NavOrderContext";
import NavList from "@/components/NavList";
import { PencilIcon } from "@heroicons/react/24/outline";

export default function SettingsNavigation() {
  const { t } = useTranslation("settings");
  const { orderedItems, reorder } = useNavOrder();
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{t("navigation.order")}</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {t("navigation.hint")}
        </p>
        <div className="flex flex-col gap-1">
          <NavList
            items={orderedItems}
            activePath=""
            isEditMode={isEditMode}
            droppableId="settings-nav"
            onReorder={reorder}
            onItemClick={undefined}
          />
        </div>
      </div>
      <button
        onClick={() => setIsEditMode((p) => !p)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-fit ${
          isEditMode
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
      >
        <PencilIcon className="w-3.5 h-3.5" />
        {isEditMode ? t("navigation.finish") : t("navigation.edit")}
      </button>
    </div>
  );
}
```

- [ ] **Step 8: Create `apps/web/src/pages/settings/SettingsLanguage.tsx`**

```tsx
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "fr", flag: "🇫🇷", labelKey: "language.fr" },
  { code: "en", flag: "🇬🇧", labelKey: "language.en" },
] as const;

export default function SettingsLanguage() {
  const { t, i18n } = useTranslation("settings");

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t("language.title")}
        </p>
        <div className="flex gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`px-5 py-2 rounded-lg text-sm font-medium border transition-all ${
                i18n.resolvedLanguage === lang.code
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {lang.flag} {t(lang.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 10: Manual check**

Run: `cd "apps/web" && npm run dev`. Go to Paramètres, confirm 5 tabs render, click the new "🌐 Langue" tab, click "🇬🇧 English" — confirm the Settings page (title, tabs, all 4 other tabs' content) switches to English instantly, and switching back to "🇫🇷 Français" restores French. Reload the page and confirm English (or whichever was picked) persists. Stop the dev server.

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/i18n/locales/fr/settings.json apps/web/src/i18n/locales/en/settings.json apps/web/src/pages/SettingsPage.tsx apps/web/src/pages/settings/
git commit -m "feat: translate settings pages and add language switcher"
```

---

### Task 5: Shared components (common namespace) + WelcomeDialog

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/common.json`, `apps/web/src/i18n/locales/en/common.json`
- Modify: `apps/web/src/i18n/locales/fr/welcome.json`, `apps/web/src/i18n/locales/en/welcome.json`
- Modify: `apps/web/src/components/StatCard.tsx`
- Modify: `apps/web/src/components/SaveSlot.tsx`
- Modify: `apps/web/src/components/WelcomeDialog.tsx`

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/common.json`**

```json
{
  "reset": {
    "button": "Tout réinitialiser",
    "confirm": "Confirmer la réinitialisation",
    "cancel": "Annuler"
  },
  "saveSlot": {
    "load": "Charger",
    "rename": "Renommer",
    "export": "Exporter JSON",
    "delete": "Supprimer"
  },
  "statCard": {
    "competitor": "Concurrent"
  }
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/common.json`**

```json
{
  "reset": {
    "button": "Reset All",
    "confirm": "Confirm Reset",
    "cancel": "Cancel"
  },
  "saveSlot": {
    "load": "Load",
    "rename": "Rename",
    "export": "Export JSON",
    "delete": "Delete"
  },
  "statCard": {
    "competitor": "Competitor"
  }
}
```

- [ ] **Step 3: Write `apps/web/src/i18n/locales/fr/welcome.json`**

```json
{
  "title": "Bienvenue dans Goldie Racing 🏎️",
  "description": "Configurez votre première sauvegarde avant de commencer la saison.",
  "saveNameLabel": "Nom de la sauvegarde",
  "saveNamePlaceholder": "Ex : Saison 2023 principale",
  "teamNameLabel": "Nom de l'écurie",
  "teamNamePlaceholder": "Ex : Red Bull Racing",
  "start": "Commencer"
}
```

- [ ] **Step 4: Write `apps/web/src/i18n/locales/en/welcome.json`**

```json
{
  "title": "Welcome to Goldie Racing 🏎️",
  "description": "Set up your first save before starting the season.",
  "saveNameLabel": "Save name",
  "saveNamePlaceholder": "e.g. Main 2023 season",
  "teamNameLabel": "Team name",
  "teamNamePlaceholder": "e.g. Red Bull Racing",
  "start": "Get started"
}
```

- [ ] **Step 5: Edit `apps/web/src/components/StatCard.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Inside `StatCard(...)`, first line of the body:
```tsx
}: StatCardProps) {
  const { t } = useTranslation("common");
  const valueStr = String(value);
```

Replace `Concurrent: <span className="font-mono">{competitorStr}</span>` with:
```tsx
          {t("statCard.competitor")}: <span className="font-mono">{competitorStr}</span>
```

- [ ] **Step 6: Edit `apps/web/src/components/SaveSlot.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Inside `SaveSlot(...)`, first line of the body:
```tsx
export default function SaveSlot({ slot, onLoad, onRename, onExport, onDelete }: Props) {
  const { t } = useTranslation("common");
  const [editing, setEditing] = useState(false);
```

Replace `Charger` → `{t("saveSlot.load")}`, `title="Renommer"` → `title={t("saveSlot.rename")}`, `title="Exporter JSON"` → `title={t("saveSlot.export")}`, `title="Supprimer"` → `title={t("saveSlot.delete")}`.

- [ ] **Step 7: Edit `apps/web/src/components/WelcomeDialog.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Inside `WelcomeDialog()`, first line of the body:
```tsx
export default function WelcomeDialog() {
  const { t } = useTranslation("welcome");
  const [open, setOpen] = useState(() => !localStorage.getItem(ONBOARDED_KEY));
```

Replace:
- `Bienvenue dans Goldie Racing 🏎️` → `{t("title")}`
- `Configurez votre première sauvegarde avant de commencer la saison.` → `{t("description")}`
- `Nom de la sauvegarde` → `{t("saveNameLabel")}`
- `placeholder="Ex : Saison 2023 principale"` → `placeholder={t("saveNamePlaceholder")}`
- `Nom de l'écurie` → `{t("teamNameLabel")}`
- `placeholder="Ex : Red Bull Racing"` → `placeholder={t("teamNamePlaceholder")}`
- `Commencer` → `{t("start")}`

- [ ] **Step 8: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 9: Manual check**

Run: `cd "apps/web" && npm run dev`, clear `localStorage` for the app (or open dev tools and delete the `goldie-racing:onboarded` key), reload to trigger `WelcomeDialog`, confirm it renders in the current language. Switch language in Settings and confirm a `StatCard` with a `competitor` prop (e.g. Performance page) shows the translated "Concurrent"/"Competitor" label. Stop the dev server.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/i18n/locales/fr/common.json apps/web/src/i18n/locales/en/common.json apps/web/src/i18n/locales/fr/welcome.json apps/web/src/i18n/locales/en/welcome.json apps/web/src/components/StatCard.tsx apps/web/src/components/SaveSlot.tsx apps/web/src/components/WelcomeDialog.tsx
git commit -m "feat: translate shared components and welcome dialog"
```

---

### Task 6: Dashboard translation

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/dashboard.json`, `apps/web/src/i18n/locales/en/dashboard.json`
- Modify: `apps/web/src/pages/Dashboard.tsx`

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/dashboard.json`**

```json
{
  "title": "Dashboard",
  "races": "Courses",
  "budgetUsed": "Budget utilisé",
  "topDeficits": "⚠ 3 plus grands déficits · Écart de performance",
  "nextRace": "Prochaine Course",
  "allRacesDone": "Toutes les courses terminées 🏁",
  "type": "Type",
  "strategy": "Stratégie",
  "stockStatus": "État du Stock Pièces",
  "piecesCount": "{{count}} pièces",
  "stockOk": "Stock OK",
  "stockWarning": "Attention",
  "stockCritical": "Critique",
  "stockAllGood": "Tous les stocks sont suffisants pour la saison",
  "pcsRaces": "{{count}} pcs · {{races}} courses",
  "circuitTypes": "Types de Circuit"
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/dashboard.json`**

```json
{
  "title": "Dashboard",
  "races": "Races",
  "budgetUsed": "Budget Used",
  "topDeficits": "⚠ Top 3 deficits · Performance gap",
  "nextRace": "Next Race",
  "allRacesDone": "All races completed 🏁",
  "type": "Type",
  "strategy": "Strategy",
  "stockStatus": "Parts Stock Status",
  "piecesCount": "{{count}} parts",
  "stockOk": "Stock OK",
  "stockWarning": "Warning",
  "stockCritical": "Critical",
  "stockAllGood": "All stock is sufficient for the season",
  "pcsRaces": "{{count}} pcs · {{races}} races",
  "circuitTypes": "Circuit Types"
}
```

- [ ] **Step 3: Edit `apps/web/src/pages/Dashboard.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Inside `Dashboard()`, first line of the body:
```tsx
export default function Dashboard() {
  const { t } = useTranslation("dashboard");
  const { sections, totalBudget: ctxTotalBudget } = useBudget();
```

Replace:
- `<h1 ...>Dashboard</h1>` → `<h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{t("title")}</h1>`
- `<StatCard label="Courses" value="23" icon={FlagIcon} />` → `<StatCard label={t("races")} value="23" icon={FlagIcon} />`
- `<StatCard label="Budget utilisé" value={budgetPercent + "%"} icon={WalletIcon} />` → `<StatCard label={t("budgetUsed")} value={budgetPercent + "%"} icon={WalletIcon} />`
- `⚠ 3 plus grands déficits · Écart de performance` → `{t("topDeficits")}`
- `Prochaine Course` → `{t("nextRace")}`
- ``{nextRaceUnchecked?.name ?? "Toutes les courses terminées 🏁"}`` → `` {nextRaceUnchecked?.name ?? t("allRacesDone")} ``
- `<div className="text-xs text-muted-foreground">Type</div>` → `<div className="text-xs text-muted-foreground">{t("type")}</div>`
- `<div className="text-xs text-muted-foreground">Stratégie</div>` → `<div className="text-xs text-muted-foreground">{t("strategy")}</div>`
- `<h3 ...>État du Stock Pièces</h3>` → `<h3 className="text-sm font-semibold text-foreground">{t("stockStatus")}</h3>`
- ``<span ...>{stockItems.length} pièces</span>`` → `` <span className="ml-auto text-xs text-muted-foreground font-mono">{t("piecesCount", { count: stockItems.length })}</span> ``
- `<div className="text-xs text-muted-foreground mt-1">Stock OK</div>` → `{t("stockOk")}`
- `<div className="text-xs text-muted-foreground mt-1">Attention</div>` → `{t("stockWarning")}`
- `<div className="text-xs text-muted-foreground mt-1">Critique</div>` → `{t("stockCritical")}`
- ``<span className="text-xs font-mono text-muted-foreground">{item.count} pcs · {item.capacity} courses</span>`` → `` <span className="text-xs font-mono text-muted-foreground">{t("pcsRaces", { count: item.count, races: item.capacity })}</span> ``
- `<span>Tous les stocks sont suffisants pour la saison</span>` → `<span>{t("stockAllGood")}</span>`
- `<h3 ...>Types de Circuit</h3>` → `<h3 className="text-sm font-semibold text-foreground mb-4">{t("circuitTypes")}</h3>`

- [ ] **Step 4: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manual check**

Run `npm run dev`, open the Dashboard, switch language in Settings, confirm every replaced string above updates. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/i18n/locales/fr/dashboard.json apps/web/src/i18n/locales/en/dashboard.json apps/web/src/pages/Dashboard.tsx
git commit -m "feat: translate dashboard page"
```

---

### Task 7: StaffPage translation

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/staff.json`, `apps/web/src/i18n/locales/en/staff.json`
- Modify: `apps/web/src/pages/StaffPage.tsx`

Note: `member.role` and `skill.name` come from `lib/f1Data` (out of scope, stays French). Only chrome strings are translated.

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/staff.json`**

```json
{
  "title": "Personnel",
  "subtitle": "Équipe technique et compétences",
  "avgShort": "Moy. {{value}}",
  "topSkill": "Meilleure compétence"
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/staff.json`**

```json
{
  "title": "Staff",
  "subtitle": "Technical team and skills",
  "avgShort": "Avg. {{value}}",
  "topSkill": "Best skill"
}
```

- [ ] **Step 3: Edit `apps/web/src/pages/StaffPage.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Inside `StaffPage()`, first line:
```tsx
export default function StaffPage() {
  const { t } = useTranslation("staff");
  return (
```

Replace:
- `<PageHeader title="Personnel" subtitle="Équipe technique et compétences" />` → `<PageHeader title={t("title")} subtitle={t("subtitle")} />`
- ``<span className="text-xs text-muted-foreground">Moy. {avgSkill}</span>`` → `` <span className="text-xs text-muted-foreground">{t("avgShort", { value: avgSkill })}</span> ``
- `<div className="text-xs text-primary font-medium">Meilleure compétence</div>` → `<div className="text-xs text-primary font-medium">{t("topSkill")}</div>`

- [ ] **Step 4: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manual check**

`npm run dev`, open Staff page, switch language, confirm header/subtitle/"Moy."/"Meilleure compétence" translate while role and skill names (from game data) stay in French. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/i18n/locales/fr/staff.json apps/web/src/i18n/locales/en/staff.json apps/web/src/pages/StaffPage.tsx
git commit -m "feat: translate staff page"
```

---

### Task 8: BudgetPage translation

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/budget.json`, `apps/web/src/i18n/locales/en/budget.json`
- Modify: `apps/web/src/pages/BudgetPage.tsx`

Note: `s.section` / `item.label` values come from `BudgetContext` data (French section names like "R&D", "Salaires", etc.) — out of scope, stay French. Only static chrome strings are translated.

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/budget.json`**

```json
{
  "title": "Budget",
  "subtitle": "Répartition du plafond budgétaire",
  "resetAll": "Tout réinitialiser",
  "resetTitle": "Réinitialiser le Budget ?",
  "resetDescription": "Cette action remettra toutes les dépenses, allocations et le plafond budgétaire à leurs valeurs initiales. Cette action est irréversible.",
  "confirmReset": "Confirmer la réinitialisation",
  "cancel": "Annuler",
  "totalCap": "Plafond total",
  "spent": "Dépensé",
  "remaining": "Restant",
  "capUsage": "Utilisation du plafond",
  "spentBreakdown": "Répartition dépensée",
  "allocationDetail": "Détail des allocations",
  "totalAllocated": "Total alloué",
  "columnItem": "Poste",
  "columnAllocation": "Allocation",
  "columnSpent": "Dépensé (M€) %",
  "total": "Total",
  "resetToZero": "Remettre à 0"
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/budget.json`**

```json
{
  "title": "Budget",
  "subtitle": "Budget cap breakdown",
  "resetAll": "Reset All",
  "resetTitle": "Reset Budget?",
  "resetDescription": "This will reset all spending, allocations and the budget cap to their initial values. This action is irreversible.",
  "confirmReset": "Confirm Reset",
  "cancel": "Cancel",
  "totalCap": "Total cap",
  "spent": "Spent",
  "remaining": "Remaining",
  "capUsage": "Cap usage",
  "spentBreakdown": "Spending breakdown",
  "allocationDetail": "Allocation detail",
  "totalAllocated": "Total allocated",
  "columnItem": "Item",
  "columnAllocation": "Allocation",
  "columnSpent": "Spent (M€) %",
  "total": "Total",
  "resetToZero": "Reset to 0"
}
```

- [ ] **Step 3: Edit `apps/web/src/pages/BudgetPage.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Inside `BudgetPage()`, first line:
```tsx
export default function BudgetPage() {
  const { t } = useTranslation("budget");
  const { sections, setSections, totalBudget, setTotalBudget, reset } = useBudget();
```

Replace:
- `<PageHeader title="Budget" subtitle="Répartition du plafond budgétaire" />` → `<PageHeader title={t("title")} subtitle={t("subtitle")} />`
- `Tout réinitialiser` (button) → `{t("resetAll")}`
- `<DialogTitle>Réinitialiser le Budget ?</DialogTitle>` → `<DialogTitle>{t("resetTitle")}</DialogTitle>`
- the `<DialogDescription>` text → `{t("resetDescription")}`
- `Confirmer la réinitialisation` → `{t("confirmReset")}`
- `Annuler` → `{t("cancel")}`
- `Plafond total` → `{t("totalCap")}`
- `<StatCard label="Dépensé" ...>` → `<StatCard label={t("spent")} ...>`
- `<StatCard label="Restant" ...>` → `<StatCard label={t("remaining")} ...>`
- `Utilisation du plafond` → `{t("capUsage")}`
- `Répartition dépensée` → `{t("spentBreakdown")}`
- `Détail des allocations` → `{t("allocationDetail")}`
- `<span>Total alloué</span>` → `<span>{t("totalAllocated")}</span>`
- `<span>Poste</span>` → `<span>{t("columnItem")}</span>`
- `<span className="text-right">Allocation</span>` → `<span className="text-right">{t("columnAllocation")}</span>`
- `<span className="text-right">Dépensé (M€) %</span>` → `<span className="text-right">{t("columnSpent")}</span>`
- `title="Remettre à 0"` → `title={t("resetToZero")}`
- `<span className="text-sm font-bold">Total</span>` → `<span className="text-sm font-bold">{t("total")}</span>`

- [ ] **Step 4: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manual check**

`npm run dev`, open Budget page, switch language, confirm all chrome strings above translate while section/item names stay French. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/i18n/locales/fr/budget.json apps/web/src/i18n/locales/en/budget.json apps/web/src/pages/BudgetPage.tsx
git commit -m "feat: translate budget page"
```

---

### Task 9: CalendarPage translation

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/calendar.json`, `apps/web/src/i18n/locales/en/calendar.json`
- Modify: `apps/web/src/pages/CalendarPage.tsx`

Note: race `name`, `circuit`, `type` come from `lib/f1Data` (out of scope, stay French, including the `typeConfig` keys `"Rapide"`/`"équilibre"`/`"Déportance"`/`"Test"` which must keep matching the data values exactly).

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/calendar.json`**

```json
{
  "title": "Calendrier ",
  "subtitle": "Roadmap complète de la saison",
  "dragHint": "Glisser-déposer une course pour modifier son ordre.",
  "dropHere": "Déposer ici"
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/calendar.json`**

```json
{
  "title": "Calendar ",
  "subtitle": "Full season roadmap",
  "dragHint": "Drag and drop a race to reorder it.",
  "dropHere": "Drop here"
}
```

- [ ] **Step 3: Edit `apps/web/src/pages/CalendarPage.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Inside `CalendarPage()`, first line:
```tsx
export default function CalendarPage() {
  const { t } = useTranslation("calendar");
  const { done, toggle } = useRace();
```

Replace:
- `<PageHeader title="Calendrier " subtitle="Roadmap complète de la saison" />` → `<PageHeader title={t("title")} subtitle={t("subtitle")} />`
- `<div className="mb-6 text-sm text-muted-foreground">Glisser-déposer une course pour modifier son ordre.</div>` → `<div className="mb-6 text-sm text-muted-foreground">{t("dragHint")}</div>`
- `<span ...>Déposer ici</span>` → `<span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary border border-primary/20 rounded-full px-2 py-1 bg-primary/10">{t("dropHere")}</span>`

- [ ] **Step 4: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manual check**

`npm run dev`, open Calendar page, switch language, confirm header/subtitle/hint translate, drag a race mid-drag to see "Déposer ici"/"Drop here", race names/circuits/types stay French. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/i18n/locales/fr/calendar.json apps/web/src/i18n/locales/en/calendar.json apps/web/src/pages/CalendarPage.tsx
git commit -m "feat: translate calendar page"
```

---

### Task 10: PerformancePage translation (chrome only)

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/performance.json`, `apps/web/src/i18n/locales/en/performance.json`
- Modify: `apps/web/src/pages/PerformancePage.tsx`

Note: radar `subject` labels, `PARTS_LIST`, gains form field labels (Vitesse max, Accélération, DRS…), and the ATR table's row/section labels (from `AtrContext`) are technical/business identifiers — **stay hardcoded French** per the scope decision. Only page chrome (title, buttons, dialog text, table headers, static section headings) is translated.

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/performance.json`**

```json
{
  "title": "Performance",
  "subtitle": "Analyse des métriques de performance véhicule",
  "velocity": "Vélocité",
  "cornering": "Virage",
  "components": "Composants",
  "newProject": "Nouveau projet",
  "resetAll": "Tout réinitialiser",
  "resetTitle": "Réinitialiser la Performance ?",
  "resetDescription": "Cette action supprimera tous les projets et remettra toutes les valeurs du tableau ATR à zéro. Cette action est irréversible.",
  "confirmReset": "Confirmer la réinitialisation",
  "cancel": "Annuler",
  "add": "Ajouter",
  "developmentPlan": "Plan de Développement",
  "expectedGains": "Gains attendus",
  "gainsDetail": "Détail des gains",
  "resetToZero": "Remettre à zéro",
  "topDeficits": "⚠ 3 plus grands déficits",
  "tableMonoplace": "Monoplace",
  "tableGains": "Gains Attendus",
  "tableCompetitor": "Concurrent Direct",
  "tableDeficit": "Δ Déficit",
  "calibrationTitle": "Calibration ATR"
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/performance.json`**

```json
{
  "title": "Performance",
  "subtitle": "Vehicle performance metrics analysis",
  "velocity": "Velocity",
  "cornering": "Cornering",
  "components": "Components",
  "newProject": "New project",
  "resetAll": "Reset All",
  "resetTitle": "Reset Performance?",
  "resetDescription": "This will delete all projects and reset all ATR table values to zero. This action is irreversible.",
  "confirmReset": "Confirm Reset",
  "cancel": "Cancel",
  "add": "Add",
  "developmentPlan": "Development Plan",
  "expectedGains": "Expected gains",
  "gainsDetail": "Gains detail",
  "resetToZero": "Reset to zero",
  "topDeficits": "⚠ Top 3 deficits",
  "tableMonoplace": "Car",
  "tableGains": "Expected Gains",
  "tableCompetitor": "Direct Competitor",
  "tableDeficit": "Δ Deficit",
  "calibrationTitle": "ATR Calibration"
}
```

- [ ] **Step 3: Edit `apps/web/src/pages/PerformancePage.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Inside `PerformancePage()`, first line:
```tsx
export default function PerformancePage() {
  const { t } = useTranslation("performance");
  const { atrData, setAtrData } = useAtr();
```

Replace:
- `<PageHeader title="Performance" subtitle="Analyse des métriques de performance véhicule" />` → `<PageHeader title={t("title")} subtitle={t("subtitle")} />`
- `<StatCard label="Vélocité" ...>` → `<StatCard label={t("velocity")} ...>`
- `<StatCard label="Virage" ...>` → `<StatCard label={t("cornering")} ...>`
- `<StatCard label="Composants" ...>` → `<StatCard label={t("components")} ...>`
- `Nouveau projet` → `{t("newProject")}`
- `Tout réinitialiser` (both occurrences: the page-level button and inside `AtrCalTable` if present — note `AtrCalTable`'s own reset button says "Remettre à zéro", handled separately below) → `{t("resetAll")}`
- `<DialogTitle>Réinitialiser la Performance ?</DialogTitle>` → `<DialogTitle>{t("resetTitle")}</DialogTitle>`
- the `<DialogDescription>` text → `{t("resetDescription")}`
- `Confirmer la réinitialisation` → `{t("confirmReset")}`
- both `Annuler` button texts → `{t("cancel")}`
- `Ajouter` (submit button in the new-project form) → `{t("add")}`
- `<h3 ...>Plan de Développement</h3>` → `<h3 className="text-sm font-semibold mb-6">{t("developmentPlan")}</h3>`
- `<div className="text-xs text-muted-foreground mb-1">Gains attendus</div>` → `{t("expectedGains")}`
- `<div className="text-xs font-semibold text-muted-foreground mb-2">Détail des gains</div>` → `{t("gainsDetail")}`

Now edit the `AtrCalTable` function (same file, near the bottom) — its `title` prop default `"Calibration ATR"` becomes:
```tsx
function AtrCalTable({ data, setData, title }: { data: typeof initialSections; setData: (d: typeof initialSections) => void; title?: string }) {
```
and at the call site `<AtrCalTable data={atrData} setData={setAtrData} />` becomes:
```tsx
      <AtrCalTable data={atrData} setData={setAtrData} title={t("calibrationTitle")} />
```
(Removes the hardcoded default so the caller always supplies the translated title; `AtrCalTable` itself doesn't call `useTranslation` since it doesn't otherwise need the namespace.)

Inside `AtrCalTable`, since it no longer has `t` in scope, add:
```tsx
import { useTranslation } from "react-i18next";
```
at the top of the file (shared with the main component import) and inside `AtrCalTable(...)`:
```tsx
function AtrCalTable({ data, setData, title }: { data: typeof initialSections; setData: (d: typeof initialSections) => void; title?: string }) {
  const { t } = useTranslation("performance");
  const reset = () => setData(initialSections.map(s => ({
```

Replace, still inside `AtrCalTable`:
- `Remettre à zéro` → `{t("resetToZero")}`
- `⚠ 3 plus grands déficits` → `{t("topDeficits")}`
- `<th ...>Monoplace</th>` → `{t("tableMonoplace")}`
- `<th ... className="... text-green-400">Gains Attendus</th>` → `{t("tableGains")}`
- `<th ...>Concurrent Direct</th>` → `{t("tableCompetitor")}`
- `<th ... className="... text-yellow-400">Δ Déficit</th>` → `{t("tableDeficit")}`

- [ ] **Step 4: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manual check**

`npm run dev`, open Performance page, switch language, confirm all chrome above translates (title, StatCard labels, buttons, dialogs, table headers, "Plan de Développement"), while radar subjects, gains form field labels, and ATR row/section labels stay French. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/i18n/locales/fr/performance.json apps/web/src/i18n/locales/en/performance.json apps/web/src/pages/PerformancePage.tsx
git commit -m "feat: translate performance page chrome"
```

---

### Task 11: RDPage translation (chrome only)

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/rd.json`, `apps/web/src/i18n/locales/en/rd.json`
- Modify: `apps/web/src/pages/RDPage.tsx`

Note: `pieceTypes`, `aeroGroups` piece/param names, `categoryColors` keys, `defaultProjects` content, and the aero table's parameter column values are business/data identifiers used in comparisons (`piece === "Châssis"`) and object keys — **stay hardcoded French**. Only page chrome (title, buttons, dialogs, generic form labels not tied to a specific piece, table headers, status text) is translated.

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/rd.json`**

```json
{
  "title": "Recherche & Développement",
  "subtitle": "Projets R&D",
  "createProject": "Créer un projet",
  "projectCount_one": "{{count}} projet",
  "projectCount_other": "{{count}} projets",
  "resetAll": "Tout réinitialiser",
  "resetTitle": "Réinitialiser la R&D ?",
  "resetDescription": "Cette action supprimera tous les projets et remettra toutes les valeurs du tableau aérodynamique à zéro. Cette action est irréversible.",
  "confirmReset": "Confirmer la réinitialisation",
  "cancel": "Annuler",
  "editTitle": "Modifier : {{piece}}",
  "createTitle": "Créer un projet : {{piece}}",
  "editDescription": "Modifie les informations du projet.",
  "createDescription": "Remplis les informations du projet pour la pièce sélectionnée.",
  "projectNameLabel": "Nom du projet",
  "projectNamePlaceholder": "Nom du projet",
  "costLabel": "Coût (M€)",
  "costPlaceholder": "Ex : 1.5 pour 1,5 M€",
  "save": "Enregistrer",
  "submit": "Valider",
  "complete": "Achevé",
  "edit": "Modifier",
  "delete": "Supprimer",
  "reactivate": "Réactiver",
  "cost": "Coût",
  "deadline": "Deadline",
  "noProjects": "Aucun projet R&D en cours.",
  "aeroPerformance": "Performances Aérodynamiques",
  "baseStat": "Stat. de base",
  "expectedGains": "Gains Attendus",
  "regulationChanges": "Modifications Réglementations",
  "postRegulationValue": "Valeur après de réglementation",
  "objective": "objectif",
  "gap": "gap",
  "nDeR": "N DE R",
  "completedProjects": "Projets achevés ({{count}})"
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/rd.json`**

```json
{
  "title": "Research & Development",
  "subtitle": "R&D Projects",
  "createProject": "Create a project",
  "projectCount_one": "{{count}} project",
  "projectCount_other": "{{count}} projects",
  "resetAll": "Reset All",
  "resetTitle": "Reset R&D?",
  "resetDescription": "This will delete all projects and reset all aerodynamic table values to zero. This action is irreversible.",
  "confirmReset": "Confirm Reset",
  "cancel": "Cancel",
  "editTitle": "Edit: {{piece}}",
  "createTitle": "Create a project: {{piece}}",
  "editDescription": "Edit the project information.",
  "createDescription": "Fill in the project information for the selected part.",
  "projectNameLabel": "Project name",
  "projectNamePlaceholder": "Project name",
  "costLabel": "Cost (M€)",
  "costPlaceholder": "e.g. 1.5 for €1.5M",
  "save": "Save",
  "submit": "Submit",
  "complete": "Complete",
  "edit": "Edit",
  "delete": "Delete",
  "reactivate": "Reactivate",
  "cost": "Cost",
  "deadline": "Deadline",
  "noProjects": "No R&D projects in progress.",
  "aeroPerformance": "Aerodynamic Performance",
  "baseStat": "Base stat",
  "expectedGains": "Expected Gains",
  "regulationChanges": "Regulation Changes",
  "postRegulationValue": "Post-regulation value",
  "objective": "objective",
  "gap": "gap",
  "nDeR": "N OF R",
  "completedProjects": "Completed projects ({{count}})"
}
```

- [ ] **Step 3: Edit `apps/web/src/pages/RDPage.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Inside `RDPage()`, first line:
```tsx
export default function RDPage() {
  const { t } = useTranslation("rd");
  const { setSections } = useBudget();
```

Replace:
- `<PageHeader title="Recherche & Développement" subtitle="Projets R&D" />` → `<PageHeader title={t("title")} subtitle={t("subtitle")} />`
- `<Button variant="primary">Créer un projet</Button>` → `<Button variant="primary">{t("createProject")}</Button>`
- ``{projects.length} projet{projects.length !== 1 ? "s" : ""}`` → `` {t("projectCount", { count: projects.length })} `` (relies on the `_one`/`_other` plural keys added above)
- `Tout réinitialiser` → `{t("resetAll")}`
- `<DialogTitle>Réinitialiser la R&D ?</DialogTitle>` → `<DialogTitle>{t("resetTitle")}</DialogTitle>`
- reset dialog description → `{t("resetDescription")}`
- `Confirmer la réinitialisation` → `{t("confirmReset")}`
- both `Annuler` buttons → `{t("cancel")}`
- ``{editingProject ? `Modifier : ${selectedPiece}` : `Créer un projet : ${selectedPiece}`}`` → `` {editingProject ? t("editTitle", { piece: selectedPiece }) : t("createTitle", { piece: selectedPiece })} ``
- ``{editingProject ? "Modifie les informations du projet." : "Remplis les informations du projet pour la pièce sélectionnée."}`` → `` {editingProject ? t("editDescription") : t("createDescription")} ``
- `<label ...>Nom du projet</label>` → `{t("projectNameLabel")}`
- `placeholder="Nom du projet"` → `placeholder={t("projectNamePlaceholder")}`
- `<label ...>Coût (M€)</label>` → `{t("costLabel")}`
- `placeholder="Ex : 1.5 pour 1,5 M€"` → `placeholder={t("costPlaceholder")}`
- `<Button type="submit">{editingProject ? "Enregistrer" : "Valider"}</Button>` → `<Button type="submit">{editingProject ? t("save") : t("submit")}</Button>`
- `title="Achevé"` → `title={t("complete")}`
- `title="Modifier"` (both occurrences) → `title={t("edit")}`
- `title="Supprimer"` (both occurrences) → `title={t("delete")}`
- `title="Réactiver"` → `title={t("reactivate")}`
- `<span className="text-muted-foreground">Coût</span>` → `{t("cost")}`
- `<span className="text-muted-foreground">Deadline</span>` → `{t("deadline")}`
- `<span className="text-muted-foreground text-lg">Aucun projet R&D en cours.</span>` → `{t("noProjects")}`
- `<h2 ...>Performances Aérodynamiques</h2>` → `{t("aeroPerformance")}`
- `Stat. de base` → `{t("baseStat")}`
- `Gains Attendus` (table header) → `{t("expectedGains")}`
- `Modifications Réglementations` → `{t("regulationChanges")}`
- `Valeur après de réglementation` → `{t("postRegulationValue")}`
- `objectif` (table header) → `{t("objective")}`
- `gap` (table header) → `{t("gap")}`
- `N DE R` → `{t("nDeR")}`
- ``Projets achevés ({achevesList.length})`` → `` {t("completedProjects", { count: achevesList.length })} ``

Leave every occurrence of piece names ("Châssis", "Aileron avant", etc.), `pieceTypes`, `aeroGroups`, `categoryColors`, `defaultProjects`, and the per-piece form field labels ("Réduction traînée (%)", "Delta DRS (%)", etc.) untouched.

- [ ] **Step 4: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manual check**

`npm run dev`, open R&D page, switch language, confirm title/buttons/dialogs/table headers translate while piece names and per-piece field labels stay French. Confirm the project count pluralizes correctly in both languages (1 vs 2+ projects). Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/i18n/locales/fr/rd.json apps/web/src/i18n/locales/en/rd.json apps/web/src/pages/RDPage.tsx
git commit -m "feat: translate R&D page chrome"
```

---

### Task 12: StockPage translation

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/stock.json`, `apps/web/src/i18n/locales/en/stock.json`
- Modify: `apps/web/src/pages/StockPage.tsx`

Note: `item.piece` and `item.daysToMake` come from `lib/f1Data` — out of scope, stay French.

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/stock.json`**

```json
{
  "title": "Stock Pièces",
  "subtitle": "Inventaire et gestion des composants",
  "resetAll": "Tout réinitialiser",
  "resetTitle": "Réinitialiser le Stock ?",
  "resetDescription": "Cette action remettra toutes les quantités, durées de vie et coûts unitaires à leurs valeurs initiales. Cette action est irréversible.",
  "confirmReset": "Confirmer la réinitialisation",
  "cancel": "Annuler",
  "coverageChart": "Couverture saison par pièce",
  "seasonCapacity": "Capacité saison",
  "inStock": "En stock",
  "daysToMake": "{{count}}j de fabrication",
  "lifespan": "Durée de vie",
  "races": "courses",
  "unitCost": "Coût unitaire",
  "totalCost": "Coût total de fabrication"
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/stock.json`**

```json
{
  "title": "Parts Stock",
  "subtitle": "Component inventory and management",
  "resetAll": "Reset All",
  "resetTitle": "Reset Stock?",
  "resetDescription": "This will reset all quantities, lifespans and unit costs to their initial values. This action is irreversible.",
  "confirmReset": "Confirm Reset",
  "cancel": "Cancel",
  "coverageChart": "Season coverage per part",
  "seasonCapacity": "Season capacity",
  "inStock": "In stock",
  "daysToMake": "{{count}}d to manufacture",
  "lifespan": "Lifespan",
  "races": "races",
  "unitCost": "Unit cost",
  "totalCost": "Total manufacturing cost"
}
```

- [ ] **Step 3: Edit `apps/web/src/pages/StockPage.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Inside `StockPage()`, first line:
```tsx
export default function StockPage() {
  const { t } = useTranslation("stock");
  const [counts, setCounts] = useState<Record<string, number>>(() => {
```

Replace:
- `<PageHeader title="Stock Pièces" subtitle="Inventaire et gestion des composants" />` → `<PageHeader title={t("title")} subtitle={t("subtitle")} />`
- `Tout réinitialiser` → `{t("resetAll")}`
- `<DialogTitle>Réinitialiser le Stock ?</DialogTitle>` → `<DialogTitle>{t("resetTitle")}</DialogTitle>`
- reset dialog description → `{t("resetDescription")}`
- `Confirmer la réinitialisation` → `{t("confirmReset")}`
- `Annuler` → `{t("cancel")}`
- `<h3 ...>Couverture saison par pièce</h3>` → `{t("coverageChart")}`
- ``<span ...>{item.daysToMake}j de fabrication</span>`` → `` {t("daysToMake", { count: item.daysToMake })} ``
- `<div className="text-xs text-muted-foreground">En stock</div>` → `{t("inStock")}`
- `<div className="text-xs text-muted-foreground">Durée de vie</div>` → `{t("lifespan")}`
- `<span className="text-xs text-muted-foreground">courses</span>` (next to lifespan input) → `{t("races")}`
- `<span className="text-muted-foreground">Capacité saison</span>` → `{t("seasonCapacity")}`
- `<span className="text-muted-foreground">Coût unitaire</span>` → `{t("unitCost")}`
- `<span className="text-sm text-muted-foreground">Coût total de fabrication</span>` → `{t("totalCost")}`

- [ ] **Step 4: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manual check**

`npm run dev`, open Stock page, switch language, confirm chrome translates while piece names stay French. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/i18n/locales/fr/stock.json apps/web/src/i18n/locales/en/stock.json apps/web/src/pages/StockPage.tsx
git commit -m "feat: translate stock page"
```

---

### Task 13: StrategyPage translation

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/strategy.json`, `apps/web/src/i18n/locales/en/strategy.json`
- Modify: `apps/web/src/pages/StrategyPage.tsx`

Note: tire compound labels (`S`/`M`/`H`) stay as-is (they're motorsport-standard abbreviations, not French words).

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/strategy.json`**

```json
{
  "title": "Stratégie",
  "subtitle": "Optimisation pneumatique",
  "resetAll": "Tout réinitialiser",
  "resetTitle": "Réinitialiser la Stratégie ?",
  "resetDescription": "Cette action remettra tous les paramètres de course et les données pneus à zéro. Cette action est irréversible.",
  "confirmReset": "Confirmer la réinitialisation",
  "cancel": "Annuler",
  "raceParams": "Paramètres de course",
  "lapCount": "Nombre de tours",
  "pitLoss": "Perte aux stands (s)",
  "tireData": "Données pneus",
  "baseTime": "Temps base (s)",
  "degradation": "Dégradation (s/t)",
  "maxLaps": "Tours max",
  "optimalStrategy": "★ Stratégie optimale",
  "pitStop": "→ arrêt T{{lap}}",
  "ranking": "Classement des stratégies ({{count}})",
  "noStrategy": "Aucune stratégie viable avec ces paramètres.",
  "rank": "Rang",
  "strategyColumn": "Stratégie",
  "visualization": "Visualisation",
  "stops": "Arrêts",
  "totalTime": "Temps total",
  "gap": "Écart"
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/strategy.json`**

```json
{
  "title": "Strategy",
  "subtitle": "Tire strategy optimization",
  "resetAll": "Reset All",
  "resetTitle": "Reset Strategy?",
  "resetDescription": "This will reset all race parameters and tire data to zero. This action is irreversible.",
  "confirmReset": "Confirm Reset",
  "cancel": "Cancel",
  "raceParams": "Race parameters",
  "lapCount": "Number of laps",
  "pitLoss": "Pit loss (s)",
  "tireData": "Tire data",
  "baseTime": "Base time (s)",
  "degradation": "Degradation (s/lap)",
  "maxLaps": "Max laps",
  "optimalStrategy": "★ Optimal strategy",
  "pitStop": "→ stop L{{lap}}",
  "ranking": "Strategy ranking ({{count}})",
  "noStrategy": "No viable strategy with these parameters.",
  "rank": "Rank",
  "strategyColumn": "Strategy",
  "visualization": "Visualization",
  "stops": "Stops",
  "totalTime": "Total time",
  "gap": "Gap"
}
```

- [ ] **Step 3: Edit `apps/web/src/pages/StrategyPage.tsx`**

Add the import:
```tsx
import { useTranslation } from "react-i18next";
```

Inside `StrategyPage()`, first line:
```tsx
export default function StrategyPage() {
  const { t } = useTranslation("strategy");
  const [params, setParams] = useState<RaceParams>(ZERO_PARAMS);
```

Replace:
- `<PageHeader title="Stratégie" subtitle="Optimisation pneumatique" />` → `<PageHeader title={t("title")} subtitle={t("subtitle")} />`
- `Tout réinitialiser` → `{t("resetAll")}`
- `<DialogTitle>Réinitialiser la Stratégie ?</DialogTitle>` → `<DialogTitle>{t("resetTitle")}</DialogTitle>`
- reset dialog description → `{t("resetDescription")}`
- `Confirmer la réinitialisation` → `{t("confirmReset")}`
- `Annuler` → `{t("cancel")}`
- `Paramètres de course` → `{t("raceParams")}`
- `<label ...>Nombre de tours</label>` → `{t("lapCount")}`
- `<label ...>Perte aux stands (s)</label>` → `{t("pitLoss")}`
- `Données pneus` → `{t("tireData")}`
- `<th ...>Temps base (s)</th>` → `{t("baseTime")}`
- `<th ...>Dégradation (s/t)</th>` → `{t("degradation")}`
- `<th ...>Tours max</th>` → `{t("maxLaps")}`
- `★ Stratégie optimale` → `{t("optimalStrategy")}`
- ``{`→ arrêt T${best.pitLaps[i - 1]}`}`` → `` {t("pitStop", { lap: best.pitLaps[i - 1] })} ``
- ``Classement des stratégies ({strategies.length})`` → `` {t("ranking", { count: strategies.length })} ``
- `Aucune stratégie viable avec ces paramètres.` → `{t("noStrategy")}`
- `<th ...>Rang</th>` → `{t("rank")}`
- `<th ...>Stratégie</th>` → `{t("strategyColumn")}`
- `<th ...>Visualisation</th>` → `{t("visualization")}`
- `<th ...>Arrêts</th>` → `{t("stops")}`
- `<th ...>Temps total</th>` → `{t("totalTime")}`
- `<th ...>Écart</th>` → `{t("gap")}`

Leave the second `→T{best.pitLaps[i - 1]}`-style short pit markers in the ranking table (``→T{s.pitLaps[ci - 1]}``) as a compact numeric marker — translate it the same way with a shorter key if desired, but since it's purely `→T{n}` (no French words), it can stay as literal template text; no `t()` call needed there.

- [ ] **Step 4: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manual check**

`npm run dev`, open Strategy page, switch language, confirm all chrome above translates. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/i18n/locales/fr/strategy.json apps/web/src/i18n/locales/en/strategy.json apps/web/src/pages/StrategyPage.tsx
git commit -m "feat: translate strategy page"
```

---

### Task 14: PageNotFound translation

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/notfound.json`, `apps/web/src/i18n/locales/en/notfound.json`
- Modify: `apps/web/src/lib/PageNotFound.tsx`

Note: this page's current text is already in English ("Page Not Found", "Go Home") despite the rest of the app being French — this task makes it consistent by giving it a proper French translation too, driven by the same language switcher.

- [ ] **Step 1: Write `apps/web/src/i18n/locales/fr/notfound.json`**

```json
{
  "title": "Page introuvable",
  "description": "La page \"{{page}}\" est introuvable dans cette application.",
  "goHome": "Retour à l'accueil"
}
```

- [ ] **Step 2: Write `apps/web/src/i18n/locales/en/notfound.json`**

```json
{
  "title": "Page Not Found",
  "description": "The page \"{{page}}\" could not be found in this application.",
  "goHome": "Go Home"
}
```

- [ ] **Step 3: Edit `apps/web/src/lib/PageNotFound.tsx`**

```tsx
import { useLocation } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    const { t } = useTranslation("notfound");

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-slate-300">404</h1>
                        <div className="h-0.5 w-16 bg-slate-200 mx-auto"></div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-slate-800">
                            {t("title")}
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                            {t("description", { page: pageName })}
                        </p>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                        >
                            <HomeIcon className="w-4 h-4 mr-2" />
                            {t("goHome")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
```

- [ ] **Step 4: Typecheck**

Run: `cd "apps/web" && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manual check**

`npm run dev`, navigate to a bogus route (e.g. `/#/does-not-exist`), confirm the 404 page shows the translated title/description/button in the current language, and that `{{page}}` is correctly interpolated with the attempted path. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/i18n/locales/fr/notfound.json apps/web/src/i18n/locales/en/notfound.json apps/web/src/lib/PageNotFound.tsx
git commit -m "feat: translate 404 page"
```

---

### Task 15: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck and build**

Run:
```bash
cd "apps/web" && npm run typecheck && npm run build
```
Expected: both succeed with no errors.

- [ ] **Step 2: Lint**

Run: `cd "apps/web" && npm run lint`
Expected: no new errors introduced by this work (pre-existing unrelated warnings, if any, are out of scope).

- [ ] **Step 3: Full manual walkthrough**

Run `cd "apps/web" && npm run dev`. With the app open:
1. Go to Paramètres → Langue, confirm both 🇫🇷/🇬🇧 buttons are present and the active one is highlighted.
2. Switch to English. Walk through every page (Dashboard, Calendrier/Calendar, Stock, Performance, Budget, R&D, Stratégie/Strategy, Personnel/Staff via the URL if not in nav, Paramètres/Settings all 5 tabs) and confirm chrome text is in English with no leftover French UI strings (game-data content — race names, staff roles/skills, piece names, ATR/aero parameter labels — is expected to remain French per the documented scope).
3. Switch back to Français and confirm everything reverts.
4. Reload the app (full page refresh) and confirm the last-chosen language persists.
5. Clear `localStorage` entirely (or open in a private window) and reload — confirm the app boots in a language matching the browser's locale (or French if the browser locale is neither `fr` nor `en`).

- [ ] **Step 4: Report results**

Summarize pass/fail for each of the 5 walkthrough checks above before considering the feature complete. If any check fails, fix the underlying task before proceeding — do not commit a "fix" without first identifying which task's replacement was wrong.
