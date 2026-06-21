# Strategy Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une page `/strategy` permettant de planifier la stratégie pneus race par race (compound de départ, relais avec tour d'arrêt, notes libres), stockée en localStorage.

**Architecture:** Un seul composant `StrategyPage` avec state local (`useState` + `localStorage`), sans nouveau Context. Layout 2 colonnes desktop / colonne unique mobile avec panneau d'édition activé par clic. La route et l'entrée de navigation sont ajoutées aux fichiers existants.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion, Heroicons (`@heroicons/react/24/outline`), React Router DOM

---

## Fichiers

| Action | Fichier | Rôle |
|--------|---------|------|
| Créer | `apps/web/src/pages/StrategyPage.tsx` | Page complète : liste + panneau d'édition |
| Modifier | `apps/web/src/app.tsx` | Ajout route `/strategy` |
| Modifier | `apps/web/src/lib/NavOrderContext.tsx` | Ajout item nav `/strategy` |

---

### Task 1 : Créer StrategyPage.tsx

**Files:**
- Create: `apps/web/src/pages/StrategyPage.tsx`

- [ ] **Step 1 : Créer le fichier avec les types, constantes et state**

```tsx
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  MapPinIcon,
  BoltIcon,
  ShieldCheckIcon,
  CloudIcon,
  PlusIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import PageHeader from "../components/PageHeader";
import { calendar } from "../lib/f1Data";

type Compound = "soft" | "medium" | "hard";

type Stint = {
  compound: Compound;
  lapIn: number;
};

type RaceStrategy = {
  compoundStart: Compound | null;
  stints: Stint[];
  notes: string;
};

type StrategyStore = Record<string, RaceStrategy>;

const STORAGE_KEY = "goldie-racing:tire-strategy";

const COMPOUND_COLORS: Record<Compound, string> = {
  soft: "#ef4444",
  medium: "#eab308",
  hard: "#e2e8f0",
};

const COMPOUND_LABELS: Record<Compound, string> = {
  soft: "S",
  medium: "M",
  hard: "H",
};

const TYPE_CONFIG = {
  Rapide: { icon: BoltIcon, badge: "bg-red-500/15 text-red-400 border-red-500/20" },
  équilibre: { icon: ShieldCheckIcon, badge: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  Déportance: { icon: CloudIcon, badge: "bg-primary/15 text-primary border-primary/20" },
};

const races = [...calendar]
  .filter((r) => r.type !== "Test")
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

const defaultStrategy = (): RaceStrategy => ({
  compoundStart: null,
  stints: [],
  notes: "",
});

function loadStore(): StrategyStore {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}
```

- [ ] **Step 2 : Ajouter le composant principal avec state et persistence**

Ajouter après les fonctions utilitaires dans le même fichier :

```tsx
export default function StrategyPage() {
  const [store, setStore] = useState<StrategyStore>(loadStore);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState(false); // mobile only

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {}
  }, [store]);

  const getStrategy = (id: number): RaceStrategy =>
    store[String(id)] ?? defaultStrategy();

  const updateStrategy = (id: number, patch: Partial<RaceStrategy>) => {
    setStore((prev) => ({
      ...prev,
      [String(id)]: { ...getStrategy(id), ...patch },
    }));
  };

  const selectedRace = races.find((r) => r.id === selectedId) ?? null;
  const strategy = selectedId !== null ? getStrategy(selectedId) : null;

  const handleSelectRace = (id: number) => {
    setSelectedId(id);
    setShowPanel(true);
  };

  return (
    <div>
      <PageHeader title="Stratégie Pneus" subtitle="Planification des relais par course" />
      <div className="flex gap-6 h-full">
        {/* Liste */}
        <div className={`flex-shrink-0 w-full md:w-2/5 ${showPanel ? "hidden md:block" : "block"}`}>
          <RaceList
            store={store}
            selectedId={selectedId}
            onSelect={handleSelectRace}
          />
        </div>

        {/* Panneau d'édition */}
        <div className={`flex-1 ${showPanel ? "block" : "hidden md:block"}`}>
          {selectedRace && strategy !== null ? (
            <EditPanel
              race={selectedRace}
              strategy={strategy}
              onUpdate={(patch) => updateStrategy(selectedRace.id, patch)}
              onBack={() => setShowPanel(false)}
            />
          ) : (
            <div className="hidden md:flex items-center justify-center h-64 text-muted-foreground text-sm">
              Sélectionne une course pour planifier sa stratégie.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Ajouter le composant RaceList**

Ajouter avant `StrategyPage` dans le même fichier :

```tsx
function RaceList({
  store,
  selectedId,
  onSelect,
}: {
  store: StrategyStore;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="space-y-2">
      {races.map((race, i) => {
        const strat = store[String(race.id)];
        const compound = strat?.compoundStart ?? null;
        const isSelected = selectedId === race.id;

        return (
          <motion.button
            key={race.id}
            onClick={() => onSelect(race.id)}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className={`w-full text-left bg-card border rounded-xl px-4 py-3 transition-colors hover:border-primary/30 ${
              isSelected
                ? "border-primary/60 bg-primary/5"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{race.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPinIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{race.circuit}</span>
                </div>
              </div>
              {compound ? (
                <span
                  className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border"
                  style={{
                    color: COMPOUND_COLORS[compound],
                    borderColor: COMPOUND_COLORS[compound] + "55",
                    backgroundColor: COMPOUND_COLORS[compound] + "22",
                  }}
                >
                  {COMPOUND_LABELS[compound]}
                </span>
              ) : (
                <span className="flex-shrink-0 text-xs text-muted-foreground border border-border rounded-full px-2.5 py-1">
                  —
                </span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4 : Ajouter le composant EditPanel**

Ajouter avant `RaceList` dans le même fichier :

```tsx
function EditPanel({
  race,
  strategy,
  onUpdate,
  onBack,
}: {
  race: (typeof races)[number];
  strategy: RaceStrategy;
  onUpdate: (patch: Partial<RaceStrategy>) => void;
  onBack: () => void;
}) {
  const typeConf = TYPE_CONFIG[race.type as keyof typeof TYPE_CONFIG];
  const TypeIcon = typeConf?.icon;

  const addStint = () =>
    onUpdate({ stints: [...strategy.stints, { compound: "medium", lapIn: 0 }] });

  const removeStint = (idx: number) =>
    onUpdate({ stints: strategy.stints.filter((_, i) => i !== idx) });

  const updateStint = (idx: number, patch: Partial<Stint>) =>
    onUpdate({
      stints: strategy.stints.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    });

  return (
    <motion.div
      key={race.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5 space-y-6"
    >
      {/* Back button (mobile) */}
      <button
        onClick={onBack}
        className="md:hidden flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Retour
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">{race.name}</h2>
          <div className="flex items-center gap-1 mt-1">
            <MapPinIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{race.circuit}</span>
          </div>
        </div>
        {typeConf && TypeIcon && (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium flex-shrink-0 ${typeConf.badge}`}>
            <TypeIcon className="w-3 h-3" />
            {race.type}
          </span>
        )}
      </div>

      {/* Compound de départ */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Compound de départ
        </p>
        <div className="flex gap-2">
          {(["soft", "medium", "hard"] as Compound[]).map((c) => {
            const active = strategy.compoundStart === c;
            return (
              <button
                key={c}
                onClick={() =>
                  onUpdate({ compoundStart: active ? null : c })
                }
                className="w-10 h-10 rounded-lg border-2 font-bold text-sm transition-all"
                style={{
                  borderColor: COMPOUND_COLORS[c],
                  backgroundColor: active ? COMPOUND_COLORS[c] + "33" : "transparent",
                  color: COMPOUND_COLORS[c],
                }}
              >
                {COMPOUND_LABELS[c]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Relais */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Relais (arrêts aux stands)
        </p>
        <div className="space-y-2">
          {strategy.stints.map((stint, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-muted/20 border border-border rounded-lg px-3 py-2"
            >
              <span className="text-xs text-muted-foreground w-6 font-mono">{idx + 1}.</span>
              <div className="flex gap-1.5">
                {(["soft", "medium", "hard"] as Compound[]).map((c) => {
                  const active = stint.compound === c;
                  return (
                    <button
                      key={c}
                      onClick={() => updateStint(idx, { compound: c })}
                      className="w-7 h-7 rounded border-2 font-bold text-xs transition-all"
                      style={{
                        borderColor: COMPOUND_COLORS[c],
                        backgroundColor: active ? COMPOUND_COLORS[c] + "33" : "transparent",
                        color: COMPOUND_COLORS[c],
                      }}
                    >
                      {COMPOUND_LABELS[c]}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-xs text-muted-foreground">Tour</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={stint.lapIn === 0 ? "" : stint.lapIn}
                  onChange={(e) =>
                    updateStint(idx, { lapIn: parseInt(e.target.value) || 0 })
                  }
                  placeholder="—"
                  className="w-14 bg-transparent border border-border rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <button
                onClick={() => removeStint(idx)}
                className="text-muted-foreground hover:text-red-400 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addStint}
          className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Ajouter un relais
        </button>
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Notes
        </p>
        <textarea
          value={strategy.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Notes de stratégie..."
          rows={3}
          className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/50"
        />
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 5 : Vérifier que le fichier compile (pas d'erreur TypeScript)**

Depuis la racine du projet :
```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```
Expected : aucune erreur dans `StrategyPage.tsx`. Les erreurs dans d'autres fichiers préexistants peuvent être ignorées.

- [ ] **Step 6 : Commit**

```bash
git add apps/web/src/pages/StrategyPage.tsx
git commit -m "feat: add StrategyPage component with race list and edit panel"
```

---

### Task 2 : Brancher la route dans app.tsx

**Files:**
- Modify: `apps/web/src/app.tsx`

- [ ] **Step 1 : Ajouter l'import**

Dans `apps/web/src/app.tsx`, ajouter après la ligne `import RDPage from './pages/RDPage';` :

```tsx
import StrategyPage from './pages/StrategyPage';
```

- [ ] **Step 2 : Ajouter la route**

Dans le bloc `<Routes>`, ajouter après `<Route path="/rd" element={<RDPage />} />` :

```tsx
<Route path="/strategy" element={<StrategyPage />} />
```

- [ ] **Step 3 : Vérifier le rendu en ouvrant `/strategy` dans le navigateur**

Lancer le dev server si pas déjà lancé :
```bash
cd apps/app && npm run dev
```
Naviguer vers `http://localhost:5173/strategy` (ou le port affiché).
Expected : la page affiche "Stratégie Pneus" avec la liste des 22 courses (sans "Pre-season Testing").

- [ ] **Step 4 : Commit**

```bash
git add apps/web/src/app.tsx
git commit -m "feat: register /strategy route in app router"
```

---

### Task 3 : Ajouter l'entrée de navigation dans NavOrderContext.tsx

**Files:**
- Modify: `apps/web/src/lib/NavOrderContext.tsx`

- [ ] **Step 1 : Ajouter l'import de l'icône**

Dans `apps/web/src/lib/NavOrderContext.tsx`, ajouter `FlagIcon` à l'import existant de `@heroicons/react/24/outline` :

```tsx
import {
  BeakerIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CubeIcon,
  FlagIcon,
  Squares2X2Icon,
  WalletIcon,
} from "@heroicons/react/24/outline";
```

- [ ] **Step 2 : Ajouter l'item dans navItemsSource**

Dans `navItemsSource`, ajouter en dernier :

```tsx
const navItemsSource = [
  { path: "/", icon: Squares2X2Icon, label: "Dashboard" },
  { path: "/calendar", icon: CalendarDaysIcon, label: "Calendrier" },
  { path: "/stock", icon: CubeIcon, label: "Stock Pièces" },
  { path: "/performance", icon: ChartBarIcon, label: "Performance" },
  { path: "/budget", icon: WalletIcon, label: "Budget" },
  { path: "/rd", icon: BeakerIcon, label: "R&D" },
  { path: "/strategy", icon: FlagIcon, label: "Stratégie" },
];
```

- [ ] **Step 3 : Vérifier la navigation dans le navigateur**

Recharger l'app. Expected :
- "Stratégie" apparaît en bas de la nav (desktop sidebar et mobile drawer)
- Cliquer dessus charge `/strategy` correctement
- Le lien est actif (surligné) quand on est sur la page
- La page peut être réordonnée via le drag-and-drop existant

- [ ] **Step 4 : Commit**

```bash
git add apps/web/src/lib/NavOrderContext.tsx
git commit -m "feat: add Stratégie entry to navigation"
```

---

## Self-Review

**Spec coverage :**
- ✅ Page `/strategy` avec layout 2 colonnes desktop / 1 colonne mobile
- ✅ Liste des courses triée par date, Tests exclus
- ✅ Badge compound coloré dans la liste (ou `—` si non planifié)
- ✅ Course sélectionnée mise en évidence (`border-primary/60 bg-primary/5`)
- ✅ Panneau : header avec nom, circuit, badge type circuit
- ✅ Panneau : 3 boutons toggle compound de départ (S/M/H) avec couleurs F1
- ✅ Panneau : liste de relais (compound + tour d'arrêt + suppression)
- ✅ Panneau : bouton "Ajouter un relais"
- ✅ Panneau : textarea notes
- ✅ Sauvegarde automatique à chaque changement
- ✅ Bouton "← Retour" mobile
- ✅ Entrée nav "Stratégie" avec icône
- ✅ Route `/strategy` enregistrée

**Type consistency :** `Compound`, `Stint`, `RaceStrategy`, `StrategyStore` définis dans Task 1 et réutilisés de façon cohérente dans `EditPanel` et `RaceList`.

**Placeholders :** Aucun TBD ou TODO.
