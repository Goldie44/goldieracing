# Page Stratégie Pneus — Design Spec

**Date:** 2026-06-21  
**Statut:** Approuvé

---

## Objectif

Ajouter une page `/strategy` permettant de planifier et saisir la stratégie pneus race par race pour la saison 2023. L'utilisateur peut définir le compound de départ, les relais (compound + tour d'arrêt) et des notes libres pour chaque GP.

---

## Architecture

### Données

Pas de nouveau Context React. Les données sont gérées localement dans `StrategyPage` avec `useState` + `localStorage`.

**Clé localStorage :** `goldie-racing:tire-strategy`

**Type stocké :** `Record<string, RaceStrategy>` (clé = `race.id` en string)

```ts
type Compound = "soft" | "medium" | "hard";

type Stint = {
  compound: Compound;
  lapIn: number; // tour d'arrêt aux stands
};

type RaceStrategy = {
  compoundStart: Compound | null;
  stints: Stint[];
  notes: string;
};
```

La valeur par défaut pour une course non planifiée est `{ compoundStart: null, stints: [], notes: "" }`.

### Fichiers créés

- `apps/web/src/pages/StrategyPage.tsx` — composant principal de la page

### Fichiers modifiés

- `apps/web/src/app.tsx` — ajout route `/strategy`
- `apps/web/src/lib/NavOrderContext.tsx` — ajout item nav `/strategy`

---

## UI

### Layout

- **Desktop (md+) :** 2 colonnes côte à côte
  - Colonne gauche (~40%) : liste scrollable des courses
  - Colonne droite (~60%) : panneau d'édition de la course sélectionnée
- **Mobile :** une colonne. Vue liste par défaut, tap sur une course affiche le panneau (même page, state `selectedRaceId`). Bouton "← Retour" pour revenir à la liste.

### Liste des courses (colonne gauche)

- Triée par date croissante (même ordre que CalendarPage)
- Exclut les Tests (`race.type !== "Test"`)
- Chaque item : card `rounded-xl border` avec :
  - Nom du GP
  - Circuit (sous-titre gris)
  - Badge compound de départ coloré si renseigné, sinon badge gris "Non planifié"
- Course sélectionnée : `border-primary/60 bg-primary/5`

### Panneau d'édition (colonne droite)

**Header :**
- Nom du GP + circuit
- Badge type de circuit (Rapide / Équilibre / Déportance) avec les couleurs existantes de CalendarPage

**Compound de départ :**
- 3 boutons toggle : `S` (rouge), `M` (jaune), `H` (blanc/gris clair)
- Couleurs F1 standard : soft `#ef4444`, medium `#eab308`, hard `#e2e8f0`
- Un seul sélectionnable à la fois

**Relais :**
- Liste de cards, une par relais
- Chaque card : select compound (S/M/H) + input numérique "Tour d'arrêt" + bouton `×` (supprimer)
- Bouton `+ Ajouter un relais` en bas de la liste
- Pas de limite de relais

**Notes :**
- `<textarea>` libre, placeholder "Notes de stratégie..."

**Sauvegarde :** automatique à chaque changement (pas de bouton "Enregistrer").

---

## Intégration navigation

Icône : `MapIcon` de `@heroicons/react/24/outline` (ou `TrophyIcon` si MapIcon indisponible)  
Label : `"Stratégie"`  
Path : `/strategy`  

Ajouté dans `navItemsSource` dans `NavOrderContext.tsx`. Apparaît en dernière position par défaut, l'utilisateur peut le réordonner via le drag-and-drop existant.

---

## Contraintes & décisions

- **Pas de recommandation calculée** — saisie manuelle uniquement (scope B de la question 3)
- **Pas de météo ni résultat réel** — hors scope pour cette version
- **Tests exclus** — la page pré-saison "Pre-season Testing" n'apparaît pas dans la liste
- **Compound null autorisé** — une course peut rester "Non planifiée" sans bloquer la sauvegarde
- **localStorage only** — cohérent avec le reste de l'app (pas de backend)
