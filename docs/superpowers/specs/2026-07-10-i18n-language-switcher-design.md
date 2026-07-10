# Sélecteur de langue (i18n) — Design

## Contexte

Goldie Racing (`apps/web`, Electron + React) n'a aucun système d'internationalisation :
tout le texte de l'interface est codé en dur en français dans le JSX. L'objectif est
d'ajouter un sélecteur de langue fonctionnel Français/Anglais dans la page Paramètres,
avec traduction complète de l'application (pas un simple toggle cosmétique).

`apps/app` (process principal Electron) désactive le menu natif
(`Menu.setApplicationMenu(null)` dans `main.ts`) : aucun texte à traduire côté Electron.
Tout le travail se situe dans `apps/web`.

## Approche retenue

**react-i18next** + `i18next-browser-languagedetector`, plutôt qu'un Context maison
(style `ThemeContext.tsx`). Justification : la bibliothèque gère nativement
l'interpolation, la détection de langue système et le découpage par namespaces,
ce qui réduit fortement le code à écrire/maintenir pour la vingtaine de fichiers
à traduire, comparé à une réimplémentation à la main.

## Langues

- Français (`fr`) — langue de repli (fallback).
- Anglais (`en`).
- Détection automatique à la première visite via `navigator.language`, retombant sur
  `fr` si la langue détectée n'est ni `fr` ni `en`.
- Choix persistant dans `localStorage`, clé `goldie-racing:language` (cohérent avec le
  préfixe `goldie-racing:` déjà utilisé par `ThemeContext`).

## Architecture

### Dépendances
Ajout à `apps/web/package.json` : `i18next`, `react-i18next`,
`i18next-browser-languagedetector`.

### Structure des fichiers
```
apps/web/src/i18n/
  index.ts                # init i18next (detector, fallback fr, namespaces)
  locales/
    fr/
      common.json
      layout.json
      dashboard.json
      budget.json
      calendar.json
      performance.json
      rd.json
      stock.json
      strategy.json
      staff.json
      settings.json
    en/
      (mêmes fichiers)
```

- `common` : termes partagés (boutons génériques, labels réutilisés, PageHeader,
  StatCard, ColorPicker).
- Un namespace par page principale (correspond aux fichiers `apps/web/src/pages/*.tsx`).
- `settings` couvre `SettingsPage.tsx` et ses 4 sous-onglets existants
  (`SettingsAppearance`, `SettingsProfile`, `SettingsData`, `SettingsNavigation`) plus
  le nouveau `SettingsLanguage`.
- `layout` couvre `Layout.tsx`, `NavList.tsx`, `WelcomeDialog.tsx`, `SaveSlot.tsx`.

### Initialisation
`apps/web/src/main.tsx` importe `./i18n` avant le rendu de `<App />`, pour que
i18next soit initialisé (langue détectée/chargée) avant le premier render.

### Composants migrés
Tous les fichiers contenant du texte UI en dur :
`Dashboard.tsx`, `StaffPage.tsx`, `BudgetPage.tsx`, `CalendarPage.tsx`,
`PerformancePage.tsx`, `RDPage.tsx`, `StockPage.tsx`, `StrategyPage.tsx`,
`SettingsPage.tsx` + 4 sous-onglets, `Layout.tsx`, `NavList.tsx`,
`WelcomeDialog.tsx`, `SaveSlot.tsx`, `PageHeader.tsx`, `StatCard.tsx`,
`ColorPicker.tsx`.

Chacun utilise le hook `useTranslation('<namespace>')` et remplace ses chaînes en
dur par `t('clé')`. Les clés utilisent des noms descriptifs en anglais
(`settings.language.title`, pas de texte français comme clé) pour éviter toute
ambiguïté quand le contenu français change.

### Nouveau sélecteur de langue
`apps/web/src/pages/settings/SettingsLanguage.tsx` — nouvel onglet "Langue" ajouté
dans `TABS` de `SettingsPage.tsx`. UI : deux boutons (🇫🇷 Français / 🇬🇧 English)
reprenant le pattern visuel du sélecteur de thème dans `SettingsAppearance.tsx`
(bordure/fond `primary` sur l'option active). Au clic : `i18n.changeLanguage(lang)`.

## Flux de données

1. Premier lancement : `i18next-browser-languagedetector` lit `localStorage` (vide),
   puis `navigator.language` → détermine `fr` ou `en`.
2. L'utilisateur change de langue dans Paramètres → `i18n.changeLanguage(lang)` →
   tous les composants utilisant `useTranslation()` re-render immédiatement (pas de
   reload de page) → le detector persiste le choix dans `localStorage`.
3. Redémarrage de l'app : le detector relit `localStorage` en priorité, donc la
   langue choisie est restaurée.

## Gestion d'erreurs

- Fallback i18next vers `fr` si une clé manque dans `en` (ou inversement) — évite un
  texte vide à l'écran.
- En dev, i18next logue un warning console pour toute clé manquante (`debug: true`
  seulement en mode dev via `import.meta.env.DEV`).

## Tests / vérification

Aucun framework de test UI existant identifié dans `apps/web`. Vérification manuelle
prévue après implémentation :
- Lancer l'app, parcourir chaque page en français puis en anglais.
- Confirmer qu'aucune chaîne française codée en dur ne subsiste dans les composants
  migrés.
- Confirmer que le switch est instantané (pas de reload) et persiste après
  redémarrage de l'app.

## Hors périmètre

- Autres langues que fr/en (structure extensible si besoin futur).
- Traduction de contenu généré dynamiquement depuis des données de jeu (ex. noms de
  pilotes, écuries) — hors sujet, ce sont des données pas du texte UI.
- `apps/app` (process principal Electron) — pas de texte UI, menu désactivé.
