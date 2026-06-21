# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer la page `/settings` avec 4 onglets (Apparence, Profil, Données, Navigation) et migrer le drag-and-drop nav hors de la sidebar.

**Architecture:** Trois nouveaux contextes React (`ThemeContext`, `AppearanceContext`, `ProfileContext`) persistent leurs données dans `localStorage` et appliquent les changements via CSS custom properties sur `:root`. La page est un composant à onglets qui compose des sous-composants dédiés par section.

**Tech Stack:** React + TypeScript, Tailwind CSS (darkMode: "class"), shadcn/ui (Tabs, AlertDialog, Input, Select), @hello-pangea/dnd (déjà installé), Canvas API pour extraction de couleur dominante.

---

## File Map

**Nouveaux fichiers :**
- `apps/web/src/lib/ThemeContext.tsx`
- `apps/web/src/lib/AppearanceContext.tsx`
- `apps/web/src/lib/ProfileContext.tsx`
- `apps/web/src/components/ColorPicker.tsx`
- `apps/web/src/components/SaveSlot.tsx`
- `apps/web/src/pages/SettingsPage.tsx`
- `apps/web/src/pages/settings/SettingsAppearance.tsx`
- `apps/web/src/pages/settings/SettingsProfile.tsx`
- `apps/web/src/pages/settings/SettingsData.tsx`
- `apps/web/src/pages/settings/SettingsNavigation.tsx`

**Fichiers modifiés :**
- `apps/web/src/lib/RaceContext.tsx` — ajouter `reset`
- `apps/web/src/lib/AtrContext.tsx` — ajouter `reset`
- `apps/web/src/lib/NavOrderContext.tsx` — ajouter item `/settings` fixe
- `apps/web/src/components/Layout.tsx` — retirer bouton "Modifier l'ordre", afficher nom d'équipe depuis ProfileContext
- `apps/web/src/app.tsx` — ajouter route + providers
- `apps/web/src/index.css` — ajouter CSS vars font + light theme

---

## Task 1 : Ajouter `reset` à RaceContext et AtrContext

**Files:**
- Modify: `apps/web/src/lib/RaceContext.tsx`
- Modify: `apps/web/src/lib/AtrContext.tsx`

- [ ] **Ajouter `reset` à RaceContext**

Dans `apps/web/src/lib/RaceContext.tsx`, modifier le type et le provider :

```tsx
type RaceContextValue = {
  done: RaceState;
  toggle: (id: string | number) => void;
  reset: () => void;
};

// Dans RaceProvider, ajouter après toggle :
const reset = () => setDone({});

// Dans le Provider value :
<RaceContext.Provider value={{ done, toggle, reset }}>
```

- [ ] **Ajouter `reset` à AtrContext**

Dans `apps/web/src/lib/AtrContext.tsx`, ajouter dans le provider :

```tsx
const reset = () => setAtrData(createDefaultData());

// Dans le Provider value :
<AtrContext.Provider value={{ atrData, setAtrData, initialSections, reset }}>
```

- [ ] **Commit**

```bash
git add apps/web/src/lib/RaceContext.tsx apps/web/src/lib/AtrContext.tsx
git commit -m "feat: add reset() to RaceContext and AtrContext"
```

---

## Task 2 : ThemeContext

**Files:**
- Create: `apps/web/src/lib/ThemeContext.tsx`
- Modify: `apps/web/src/index.css`

- [ ] **Ajouter le thème clair dans index.css**

Le `:root` actuel est identique à `.dark` (l'app est dark-only). Ajouter un vrai thème clair. Remplacer le bloc `:root` existant par :

```css
:root {
  --font-inter: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --app-font-family: 'Inter', sans-serif;
  --app-font-size: 15px;

  /* Light theme */
  --background: 0 0% 97%;
  --foreground: 220 15% 10%;
  --card: 0 0% 100%;
  --card-foreground: 220 15% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 220 15% 10%;
  --primary: 43 96% 45%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 12% 90%;
  --secondary-foreground: 220 15% 20%;
  --muted: 220 12% 92%;
  --muted-foreground: 220 10% 45%;
  --accent: 0 72% 51%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 220 12% 84%;
  --input: 220 12% 84%;
  --ring: 43 96% 45%;
  --chart-1: 43 96% 45%;
  --chart-2: 0 72% 51%;
  --chart-3: 210 60% 50%;
  --chart-4: 150 60% 45%;
  --chart-5: 280 60% 55%;
  --radius: 0.75rem;
  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 220 15% 20%;
  --sidebar-primary: 43 96% 45%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 220 12% 90%;
  --sidebar-accent-foreground: 220 15% 20%;
  --sidebar-border: 220 12% 84%;
  --sidebar-ring: 43 96% 45%;
}
```

Garder le bloc `.dark` existant tel quel (ajouter seulement les deux vars font) :

```css
.dark {
  /* ... valeurs existantes ... */
  --app-font-family: 'Inter', sans-serif;
  --app-font-size: 15px;
}
```

Modifier le `body` dans `@layer base` :

```css
body {
  @apply bg-background text-foreground;
  font-family: var(--app-font-family);
  font-size: var(--app-font-size);
}
```

- [ ] **Créer ThemeContext.tsx**

```tsx
// apps/web/src/lib/ThemeContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const THEME_KEY = "goldie-racing:theme";

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => undefined,
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(THEME_KEY) as Theme) ?? "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  // Re-apply when system preference changes
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

- [ ] **Commit**

```bash
git add apps/web/src/lib/ThemeContext.tsx apps/web/src/index.css
git commit -m "feat: ThemeContext with dark/light/system support"
```

---

## Task 3 : AppearanceContext

**Files:**
- Create: `apps/web/src/lib/AppearanceContext.tsx`

- [ ] **Créer AppearanceContext.tsx**

```tsx
// apps/web/src/lib/AppearanceContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const ACCENT_KEY = "goldie-racing:accent-color";
const FONT_FAMILY_KEY = "goldie-racing:font-family";
const FONT_SIZE_KEY = "goldie-racing:font-size";
const BG_IMAGE_KEY = "goldie-racing:bg-image";
const BG_OPACITY_KEY = "goldie-racing:bg-opacity";
const BG_BLUR_KEY = "goldie-racing:bg-blur";

type AppearanceContextValue = {
  accentHex: string;
  setAccentHex: (hex: string) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  fontSize: string;
  setFontSize: (s: string) => void;
  bgImage: string | null;
  setBgImage: (img: string | null) => void;
  bgOpacity: number;
  setBgOpacity: (v: number) => void;
  bgBlur: number;
  setBgBlur: (v: number) => void;
};

const AppearanceContext = createContext<AppearanceContextValue>(null!);

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return `${Math.round(h * 60)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyAccent(hex: string) {
  const hsl = hexToHsl(hex);
  const root = document.documentElement;
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--chart-1", hsl);
  root.style.setProperty("--sidebar-primary", hsl);
  root.style.setProperty("--sidebar-ring", hsl);
}

function applyFont(family: string, size: string) {
  const root = document.documentElement;
  root.style.setProperty("--app-font-family", family);
  root.style.setProperty("--app-font-size", size);
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [accentHex, setAccentHexState] = useState(() =>
    localStorage.getItem(ACCENT_KEY) ?? "f59e0b"
  );
  const [fontFamily, setFontFamilyState] = useState(() =>
    localStorage.getItem(FONT_FAMILY_KEY) ?? "Inter, sans-serif"
  );
  const [fontSize, setFontSizeState] = useState(() =>
    localStorage.getItem(FONT_SIZE_KEY) ?? "15px"
  );
  const [bgImage, setBgImageState] = useState<string | null>(() =>
    localStorage.getItem(BG_IMAGE_KEY)
  );
  const [bgOpacity, setBgOpacityState] = useState(() =>
    Number(localStorage.getItem(BG_OPACITY_KEY) ?? 40)
  );
  const [bgBlur, setBgBlurState] = useState(() =>
    Number(localStorage.getItem(BG_BLUR_KEY) ?? 32)
  );

  useEffect(() => { applyAccent(accentHex); }, [accentHex]);
  useEffect(() => { applyFont(fontFamily, fontSize); }, [fontFamily, fontSize]);

  const setAccentHex = (hex: string) => {
    setAccentHexState(hex);
    try { localStorage.setItem(ACCENT_KEY, hex); } catch {}
  };
  const setFontFamily = (f: string) => {
    setFontFamilyState(f);
    try { localStorage.setItem(FONT_FAMILY_KEY, f); } catch {}
  };
  const setFontSize = (s: string) => {
    setFontSizeState(s);
    try { localStorage.setItem(FONT_SIZE_KEY, s); } catch {}
  };
  const setBgImage = (img: string | null) => {
    setBgImageState(img);
    try {
      if (img) localStorage.setItem(BG_IMAGE_KEY, img);
      else localStorage.removeItem(BG_IMAGE_KEY);
    } catch {}
  };
  const setBgOpacity = (v: number) => {
    setBgOpacityState(v);
    try { localStorage.setItem(BG_OPACITY_KEY, String(v)); } catch {}
  };
  const setBgBlur = (v: number) => {
    setBgBlurState(v);
    try { localStorage.setItem(BG_BLUR_KEY, String(v)); } catch {}
  };

  return (
    <AppearanceContext.Provider value={{
      accentHex, setAccentHex,
      fontFamily, setFontFamily,
      fontSize, setFontSize,
      bgImage, setBgImage,
      bgOpacity, setBgOpacity,
      bgBlur, setBgBlur,
    }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export const useAppearance = () => useContext(AppearanceContext);
```

- [ ] **Commit**

```bash
git add apps/web/src/lib/AppearanceContext.tsx
git commit -m "feat: AppearanceContext (accent, font, background image)"
```

---

## Task 4 : ProfileContext

**Files:**
- Create: `apps/web/src/lib/ProfileContext.tsx`

- [ ] **Créer ProfileContext.tsx**

```tsx
// apps/web/src/lib/ProfileContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";

const TEAM_KEY = "goldie-racing:team-name";
const SEASON_KEY = "goldie-racing:season";

type ProfileContextValue = {
  teamName: string;
  setTeamName: (name: string) => void;
  season: string;
  setSeason: (s: string) => void;
};

const ProfileContext = createContext<ProfileContextValue>(null!);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [teamName, setTeamNameState] = useState(() =>
    localStorage.getItem(TEAM_KEY) ?? "Goldie Racing"
  );
  const [season, setSeasonState] = useState(() =>
    localStorage.getItem(SEASON_KEY) ?? "2023"
  );

  const setTeamName = (name: string) => {
    setTeamNameState(name);
    try { localStorage.setItem(TEAM_KEY, name); } catch {}
  };
  const setSeason = (s: string) => {
    setSeasonState(s);
    try { localStorage.setItem(SEASON_KEY, s); } catch {}
  };

  return (
    <ProfileContext.Provider value={{ teamName, setTeamName, season, setSeason }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
```

- [ ] **Commit**

```bash
git add apps/web/src/lib/ProfileContext.tsx
git commit -m "feat: ProfileContext (team name, season)"
```

---

## Task 5 : Composant ColorPicker

**Files:**
- Create: `apps/web/src/components/ColorPicker.tsx`

- [ ] **Créer ColorPicker.tsx**

```tsx
// apps/web/src/components/ColorPicker.tsx
import { useRef, useState } from "react";

type Props = {
  value: string; // hex sans #, ex: "f59e0b"
  onChange: (hex: string) => void;
};

function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round(h * 60);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return f(0) + f(8) + f(4);
}

export default function ColorPicker({ value, onChange }: Props) {
  const [hue, setHue] = useState(() => hexToHue(value));
  const [lightness, setLightness] = useState(50);
  const [hexInput, setHexInput] = useState(value);
  const rainbowRef = useRef<HTMLDivElement>(null);
  const brightnessRef = useRef<HTMLDivElement>(null);

  const pickFromBar = (
    e: React.MouseEvent,
    ref: React.RefObject<HTMLDivElement>,
    callback: (pct: number) => void
  ) => {
    const rect = ref.current!.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    callback(pct);
  };

  const handleRainbow = (e: React.MouseEvent) => {
    pickFromBar(e, rainbowRef, (pct) => {
      const newHue = Math.round(pct * 360);
      setHue(newHue);
      const hex = hslToHex(newHue, 100, lightness);
      setHexInput(hex);
      onChange(hex);
    });
  };

  const handleBrightness = (e: React.MouseEvent) => {
    pickFromBar(e, brightnessRef, (pct) => {
      const newL = Math.round(10 + pct * 80);
      setLightness(newL);
      const hex = hslToHex(hue, 100, newL);
      setHexInput(hex);
      onChange(hex);
    });
  };

  const handleHexApply = () => {
    if (/^[0-9a-fA-F]{6}$/.test(hexInput)) {
      onChange(hexInput.toLowerCase());
      setHue(hexToHue(hexInput));
    }
  };

  const huePct = (hue / 360) * 100;
  const lightPct = ((lightness - 10) / 80) * 100;

  return (
    <div className="flex flex-col gap-3">
      {/* Aperçu */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg border-2 border-white/15 flex-shrink-0"
          style={{ background: `#${value}` }}
        />
        <div>
          <p className="text-sm font-semibold text-foreground">Couleur d'accent</p>
          <p className="text-xs text-muted-foreground font-mono">#{value}</p>
        </div>
      </div>

      {/* Barres à 50% de largeur */}
      <div style={{ width: "50%" }} className="flex flex-col gap-2">
        {/* Arc-en-ciel */}
        <div
          ref={rainbowRef}
          onClick={handleRainbow}
          className="relative h-7 rounded-full cursor-crosshair border border-border"
          style={{
            background:
              "linear-gradient(to right,hsl(0,100%,50%),hsl(30,100%,50%),hsl(60,100%,50%),hsl(90,100%,50%),hsl(120,100%,50%),hsl(150,100%,50%),hsl(180,100%,50%),hsl(210,100%,50%),hsl(240,100%,50%),hsl(270,100%,50%),hsl(300,100%,50%),hsl(330,100%,50%),hsl(360,100%,50%))",
          }}
        >
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full border-[3px] border-white pointer-events-none"
            style={{
              left: `${huePct}%`,
              background: `#${value}`,
              boxShadow: "0 0 0 1px rgba(0,0,0,.4),0 2px 6px rgba(0,0,0,.6)",
            }}
          />
        </div>

        {/* Luminosité */}
        <div
          ref={brightnessRef}
          onClick={handleBrightness}
          className="relative h-3.5 rounded-full cursor-crosshair border border-border"
          style={{
            background: `linear-gradient(to right,#000,hsl(${hue},100%,50%),#fff)`,
          }}
        >
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white pointer-events-none"
            style={{
              left: `${lightPct}%`,
              boxShadow: "0 0 0 1px rgba(0,0,0,.4)",
            }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-muted-foreground">Sombre</span>
          <span className="text-[10px] text-muted-foreground">Lumineux</span>
        </div>
      </div>

      {/* Hex input à 25% */}
      <div className="flex items-center gap-2" style={{ width: "25%" }}>
        <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden flex-1">
          <span className="px-2 text-muted-foreground text-xs font-mono">#</span>
          <input
            className="bg-transparent border-none outline-none text-foreground font-mono text-xs w-full py-2"
            placeholder="f59e0b"
            maxLength={6}
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleHexApply()}
          />
        </div>
        <button
          onClick={handleHexApply}
          className="px-3 py-2 rounded-lg text-xs font-semibold border whitespace-nowrap text-primary border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add apps/web/src/components/ColorPicker.tsx
git commit -m "feat: ColorPicker component (rainbow bar + brightness + hex input)"
```

---

## Task 6 : Composant SaveSlot

**Files:**
- Create: `apps/web/src/components/SaveSlot.tsx`

- [ ] **Créer SaveSlot.tsx**

```tsx
// apps/web/src/components/SaveSlot.tsx
import { useState } from "react";
import { PencilIcon, ArrowDownTrayIcon, ArrowUpOnSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export type SaveSlotData = {
  id: string;
  name: string;
  createdAt: string; // ISO string
  data: {
    budget: { sections: unknown[]; totalBudget: number };
    race: { done: Record<string, boolean> };
    atr: unknown[];
  };
};

type Props = {
  slot: SaveSlotData;
  onLoad: (slot: SaveSlotData) => void;
  onRename: (id: string, name: string) => void;
  onExport: (slot: SaveSlotData) => void;
  onDelete: (id: string) => void;
};

export default function SaveSlot({ slot, onLoad, onRename, onExport, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(slot.name);

  const commitRename = () => {
    setEditing(false);
    if (name.trim() && name !== slot.name) onRename(slot.id, name.trim());
    else setName(slot.name);
  };

  const date = new Date(slot.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors">
      {editing ? (
        <input
          autoFocus
          className="flex-1 bg-transparent border-b border-primary outline-none text-sm text-foreground"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => e.key === "Enter" && commitRename()}
        />
      ) : (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{slot.name}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
      )}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onLoad(slot)}
          className="px-2 py-1 rounded text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          Charger
        </button>
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Renommer"
        >
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onExport(slot)}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Exporter JSON"
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(slot.id)}
          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Supprimer"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add apps/web/src/components/SaveSlot.tsx
git commit -m "feat: SaveSlot component"
```

---

## Task 7 : SettingsNavigation

**Files:**
- Create: `apps/web/src/pages/settings/SettingsNavigation.tsx`

- [ ] **Créer SettingsNavigation.tsx**

```tsx
// apps/web/src/pages/settings/SettingsNavigation.tsx
import { useState } from "react";
import { useNavOrder } from "@/lib/NavOrderContext";
import NavList from "@/components/NavList";
import { PencilIcon } from "@heroicons/react/24/outline";

export default function SettingsNavigation() {
  const { orderedItems, reorder } = useNavOrder();
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Ordre des pages</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Glisse les pages pour réorganiser la navigation.
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
        {isEditMode ? "Terminer" : "Modifier l'ordre"}
      </button>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add apps/web/src/pages/settings/SettingsNavigation.tsx
git commit -m "feat: SettingsNavigation tab"
```

---

## Task 8 : SettingsAppearance

**Files:**
- Create: `apps/web/src/pages/settings/SettingsAppearance.tsx`

- [ ] **Créer SettingsAppearance.tsx**

```tsx
// apps/web/src/pages/settings/SettingsAppearance.tsx
import { useRef } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useAppearance } from "@/lib/AppearanceContext";
import ColorPicker from "@/components/ColorPicker";

const FONT_FAMILIES = [
  { label: "Inter (défaut)", value: "Inter, sans-serif" },
  { label: "Roboto Mono", value: "'Roboto Mono', monospace" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { label: "Orbitron", value: "'Orbitron', sans-serif" },
  { label: "Rajdhani", value: "'Rajdhani', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Système", value: "system-ui, sans-serif" },
];

const FONT_SIZES = [
  { label: "Très petite — 11px", value: "11px" },
  { label: "Petite — 13px", value: "13px" },
  { label: "Normale — 15px", value: "15px" },
  { label: "Grande — 17px", value: "17px" },
  { label: "Très grande — 20px", value: "20px" },
];

function extractDominantColor(src: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      canvas.width = 80; canvas.height = 80;
      ctx.drawImage(img, 0, 0, 80, 80);
      const data = ctx.getImageData(0, 0, 80, 80).data;
      const buckets: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < 20 || brightness > 235) continue;
        const key = `${data[i] >> 5},${data[i + 1] >> 5},${data[i + 2] >> 5}`;
        buckets[key] = (buckets[key] ?? 0) + 1;
      }
      let max = 0, best = "0,0,0";
      for (const [k, v] of Object.entries(buckets)) {
        if (v > max) { max = v; best = k; }
      }
      const [r, g, b] = best.split(",").map((v) => (parseInt(v) << 5) | 0x10);
      resolve(((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1));
    };
    img.src = src;
  });
}

export default function SettingsAppearance() {
  const { theme, setTheme } = useTheme();
  const {
    accentHex, setAccentHex,
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    bgImage, setBgImage,
    bgOpacity, setBgOpacity,
    bgBlur, setBgBlur,
  } = useAppearance();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBgImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleMatch = async () => {
    if (!bgImage) return;
    const hex = await extractDominantColor(bgImage);
    setAccentHex(hex);
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl">

      {/* Thème */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Thème</p>
        <div className="flex gap-3">
          {(["dark", "light", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium border transition-all ${
                theme === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {t === "dark" ? "🌙 Sombre" : t === "light" ? "☀️ Clair" : "💻 Système"}
            </button>
          ))}
        </div>
      </div>

      {/* Couleur d'accent */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Couleur d'accent</p>
        <ColorPicker value={accentHex} onChange={setAccentHex} />
      </div>

      {/* Police */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Police</p>
        <div className="flex gap-3">
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="bg-card border border-border rounded-lg text-sm text-foreground px-3 py-2 outline-none cursor-pointer"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="bg-card border border-border rounded-lg text-sm text-foreground px-3 py-2 outline-none cursor-pointer"
          >
            {FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-muted-foreground" style={{ fontFamily, fontSize }}>
          Aperçu — F1 Manager 2023 · Goldie Racing
        </p>
      </div>

      {/* Image de fond */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Image de fond</p>

        {/* Zone de drop */}
        <div
          onClick={() => fileRef.current?.click()}
          className="relative flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border cursor-pointer overflow-hidden hover:border-primary/40 transition-colors"
          style={{ width: 180, height: 55 }}
        >
          {bgImage && (
            <div
              className="absolute inset-0 bg-cover bg-center rounded-lg"
              style={{
                backgroundImage: `url(${bgImage})`,
                opacity: bgOpacity / 100,
                filter: `blur(${(bgBlur / 100) * 20}px)`,
              }}
            />
          )}
          <div className="relative z-10 flex items-center gap-2">
            <span className="text-base">🖼️</span>
            <span className="text-xs text-muted-foreground">
              {bgImage ? "Changer l'image" : "Clique ou glisse une image"}
            </span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileLoad} />
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-3 mt-3" style={{ width: 180 }}>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-medium">Opacité</span>
              <span className="text-xs text-primary font-mono font-semibold">{bgOpacity}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={bgOpacity}
              onChange={(e) => setBgOpacity(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-medium">Flou</span>
              <span className="text-xs text-primary font-mono font-semibold">{bgBlur}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={bgBlur}
              onChange={(e) => setBgBlur(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {bgImage && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleMatch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
              >
                🎨 Matcher la couleur d'accent
              </button>
              <button
                onClick={() => { setBgImage(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 transition-colors"
              >
                🗑️ Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add apps/web/src/pages/settings/SettingsAppearance.tsx
git commit -m "feat: SettingsAppearance tab"
```

---

## Task 9 : SettingsProfile

**Files:**
- Create: `apps/web/src/pages/settings/SettingsProfile.tsx`

- [ ] **Créer SettingsProfile.tsx**

```tsx
// apps/web/src/pages/settings/SettingsProfile.tsx
import { useProfile } from "@/lib/ProfileContext";

const SEASONS = ["2023", "2024", "2025"];

export default function SettingsProfile() {
  const { teamName, setTeamName, season, setSeason } = useProfile();

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
          Nom de l'équipe
        </label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
          placeholder="Goldie Racing"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
          Saison active
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

- [ ] **Commit**

```bash
git add apps/web/src/pages/settings/SettingsProfile.tsx
git commit -m "feat: SettingsProfile tab"
```

---

## Task 10 : SettingsData

**Files:**
- Create: `apps/web/src/pages/settings/SettingsData.tsx`

- [ ] **Créer SettingsData.tsx**

```tsx
// apps/web/src/pages/settings/SettingsData.tsx
import { useRef, useState } from "react";
import { useBudget } from "@/lib/BudgetContext";
import { useRace } from "@/lib/RaceContext";
import { useAtr } from "@/lib/AtrContext";
import SaveSlot, { type SaveSlotData } from "@/components/SaveSlot";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SAVES_KEY = "goldie_saves";
const MAX_SLOTS = 10;

function loadSlots(): SaveSlotData[] {
  try {
    const raw = localStorage.getItem(SAVES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function persistSlots(slots: SaveSlotData[]) {
  try { localStorage.setItem(SAVES_KEY, JSON.stringify(slots)); } catch {}
}

export default function SettingsData() {
  const { sections, totalBudget, setSections, setTotalBudget, reset: resetBudget } = useBudget();
  const { done, reset: resetRace } = useRace();
  const { atrData, setAtrData, reset: resetAtr } = useAtr();
  const [slots, setSlots] = useState<SaveSlotData[]>(loadSlots);
  const importRef = useRef<HTMLInputElement>(null);

  const updateSlots = (next: SaveSlotData[]) => {
    setSlots(next);
    persistSlots(next);
  };

  const handleNewSave = () => {
    if (slots.length >= MAX_SLOTS) return;
    const newSlot: SaveSlotData = {
      id: crypto.randomUUID(),
      name: `Sauvegarde ${new Date().toLocaleDateString("fr-FR")}`,
      createdAt: new Date().toISOString(),
      data: {
        budget: { sections: structuredClone(sections), totalBudget },
        race: { done: structuredClone(done) },
        atr: structuredClone(atrData),
      },
    };
    updateSlots([newSlot, ...slots]);
  };

  const handleLoad = (slot: SaveSlotData) => {
    setSections(slot.data.budget.sections as typeof sections);
    setTotalBudget(slot.data.budget.totalBudget);
    // RaceContext reset + restore via toggle is complex — overwrite via localStorage and reload
    localStorage.setItem("goldie-racing:race-done", JSON.stringify(slot.data.race.done));
    setAtrData(slot.data.atr as typeof atrData);
    window.location.reload();
  };

  const handleRename = (id: string, name: string) => {
    updateSlots(slots.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleExport = (slot: SaveSlotData) => {
    const blob = new Blob([JSON.stringify(slot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slot.name.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    updateSlots(slots.filter((s) => s.id !== id));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const slot: SaveSlotData = JSON.parse(ev.target?.result as string);
        if (!slot.id || !slot.data) throw new Error("Format invalide");
        const imported: SaveSlotData = {
          ...slot,
          id: crypto.randomUUID(),
          name: `${slot.name} (importé)`,
        };
        updateSlots([imported, ...slots].slice(0, MAX_SLOTS));
      } catch {
        alert("Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-8 max-w-xl">

      {/* Sauvegardes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Sauvegardes ({slots.length}/{MAX_SLOTS})
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => importRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground border border-border hover:text-foreground hover:bg-secondary transition-colors"
            >
              Importer JSON
            </button>
            <button
              onClick={handleNewSave}
              disabled={slots.length >= MAX_SLOTS}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Nouvelle sauvegarde
            </button>
          </div>
        </div>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
            Aucune sauvegarde. Crée-en une !
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {slots.map((slot) => (
              <SaveSlot
                key={slot.id}
                slot={slot}
                onLoad={handleLoad}
                onRename={handleRename}
                onExport={handleExport}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reset */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Réinitialisation
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: "Reset Budget", action: resetBudget, desc: "Remet toutes les dépenses et allocations à zéro." },
            { label: "Reset Courses", action: resetRace, desc: "Décoche toutes les courses marquées comme terminées." },
            { label: "Reset ATR", action: resetAtr, desc: "Efface toutes les valeurs du tableau ATR." },
          ].map(({ label, action, desc }) => (
            <AlertDialog key={label}>
              <AlertDialogTrigger asChild>
                <button className="flex items-center justify-between px-4 py-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors text-left w-full">
                  <div>
                    <p className="text-sm font-medium text-destructive">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <span className="text-destructive/60 text-xs font-medium ml-4 flex-shrink-0">Réinitialiser →</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{label}</AlertDialogTitle>
                  <AlertDialogDescription>{desc} Cette action est irréversible.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={action} className="bg-destructive hover:bg-destructive/90">
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add apps/web/src/pages/settings/SettingsData.tsx
git commit -m "feat: SettingsData tab (saves + resets)"
```

---

## Task 11 : SettingsPage

**Files:**
- Create: `apps/web/src/pages/SettingsPage.tsx`

- [ ] **Créer SettingsPage.tsx**

```tsx
// apps/web/src/pages/SettingsPage.tsx
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import SettingsAppearance from "./settings/SettingsAppearance";
import SettingsProfile from "./settings/SettingsProfile";
import SettingsData from "./settings/SettingsData";
import SettingsNavigation from "./settings/SettingsNavigation";

const TABS = [
  { id: "appearance", label: "🎨 Apparence" },
  { id: "profile", label: "🏎️ Profil" },
  { id: "data", label: "💾 Données" },
  { id: "navigation", label: "🧭 Navigation" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("appearance");

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Personnalise l'application" />

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
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "appearance" && <SettingsAppearance />}
      {activeTab === "profile" && <SettingsProfile />}
      {activeTab === "data" && <SettingsData />}
      {activeTab === "navigation" && <SettingsNavigation />}
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add apps/web/src/pages/SettingsPage.tsx apps/web/src/pages/settings/
git commit -m "feat: SettingsPage with 4 tabs"
```

---

## Task 12 : Câblage final (app.tsx, Layout.tsx, NavOrderContext.tsx)

**Files:**
- Modify: `apps/web/src/app.tsx`
- Modify: `apps/web/src/components/Layout.tsx`
- Modify: `apps/web/src/lib/NavOrderContext.tsx`

- [ ] **Mettre à jour NavOrderContext : ajouter /settings comme item fixe**

Dans `apps/web/src/lib/NavOrderContext.tsx`, ajouter l'import et l'item fixe :

```tsx
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

// Item fixe non-réordonnable, toujours en dernier dans la nav
export const settingsNavItem = {
  path: "/settings",
  icon: Cog6ToothIcon,
  label: "Paramètres",
};
```

Exposer `orderedItems` + `settingsNavItem` séparément (le composant NavList les affiche l'un après l'autre) — OU concaténer dans le contexte. La solution la plus simple : exposer un `allItems` depuis le contexte qui concatène `orderedItems` et `settingsNavItem` :

```tsx
// Dans NavOrderContext.Provider value :
<NavOrderContext.Provider value={{ orderedItems, reorder, settingsItem: settingsNavItem }}>
```

Et modifier le type :

```tsx
const NavOrderContext = createContext<{
  orderedItems: typeof navItemsSource;
  reorder: (from: number, to: number) => void;
  settingsItem: typeof settingsNavItem;
}>(null!);
```

- [ ] **Mettre à jour Layout.tsx**

1. Retirer le bouton "Modifier l'ordre" (desktop et mobile) — supprimer les états `isEditMode` et `isMobileEditMode`, et leurs boutons.
2. Afficher `teamName` depuis `ProfileContext` dans le header sidebar.
3. Afficher `settingsItem` séparément en bas de nav, avant la version.

```tsx
import { useProfile } from "@/lib/ProfileContext";

// Dans le composant :
const { teamName } = useProfile();
const { orderedItems, reorder, settingsItem } = useNavOrder();

// Header sidebar — remplacer le texte statique :
<h1 className="text-lg font-bold text-primary tracking-tight">F1 Manager</h1>
<p className="text-xs text-muted-foreground font-mono">{teamName}</p>

// Nav desktop — après NavList, ajouter le lien settings :
<Link
  to={settingsItem.path}
  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
    location.pathname === settingsItem.path
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
  }`}
>
  <settingsItem.icon className="w-4 h-4" />
  {settingsItem.label}
  {location.pathname === settingsItem.path && (
    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
  )}
</Link>

// Retirer les états isEditMode, isMobileEditMode et leurs boutons
// Retirer l'import PencilIcon si plus utilisé
```

- [ ] **Mettre à jour app.tsx**

```tsx
import { ThemeProvider } from './lib/ThemeContext';
import { AppearanceProvider } from './lib/AppearanceContext';
import { ProfileProvider } from './lib/ProfileContext';
import SettingsPage from './pages/SettingsPage';

// Wrapper providers autour de tout (à l'extérieur de Router) :
<ThemeProvider>
  <AppearanceProvider>
    <ProfileProvider>
      <NavOrderProvider>
        ...
        <Route path="/settings" element={<SettingsPage />} />
        ...
      </NavOrderProvider>
    </ProfileProvider>
  </AppearanceProvider>
</ThemeProvider>
```

- [ ] **Tester dans le navigateur**

Lancer l'app : `pnpm --filter web dev`

Vérifier :
- La page `/settings` est accessible depuis la sidebar
- L'onglet Apparence change le thème, la couleur d'accent, la police, l'image de fond
- L'onglet Profil persiste le nom d'équipe (visible dans la sidebar après reload)
- L'onglet Données : créer/charger/supprimer/exporter un slot, reset budget
- L'onglet Navigation : le drag-and-drop réordonne les pages

- [ ] **Commit final**

```bash
git add apps/web/src/app.tsx apps/web/src/components/Layout.tsx apps/web/src/lib/NavOrderContext.tsx
git commit -m "feat: wire settings page — route, providers, layout cleanup"
```
