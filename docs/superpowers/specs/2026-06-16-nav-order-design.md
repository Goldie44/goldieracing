# Réordonnancement des pages du menu — Design

Date : 2026-06-16

## Contexte

Le menu de navigation (sidebar desktop + drawer mobile) affiche les pages de
l'app dans un ordre actuellement codé en dur dans le tableau `navItems` de
`apps/web/src/components/Layout.tsx`. L'utilisateur souhaite pouvoir
réorganiser cet ordre lui-même, et que ce choix soit conservé d'une session à
l'autre.

## Objectif

Permettre à l'utilisateur de glisser-déposer les entrées du menu pour changer
leur ordre d'affichage, avec persistance locale, sur desktop et mobile.

## Hors périmètre

- Pas de bouton "Réinitialiser l'ordre par défaut" (YAGNI — l'utilisateur peut
  re-glisser les items pour revenir à l'ordre voulu).
- Pas de synchronisation multi-appareils / backend (persistance locale au
  poste uniquement, comme les autres préférences UI de l'app).
- Pas de possibilité de masquer une page depuis ce mécanisme (uniquement
  réordonner).

## Approche retenue

Glisser-déposer directement dans le menu (sidebar desktop + drawer mobile),
activable via un mode édition explicite (bouton crayon), avec persistance
dans `localStorage`, en réutilisant la dépendance déjà installée
`@hello-pangea/dnd`.

### Alternatives écartées

- **Page Réglages avec boutons monter/descendre** : plus simple à coder mais
  moins agréable à l'usage ; écarté au profit du drag & drop direct.
- **Page Réglages avec liste réordonnable séparée** : évite de modifier la
  sidebar en direct, mais ajoute un détour (changer de page pour réordonner)
  jugé moins pratique que l'édition in-place.
- **Drag & drop toujours actif (sans mode édition)** : plus simple (pas de
  toggle) mais risque de déclenchement accidentel pendant la navigation
  normale ; écarté au profit d'un mode édition explicite.

## Architecture

### Source de vérité de l'ordre

- Clé `localStorage` : `goldie-racing:nav-order` — stocke un tableau ordonné
  d'identifiants de page (les `path` actuels, ex. `["/", "/calendar",
  "/stock", "/performance", "/budget", "/rd"]`).
- La liste *source* des pages (id, path, icône, label) reste définie en dur
  dans le code (elle ne change qu'avec des évolutions de l'app), mais elle
  est déplacée hors de `Layout.tsx` vers le nouveau contexte pour être
  réutilisable par desktop et mobile.
- Au chargement : fusion entre l'ordre sauvegardé et la liste source —
  - les ids sauvegardés qui existent encore dans la liste source sont
    affichés dans l'ordre sauvegardé ;
  - les pages de la liste source absentes de l'ordre sauvegardé (nouvelle
    page ajoutée par une mise à jour de l'app) sont ajoutées à la fin ;
  - les ids sauvegardés qui ne correspondent plus à aucune page (page
    supprimée par une mise à jour) sont ignorés.
- Cette fusion évite de casser l'affichage après une mise à jour de l'app qui
  ajoute/retire une page.

### Nouveau fichier : `apps/web/src/contexts/NavOrderContext.tsx`

- Exporte la liste source des pages (déplacée depuis `Layout.tsx`).
- `NavOrderProvider` : charge l'ordre depuis `localStorage` au montage,
  applique la fusion décrite ci-dessus, expose via un hook `useNavOrder()` :
  - `orderedItems` : la liste des pages dans l'ordre actuel (avec id, path,
    icon, label) ;
  - `reorder(fromIndex, toIndex)` : déplace un item et persiste
    immédiatement le nouvel ordre dans `localStorage`.
- Provider monté une seule fois, au-dessus de `Layout` (ou dans `App`), afin
  que desktop et mobile partagent le même état (un seul ordre global, pas de
  divergence entre les deux vues).

### Modifications : `apps/web/src/components/Layout.tsx`

- Supprime le tableau `navItems` local ; consomme `useNavOrder()` pour
  obtenir `orderedItems`.
- État local `isEditMode` (un seul état partagé entre la sidebar desktop et
  le drawer mobile, puisque les deux affichent le même contenu réordonné).
- Un bouton (icône crayon, heroicons) en bas de la sidebar desktop et dans le
  header du drawer mobile bascule `isEditMode`.
- Rendu de la liste de navigation :
  - **Mode normal** (actuel, inchangé) : chaque item est un `Link`
    cliquable, navigation au clic.
  - **Mode édition** : la liste est rendue dans un `DragDropContext` >
    `Droppable` > `Draggable` (`@hello-pangea/dnd`, déjà une dépendance du
    projet). Chaque item affiche une poignée de drag (`Bars2Icon`). La
    navigation par clic est désactivée pendant le drag (le `Link` est
    remplacé par un élément non navigable en mode édition, pour éviter les
    clics accidentels pendant qu'on cherche à saisir la poignée).
  - Au `onDragEnd`, appel à `reorder(source.index, destination.index)`.

### Pas de changement

- `apps/web/src/app.tsx` (les routes restent indépendantes de l'ordre
  d'affichage du menu).
- Aucun changement côté Electron (`apps/app`) : persistance 100% localStorage
  côté renderer, cohérent avec les patterns existants
  (`goldie-racing:race-done`, `goldie-racing:atr-data`).

## Vérification manuelle

1. Lancer l'app, ouvrir la sidebar desktop, activer le mode édition.
2. Glisser un item à une nouvelle position, désactiver le mode édition,
   vérifier que la navigation fonctionne toujours normalement.
3. Recharger l'app (ou redémarrer en dev) : l'ordre choisi doit être
   conservé.
4. Ouvrir le menu mobile (drawer) : vérifier qu'il reflète le même ordre que
   le desktop, et que le réordonnancement y fonctionne aussi (drag tactile).
5. Vérifier le comportement de fusion : ajouter temporairement une page
   factice à la liste source, recharger, vérifier qu'elle apparaît en fin de
   liste sans casser l'ordre existant ; la retirer, recharger, vérifier
   qu'aucune erreur ne survient.
