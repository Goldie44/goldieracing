# Capacitor iOS Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrapper le SPA React (`apps/web`) en application iOS native via Capacitor, avec une bottom tab bar mobile remplaçant le hamburger menu existant.

**Architecture:** Capacitor est installé directement dans `apps/web` (pas de nouveau workspace). `Layout.tsx` conditionne sidebar desktop (inchangée) vs bottom tab bar mobile. `BottomNav.tsx` est un composant dédié qui lit `NavOrderContext` pour les items.

**Tech Stack:** `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`, React Router `useLocation`, Tailwind CSS, Heroicons.

---

## Carte des fichiers

| Fichier | Action | Rôle |
|---|---|---|
| `apps/web/capacitor.config.ts` | Créer | Config Capacitor (appId, appName, webDir) |
| `apps/web/package.json` | Modifier | Ajouter deps Capacitor + scripts `cap:sync`, `cap:open`, `ios` |
| `apps/web/src/components/BottomNav.tsx` | Créer | Bottom tab bar mobile (5 pages + settings) |
| `apps/web/src/components/Layout.tsx` | Modifier | Supprimer overlay hamburger, ajouter BottomNav, ajuster padding |
| `.gitignore` | Modifier | Ignorer `ios/App/Pods/` et `.xcode.env.local` |

`NavList.tsx`, `NavOrderContext.tsx`, `use-mobile.tsx` — **inchangés**.

---

## Task 1 — Dépendances Capacitor et configuration

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/capacitor.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1 : Installer les packages Capacitor dans `apps/web`**

Depuis la racine du monorepo :

```bash
pnpm --filter @f1-manager/web add @capacitor/core @capacitor/ios
pnpm --filter @f1-manager/web add -D @capacitor/cli
```

Expected output : pnpm résout les packages et met à jour `pnpm-lock.yaml`. Pas d'erreur.

- [ ] **Step 2 : Vérifier que les packages sont dans `apps/web/package.json`**

```bash
grep -E "capacitor" apps/web/package.json
```

Expected output :
```
"@capacitor/core": "...",
"@capacitor/ios": "...",
"@capacitor/cli": "...",
```

- [ ] **Step 3 : Ajouter les scripts iOS dans `apps/web/package.json`**

Dans la section `"scripts"` de `apps/web/package.json`, ajouter après `"preview"` :

```json
"cap:sync": "cap sync",
"cap:open": "cap open ios",
"ios": "pnpm build && cap sync ios && cap open ios"
```

La section scripts complète doit ressembler à :

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint . --quiet",
  "lint:fix": "eslint . --fix",
  "typecheck": "tsc --noEmit",
  "preview": "vite preview",
  "cap:sync": "cap sync",
  "cap:open": "cap open ios",
  "ios": "pnpm build && cap sync ios && cap open ios"
}
```

- [ ] **Step 4 : Créer `apps/web/capacitor.config.ts`**

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goldieracing.app',
  appName: 'Goldie Racing',
  webDir: 'dist',
};

export default config;
```

- [ ] **Step 5 : Mettre à jour `.gitignore` à la racine du monorepo**

Ajouter à la fin du fichier `.gitignore` :

```
# iOS (Capacitor)
apps/web/ios/App/Pods/
apps/web/ios/.xcode.env.local
```

- [ ] **Step 6 : Committer**

```bash
git add apps/web/package.json apps/web/capacitor.config.ts pnpm-lock.yaml .gitignore
git commit -m "feat: install Capacitor and add iOS build scripts"
```

---

## Task 2 — Composant `BottomNav`

**Files:**
- Create: `apps/web/src/components/BottomNav.tsx`

`BottomNav` affiche les 5 premiers items de `orderedItems` (ordre défini par l'utilisateur dans les settings) plus `settingsItem`, soit 6 onglets au total. Il est toujours rendu dans le DOM mais masqué via `lg:hidden` — même mécanique que le mobile header existant.

- [ ] **Step 1 : Créer `apps/web/src/components/BottomNav.tsx`**

```tsx
import { Link, useLocation } from "react-router-dom";
import { useNavOrder } from "@/lib/NavOrderContext";

export default function BottomNav() {
  const { orderedItems, settingsItem } = useNavOrder();
  const location = useLocation();
  const tabs = [...orderedItems.slice(0, 5), settingsItem];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-w-0 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium truncate w-full text-center px-0.5 leading-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2 : Vérifier que TypeScript compile**

```bash
pnpm --filter @f1-manager/web typecheck
```

Expected output : pas d'erreurs TypeScript.

- [ ] **Step 3 : Committer**

```bash
git add apps/web/src/components/BottomNav.tsx
git commit -m "feat: add BottomNav component for mobile iOS navigation"
```

---

## Task 3 — Modifier `Layout.tsx`

**Files:**
- Modify: `apps/web/src/components/Layout.tsx`

Changements :
1. Supprimer l'état `mobileOpen` et le hamburger overlay (AnimatePresence + slide-out nav)
2. Simplifier le mobile header (supprimer le bouton hamburger)
3. Ajouter `<BottomNav />`
4. Ajuster le padding du contenu principal pour la bottom bar

- [ ] **Step 1 : Remplacer le contenu de `Layout.tsx`**

```tsx
import { Link, Outlet, useLocation } from "react-router-dom";
import { FlagIcon } from "@heroicons/react/24/outline";
import { useNavOrder } from "@/lib/NavOrderContext";
import { useProfile } from "@/lib/ProfileContext";
import { useAppearance } from "@/lib/AppearanceContext";
import NavList from "@/components/NavList";
import BottomNav from "@/components/BottomNav";

export default function Layout() {
  const location = useLocation();
  const { orderedItems, reorder, settingsItem } = useNavOrder();
  const { teamName } = useProfile();
  const { bgImage, bgOpacity, bgBlur } = useAppearance();

  return (
    <div className="min-h-screen flex bg-background relative">
      {bgImage && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url(${bgImage})`,
            opacity: bgOpacity / 100,
            filter: `blur(${(bgBlur / 100) * 20}px)`,
          }}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card fixed inset-y-0 z-30">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FlagIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary tracking-tight">F1 Manager</h1>
              <p className="text-xs text-muted-foreground font-mono">{teamName}</p>
            </div>
          </div>
        </div>
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
        <div className="p-4 border-t border-border space-y-2">
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
          <div className="text-xs text-muted-foreground font-mono text-center">
            <p>Version 1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center p-4">
          <div className="flex items-center gap-2">
            <FlagIcon className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">GOLDIE F1</span>
          </div>
        </div>
      </div>

      {/* Bottom Nav (mobile only) */}
      <BottomNav />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 pb-24 lg:pb-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
pnpm --filter @f1-manager/web typecheck
```

Expected output : pas d'erreurs.

- [ ] **Step 3 : Lancer le SPA en mode dev et vérifier visuellement**

```bash
pnpm --filter @f1-manager/web dev
```

Ouvrir `http://localhost:5173` dans un navigateur.

Vérifier desktop (fenêtre > 1024px) :
- La sidebar s'affiche à gauche avec tous les liens
- Le contenu est décalé à droite (`ml-64`)
- Aucune bottom bar visible

Vérifier mobile (DevTools → responsive, < 1024px) :
- La sidebar disparaît
- Le mobile header `GOLDIE F1` s'affiche en haut
- La bottom bar s'affiche en bas avec 6 onglets (5 pages + Paramètres)
- Cliquer sur chaque onglet → la route change, l'onglet actif est coloré en `primary`
- Le contenu ne passe pas sous la bottom bar

- [ ] **Step 4 : Committer**

```bash
git add apps/web/src/components/Layout.tsx
git commit -m "feat: replace hamburger overlay with BottomNav on mobile"
```

---

## Task 4 — Initialiser le projet iOS (macOS uniquement)

> ⚠️ **Cette tâche nécessite macOS avec Xcode installé.** Elle ne peut pas être exécutée sur Windows. Si tu travailles sur Windows, arrête ici et transfère le repo sur macOS pour la suite.

**Prérequis :**
- macOS
- Xcode 14+ installé (depuis l'App Store)
- Command Line Tools : `xcode-select --install`
- CocoaPods : `sudo gem install cocoapods`

**Files:**
- Create: `apps/web/ios/` (généré par Capacitor)

- [ ] **Step 1 : Builder le SPA**

```bash
pnpm --filter @f1-manager/web build
```

Expected : `apps/web/dist/` est créé avec `index.html` et les assets.

- [ ] **Step 2 : Ajouter la plateforme iOS**

```bash
cd apps/web
npx cap add ios
```

Expected output :
```
✔ Adding native ios project in ios in 145.19ms
✔ add in 145.34ms
✔ Copying web assets from dist to ios/App/App/public in 2.02s
✔ Creating capacitor.config.json in ios/App/App in 1.00ms
✔ copy ios in 2.04s
✔ Updating iOS native dependencies with pod install in 17.24s
✔ update ios in 17.26s
```

Un dossier `apps/web/ios/` est créé avec le projet Xcode.

- [ ] **Step 3 : Synchroniser les assets web**

```bash
npx cap sync ios
```

Expected : `✔ copy ios` et `✔ update ios` sans erreurs.

- [ ] **Step 4 : Vérifier `.gitignore`**

```bash
git status apps/web/ios/
```

Vérifier que `apps/web/ios/App/Pods/` n'apparaît **pas** dans les fichiers untracked (il doit être ignoré). Le dossier `apps/web/ios/App/App/` et `apps/web/ios/App/App.xcodeproj/` doivent apparaître.

- [ ] **Step 5 : Ouvrir dans Xcode**

```bash
npx cap open ios
```

Xcode s'ouvre avec le projet `App.xcodeproj`.

- [ ] **Step 6 : Lancer dans le simulateur iPhone**

Dans Xcode :
1. Sélectionner un simulateur iPhone (ex: iPhone 15) dans la barre en haut
2. Cliquer sur ▶ (Run) ou `Cmd+R`
3. Attendre que le simulateur démarre et l'app se charge

Vérifier visuellement :
- L'app se charge (écran dashboard)
- La bottom tab bar est visible en bas
- Les 6 onglets sont lisibles avec icône + label
- La safe area iOS (zone en bas sous la barre) est respectée — les onglets ne touchent pas le bas de l'écran
- Naviguer entre les onglets fonctionne

- [ ] **Step 7 : Committer le projet iOS**

```bash
cd apps/web
git add ios/App/App/ ios/App/App.xcodeproj/ ios/App/Podfile ios/App/Podfile.lock
git commit -m "feat: add Capacitor iOS native project"
```

---

## Récapitulatif des commandes utiles

```bash
# Rebuild + sync après modification du SPA
pnpm --filter @f1-manager/web build && npx --prefix apps/web cap sync ios

# Ouvrir Xcode
npx --prefix apps/web cap open ios

# Tout en une commande (depuis apps/web)
cd apps/web && pnpm ios
```
