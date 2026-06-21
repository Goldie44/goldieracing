# Spec — Intégration Capacitor iOS

**Date :** 2026-06-21
**Projet :** Goldie Racing F1 Manager
**Statut :** Approuvé

---

## Vue d'ensemble

Wrapper le SPA React (`apps/web`) en application iOS native via Capacitor, sans modifier l'app Electron desktop existante. L'intégration inclut la navigation mobile (bottom tab bar) pour rendre l'app utilisable sur iPhone dès le premier build.

---

## Périmètre

**Inclus :**
- Installation et configuration de Capacitor dans `apps/web`
- Projet Xcode iOS généré (`apps/web/ios/`)
- Composant `BottomNav` pour la navigation mobile
- Modification conditionnelle de `Layout.tsx` (sidebar desktop / bottom tabs mobile)
- Scripts de build iOS dans `apps/web/package.json`

**Exclus :**
- Persistance des données sur iOS (traité séparément — `window.app` absent, données non sauvegardées entre sessions)
- Android
- Notifications push, caméra, ou autres plugins Capacitor natifs
- CI/CD pour iOS

---

## Architecture

### Localisation Capacitor

Capacitor est installé directement dans `apps/web` (pas de nouveau workspace). Le projet Xcode natif vit dans `apps/web/ios/`.

```
apps/web/
├── capacitor.config.ts       ← configuration Capacitor
├── ios/                      ← projet Xcode (généré, gitignored partiellement)
│   └── App/
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx     ← nouveau
│   │   ├── Layout.tsx        ← modifié
│   │   └── NavList.tsx       ← inchangé
│   └── hooks/
│       └── use-mobile.tsx    ← inchangé
└── package.json              ← ajout dépendances + scripts
```

### `capacitor.config.ts`

```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goldieracing.app',
  appName: 'Goldie Racing',
  webDir: 'dist',
};

export default config;
```

---

## Composants

### `BottomNav.tsx`

Nouveau composant affiché uniquement sur mobile. Lit l'ordre des pages depuis `NavOrderContext` (même source que `NavList`), affiche les 6 premières entrées comme tabs avec icône + label court.

- Position : `fixed bottom-0 w-full`
- Safe area iOS : `padding-bottom: env(safe-area-inset-bottom)`
- Route active : détectée via `useLocation()` de react-router-dom
- Le contenu principal reçoit `pb-20` pour ne pas passer sous la tab bar

### `Layout.tsx` — modification

```tsx
const isMobile = useMobile();

return (
  <div>
    {!isMobile && <NavList />}
    <main className={isMobile ? 'pb-20' : 'ml-[sidebar-width]'}>
      {children}
    </main>
    {isMobile && <BottomNav />}
  </div>
);
```

`NavList` reste intact — aucune régression desktop.

---

## Pipeline de build

### Workflow iOS (manuel)

```bash
# 1. Build du SPA
pnpm --filter @f1-manager/web build

# 2. Synchroniser avec le projet Xcode
npx cap sync ios

# 3. Ouvrir Xcode
npx cap open ios
```

Puis dans Xcode : choisir un simulateur ou device, ▶ Run.

### Scripts `apps/web/package.json`

```json
"cap:sync": "cap sync",
"cap:open": "cap open ios",
"ios": "pnpm build && cap sync ios && cap open ios"
```

### Turborepo

`cap sync` n'entre pas dans `turbo.json` — c'est une commande post-build manuelle. Le pipeline turbo existant est inchangé.

---

## Dépendances à installer

Dans `apps/web` :

```bash
pnpm add @capacitor/core @capacitor/ios
pnpm add -D @capacitor/cli
```

---

## Comportement sur iOS vs Desktop

| Fonctionnalité | Desktop (Electron) | iOS (Capacitor) |
|---|---|---|
| Navigation | Sidebar `NavList` | Bottom tabs `BottomNav` |
| Persistance budget | SQLite via `window.app` | Aucune (données perdues à la fermeture) |
| Thème / apparence | Context (localStorage) | Context (localStorage — WebView) |
| Export PDF | jsPDF + html2canvas | À tester |
| React Leaflet | OK | À tester WebView |

---

## Points d'attention

- **`window.app` absent sur iOS** : `BudgetContext` est déjà défensif (`if (!storage) return`), aucune modification nécessaire. Les données budget ne persistent pas — comportement documenté et attendu à ce stade.
- **`ios/` dans git** : committer `ios/App/App/` et `ios/App/App.xcodeproj/`, ignorer `ios/App/Pods/` et `ios/DerivedData/`.
- **Xcode requis** : macOS uniquement pour builder et soumettre sur l'App Store. Pas de build iOS sur Windows.
