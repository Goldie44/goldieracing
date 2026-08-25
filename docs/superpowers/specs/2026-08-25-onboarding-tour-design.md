# Didacticiel de première visite (onboarding tour)

## Contexte

L'application affiche déjà un `WelcomeDialog` au tout premier lancement (clé
localStorage `goldie-racing:onboarded`) pour créer une écurie et un
emplacement de sauvegarde. Il n'existe en revanche aucune visite guidée des
fonctionnalités : un nouveau joueur atterrit sur le Dashboard sans
explication du rôle des différentes pages (Budget, R&D, Performance, Stock,
Stratégie, Calendrier, Paramètres).

Ce document spécifie l'ajout d'un tour guidé de type "spotlight" qui met en
évidence, page par page, les éléments réels de l'interface.

## Objectif

Présenter les fonctionnalités principales de l'application à un nouvel
utilisateur juste après la création de son écurie, en navigant réellement
vers chaque page concernée et en mettant en évidence les sections clés de
son contenu, avec possibilité de passer ou de rejouer le tour plus tard.

## Mécanique générale

- Nouveau composant `TourOverlay`, accompagné d'un `TourContext` /
  `useTour()` (React Context, suivant le pattern déjà en place dans
  `apps/web/src/lib/` pour les autres contexts globaux). Monté globalement
  dans `app.tsx`, au même niveau que `WelcomeDialog`.
- **Déclenchement** :
  - Nouvel utilisateur : le tour démarre automatiquement juste après la
    fermeture (soumission) du `WelcomeDialog`.
  - Utilisateur déjà `onboarded` mais n'ayant jamais vu le tour (ex. mise à
    jour de l'application après cette fonctionnalité) : le tour démarre
    seul au prochain lancement, sur le Dashboard.
  - Persistance : nouvelle clé localStorage `goldie-racing:tour-completed`
    (indépendante de `goldie-racing:onboarded`), posée à `"true"` que le
    tour soit terminé ou passé (skip).
- **Navigation inter-pages** : chaque étape du tour référence un chemin de
  route ; si l'étape suivante appartient à une autre page, le tour navigue
  réellement vers cette route (via le router existant) avant d'afficher le
  spotlight, plutôt que de rester sur la page courante.
- **Ciblage des éléments** : les éléments mis en évidence portent un
  attribut `data-tour-id="<id>"` ajouté directement dans le JSX des pages
  concernées. Le tour localise l'élément par cet attribut, calcule sa
  position (`getBoundingClientRect`), l'amène dans le viewport si
  nécessaire (`scrollIntoView`), puis positionne le spotlight et la bulle
  d'explication en conséquence.
- **Rendu** : voile sombre plein écran avec une découpe autour de l'élément
  ciblé, bulle de texte positionnée à proximité (titre + description),
  transitions animées avec `framer-motion` (déjà une dépendance du
  projet).
- **Contrôles** : boutons Précédent / Suivant / Passer, indicateur de
  progression "Étape X / Y". La touche Échap équivaut à Passer. Un clic sur
  le voile sombre ne ferme pas le tour (évite une fermeture accidentelle).
- **Rejouer le tour** : un bouton "Revoir le tutoriel" est ajouté dans
  `apps/web/src/pages/settings/SettingsData.tsx`. Il réinitialise l'état du
  tour, navigue vers `/` et le relance depuis la première étape.

## Contenu du parcours (~23 étapes)

Une étape d'introduction sur la barre de navigation, puis un sous-ensemble
d'étapes par page, proportionné à sa richesse (les pages denses comme
Budget, R&D, Performance ou Stratégie ont plusieurs étapes ; Paramètres est
condensé en 2 étapes plutôt qu'une par sous-onglet).

| Page | Étapes | Cibles (`data-tour-id`) |
|---|---|---|
| Sidebar | 1 | Barre de navigation principale (`Layout.tsx` / `NavList.tsx`) |
| Dashboard | 4 | Stats du jour, Points faibles vs concurrents, Prochaine course, État des stocks |
| Calendrier | 2 | Liste des courses (réordonnable), types de course |
| Budget | 3 | Plafond/dépensé/restant, jauge d'utilisation du cap, détail par poste |
| R&D | 3 | Lancer un projet, projets en cours, tableau aérodynamique détaillé |
| Performance | 3 | Tableau de calibration ATR, import IA depuis capture d'écran, plan de développement |
| Stock | 2 | Grille des pièces (stock/durée de vie/coût), graphique de couverture |
| Stratégie | 3 | Paramètres course/pneus, classement des stratégies, bandeau stratégie optimale |
| Paramètres | 2 | Barre d'onglets de configuration, emplacements de sauvegarde (export/import) |

Chaque étape est définie par : `path` (route à atteindre), `targetId`
(valeur de `data-tour-id`), `title` et `body` (clés i18n).

## Internationalisation

- Nouveau namespace `tour.json` dans `apps/web/src/i18n/locales/{fr,en}/`,
  enregistré dans `apps/web/src/i18n/index.ts` comme les namespaces
  existants (`welcome`, `dashboard`, etc.).
- Contient : titre + texte pour chacune des ~23 étapes, ainsi que les
  libellés des contrôles (Suivant / Précédent / Passer / Terminer / "Étape
  {{current}} / {{total}}" / "Revoir le tutoriel").

## Hors périmètre

- `StaffPage.tsx` n'étant pas routée dans l'application, elle n'est pas
  incluse dans le tour.
- Pas de tour spécifique pour les sous-onglets individuels de Paramètres
  (Apparence, Profil, Navigation, Langue) : seule la barre d'onglets et les
  emplacements de sauvegarde sont mis en avant.
