# Spec — Import ATR depuis capture d'écran (IA Vision)

**Date :** 2026-07-14
**Projet :** Goldie Racing F1 Manager
**Statut :** Approuvé

---

## Vue d'ensemble

Sur la page Performance, le tableau ATR (`AtrCalTable` dans `PerformancePage.tsx`) demande de saisir manuellement, pour chaque ligne (Vitesse max, Accélération, DRS, virages, Dirty air, Préservation, Refroidissement, Poids), deux valeurs : **v1** (Monoplace) et **moyenne** (Concurrent). Ces valeurs sont lues à l'œil sur un écran de comparaison technique du jeu.

Cette fonctionnalité ajoute un bouton **"Importer depuis capture d'écran"** qui envoie une capture collée depuis le presse-papier à une IA vision (API Anthropic), extrait automatiquement les valeurs v1/moyenne de chaque ligne, et les propose en aperçu éditable avant de les appliquer au tableau.

Colonnes hors scope (non saisies manuellement dans l'UI actuelle, donc non concernées par l'extraction) :
- `gainsAttendus` — alimenté automatiquement par les projets R&D (`addProjectGains`/`subtractProjectGains`)
- `delta` / `cd` / `deltaCD` — calculés à la volée (`calcDelta`), jamais stockés ni saisis

---

## Architecture

### Stockage de la clé API
- Nouveau champ **"Clé API IA (Vision)"** dans les Settings (page Paramètres existante).
- Persistée côté process principal Electron, dans le même fichier JSON que le reste des données locales (extension de `apps/app/src/storage.ts` : `loadApiKey` / `saveApiKey`).
- Exposée au renderer via IPC, sur le modèle des handlers `budget-*` existants dans `apps/app/src/main.ts` :
  - `settings-api-key:load`
  - `settings-api-key:save`

### Appel vision (process principal)
- Nouveau handler IPC `atr-vision:extract` dans `main.ts`.
- Reçoit du renderer l'image collée encodée en base64.
- Appelle l'API Anthropic côté Node via le SDK `@anthropic-ai/sdk` (nouvelle dépendance), modèle vision (ex. `claude-sonnet-5`), avec :
  - l'image en pièce jointe du message,
  - un prompt système décrivant précisément l'écran de comparaison technique du jeu (layout fixe, toujours le même écran) et la structure JSON de sortie attendue : un tableau d'entrées `{ section, label, v1, moyenne }` correspondant aux lignes de `initialSections` (`apps/web/src/lib/AtrContext.tsx`).
- Le handler parse la réponse JSON du modèle et la retourne au renderer telle quelle. En cas de JSON invalide ou de réponse non conforme, il retourne une erreur explicite plutôt que de tenter de deviner une structure.
- La clé API n'est jamais exposée au renderer / devtools : tout l'appel réseau vit dans le process principal.

---

## UI & flux utilisateur

1. Bouton **"Importer depuis capture d'écran"** à côté du titre/actions du tableau ATR sur la page Performance.
2. Ouvre un `Dialog` (composant existant `apps/web/src/components/ui/dialog.tsx`) avec une zone "Collez votre capture d'écran ici (Ctrl+V)".
   - Écoute l'événement `paste`, extrait l'image du presse-papier (`clipboardData.items`), l'affiche en miniature dans le dialog.
3. Bouton **"Analyser"** :
   - Désactivé tant qu'aucune image n'est collée, ou qu'aucune clé API n'est configurée (dans ce dernier cas, message renvoyant vers Settings).
   - Envoie l'image en base64 via IPC `atr-vision:extract`, affiche un état de chargement (spinner, bouton désactivé) pendant l'appel.
4. **Aperçu avant application** : la réponse extraite remplit un état temporaire, affiché comme une mini-table reprenant les lignes de `initialSections` avec des champs `v1`/`moyenne` pré-remplis et éditables. L'utilisateur peut corriger une valeur mal lue.
5. Bouton **"Appliquer"** : merge les valeurs de l'aperçu dans `atrData` via `setAtrData` (seuls `v1` et `moyenne` sont écrasés ; `gainsAttendus`/`delta`/`cd`/`deltaCD` ne sont pas touchés). Bouton **"Annuler"** : ferme le dialog sans rien modifier.

---

## Gestion des erreurs

| Cas | Comportement |
|---|---|
| Pas de clé API configurée | Bouton "Analyser" désactivé + message renvoyant vers Settings |
| Clé API invalide / erreur d'authentification | Message d'erreur affiché dans le dialog, image conservée pour réessayer après correction de la clé |
| Erreur réseau / rate limit | Message d'erreur affiché, bouton "Réessayer" (relance l'appel sans recoller l'image) |
| Réponse JSON malformée ou champs manquants | Les lignes concernées restent vides dans l'aperçu ; l'utilisateur les complète manuellement, pas de blocage de tout le flux |

---

## Coût & performance

Un appel = une image (~1-1.5k tokens) + un prompt système court. Coût de l'ordre de quelques centimes par import, pas de traitement local lourd (aucun modèle embarqué, tout se fait via l'API distante). Négligeable pour un usage ponctuel déclenché manuellement par capture d'écran.

---

## Tests

- Tests unitaires sur la fonction de parsing/merge de la réponse JSON vers `atrData` : cas nominal, champs manquants, JSON invalide (ne doit pas planter, doit laisser les champs concernés vides).
- L'appel IPC/API réel n'est pas couvert par des tests automatisés (dépend d'une clé API et d'un service externe) — validation manuelle via `/run` avec une véritable capture d'écran du jeu.
