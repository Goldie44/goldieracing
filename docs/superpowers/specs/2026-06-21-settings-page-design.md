# Spec — Page Paramètres

**Date :** 2026-06-21
**Projet :** Goldie Racing F1 Manager
**Statut :** Approuvé

---

## Vue d'ensemble

Nouvelle page `/settings` accessible depuis la sidebar (icône engrenage). Mise en page par onglets (4 onglets). Le bouton "Modifier l'ordre" disparaît du bas de la sidebar — la fonctionnalité est déplacée dans l'onglet Navigation.

---

## Route & navigation

- Route : `/settings`
- Ajout dans `NavOrderContext` / `NavOrderProvider` comme page fixe (non réordonnable)
- Icône dans la sidebar : `Cog6ToothIcon` (Heroicons)
- La page est **exclue du drag-and-drop** (toujours en dernier dans la nav)

---

## Structure — 4 onglets

### 🎨 Onglet Apparence

#### Thème
Trois boutons radio visuels : **Sombre** / **Clair** / **Système**.
Persisté dans `localStorage` via un `ThemeContext` (nouveau). Appliqué sur `<html>` via la classe `dark`.

#### Couleur d'accent
- Barre arc-en-ciel cliquable (teinte HSL 0→360)
- Barre de luminosité dessous (10%→90%)
- Champ hex manuel (25% de la largeur des barres) + bouton "OK"
- Les barres occupent 50% de la largeur du conteneur
- Aperçu en temps réel : carré couleur + code hex
- Couleur stockée en CSS custom property `--color-primary` sur `:root`

#### Police
- Deux menus déroulants côte à côte :
  - **Famille** : Inter (défaut), Roboto Mono, Space Grotesk, Orbitron, Rajdhani, Georgia, Système
  - **Taille** : Très petite (11px), Petite (13px), Normale (15px), Grande (17px), Très grande (20px)
- Aperçu live sous les menus : texte "F1 Manager 2023 · Goldie Racing"
- Appliqué via CSS custom properties `--font-family` / `--font-size-base` sur `:root`

#### Image de fond
- Zone de drop/click (180px × 55px) pour charger une image locale
- Slider **Opacité** (0%→100%, défaut 40%) — même largeur que la zone de drop
- Slider **Flou** (0%→100% affiché, mappé sur 0→20px CSS) — même largeur
- Bouton **"🎨 Matcher la couleur d'accent"** (visible uniquement si image chargée) — extrait la couleur dominante via Canvas (quantification en buckets de 32 niveaux, noirs/blancs exclus) et l'applique à la couleur d'accent
- Bouton **"🗑️ Supprimer"** pour retirer l'image
- Image stockée en base64 dans `localStorage`

---

### 🏎️ Onglet Profil

| Champ | Type | Valeur par défaut |
|---|---|---|
| Nom de l'équipe | Input texte | "Goldie Racing" |
| Saison active | Select | 2023 |

Persisté dans `localStorage` via un `ProfileContext` (nouveau). Le nom d'équipe est affiché dans le header de la sidebar.

---

### 💾 Onglet Données

#### Sauvegardes multiples
- Liste des **slots de sauvegarde** (nom + date de création)
- Actions par slot : **Charger**, **Renommer**, **Exporter en JSON**, **Supprimer**
- Bouton **"+ Nouvelle sauvegarde"** : crée un slot avec snapshot de l'état courant (budget, courses, ATR)
- Bouton **"Importer un fichier JSON"** : charge un fichier comme nouveau slot
- Maximum 10 slots (UI indique le compteur)
- Slots stockés dans `localStorage` (clé `goldie_saves`)

#### Reset
Trois boutons destructifs (rouge, avec `AlertDialog` de confirmation) :
- **Reset Budget** → réinitialise `BudgetContext`
- **Reset Courses** → réinitialise `RaceContext`
- **Reset ATR** → réinitialise `AtrContext`

---

### 🧭 Onglet Navigation

- Reprend exactement le composant `NavList` en mode `isEditMode=true` (drag-and-drop `@hello-pangea/dnd`)
- Bouton "Terminer" pour quitter le mode édition
- Le bouton "Modifier l'ordre" est **retiré du bas de la sidebar desktop et mobile**
- L'état d'édition est local à cet onglet (pas besoin de le propager)

---

## Persistance

| Donnée | Mécanisme |
|---|---|
| Thème | `localStorage` → `ThemeContext` |
| Couleur d'accent | `localStorage` → CSS custom property |
| Police (famille + taille) | `localStorage` → CSS custom property |
| Image de fond | `localStorage` (base64) |
| Nom d'équipe / Saison | `localStorage` → `ProfileContext` |
| Sauvegardes | `localStorage` (clé `goldie_saves`) |
| Ordre nav | déjà géré par `NavOrderContext` |

---

## Nouveaux contextes

- **`ThemeContext`** — thème actif + setTheme
- **`ProfileContext`** — nom équipe + saison
- **`AppearanceContext`** — couleur, police, image de fond (ou tout dans `localStorage` direct si trop léger)

---

## Composants

- `SettingsPage.tsx` — page principale, gère l'onglet actif
- `SettingsAppearance.tsx` — onglet Apparence
- `SettingsProfile.tsx` — onglet Profil
- `SettingsData.tsx` — onglet Données (sauvegardes + resets)
- `SettingsNavigation.tsx` — onglet Navigation (réutilise NavList)
- `ColorPicker.tsx` — barre arc-en-ciel + luminosité + hex (composant réutilisable)
- `SaveSlot.tsx` — ligne d'un slot de sauvegarde

---

## Ce qui change dans les fichiers existants

- `Layout.tsx` — retirer le bouton "Modifier l'ordre" desktop et mobile
- `app.tsx` — ajouter la route `/settings` + les nouveaux providers
- `NavOrderContext.tsx` — exclure `/settings` du drag-and-drop si nécessaire
