# Local Game State Storage Design

## Goal

Persist the whole Goldie Racing game state locally in the Electron app with `better-sqlite3`, so user edits survive app restarts without a remote backend.

## Architecture

Use a single SQLite database in Electron's `app.getPath("userData")` directory. Store one JSON snapshot in a `game_state` table keyed by `id = "default"`. This keeps persistence simple while the game model is still evolving.

The Electron main process owns SQLite access. The renderer talks to it through IPC methods exposed by `preload.ts`.

## State Shape

The persisted snapshot contains:

- `budget`: budget sections and total budget.
- `races`: completed race ids.
- `stock`: current part counts and unit costs.
- `atr`: ATR/performance table values.
- `developmentProjects`: user-added performance development plan entries.
- `staff`: current staff data, seeded from static data for future editing.
- `rdProjects`: current R&D project data, seeded from the existing static page data.

Static source data remains in `f1Data.ts`. On first launch, the renderer builds a default game state from the existing data and saves it after loading confirms there is no SQLite state yet.

## Data Flow

1. Electron creates `GameStateStorage` at startup.
2. `preload.ts` exposes `window.app.gameState.load()`, `save(state)`, and `reset()`.
3. React loads the snapshot once at startup.
4. React pages read and update state through app contexts.
5. After initial load, state changes are saved automatically through IPC.

## Error Handling

If SQLite has no saved state, `load()` returns `null`.

If the saved JSON cannot be parsed or does not look like an object, `load()` returns `null` instead of crashing the app.

If a save fails, the renderer logs the error and keeps the in-memory state usable.

## Testing

Add Node tests for the Electron storage module:

- Save and reload a complete game state after closing and reopening SQLite.
- Return `null` when no state exists.
- Reset removes the saved state.
