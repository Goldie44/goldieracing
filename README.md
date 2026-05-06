# 🏎️ F1 Manager — Fantasy Formula 1 Team Manager

> Fantasy Formula 1 management game. Run your own constructor across a full season — manage the budget, hire staff, drive R&D, juggle stock, plan the calendar, and chase performance race after race.

This repository is a [Turborepo](https://turborepo.com/) + [pnpm](https://pnpm.io/) monorepo. The current generation of F1 Manager is a single-page web app built with React 18, Vite, TypeScript, [shadcn/ui](https://ui.shadcn.com/) and Tailwind CSS, with shared workspace packages for tooling.

## 📚 Table of Contents

- [✨ What it does](#-what-it-does)
- [🗂️ Repository Structure](#️-repository-structure)
- [🧱 Tech Stack](#-tech-stack)
- [🚀 Quickstart](#-quickstart)
- [🛠️ Development](#️-development)

## ✨ What it does

- 🏁 **Race weekends** — season calendar, race sessions, and live performance tracking
- 💰 **Budget cap** — sponsor income, expenditure breakdown, and cost-cap monitoring
- 👥 **Staff management** — drivers, engineers and mechanics with hiring, firing and contracts
- 🔬 **R&D** — research tree for chassis, power unit, aero and reliability upgrades
- 📦 **Stock** — parts inventory and consumption across the season
- 📊 **Dashboard** — at-a-glance KPIs powered by [Recharts](https://recharts.org/)
- 🗺️ **Circuits** — interactive track maps via [React Leaflet](https://react-leaflet.js.org/)
- 🔐 **Auth & protected routes** — context-based session handling with route guards
- 💳 **Stripe** — payment integration for premium features
- 📄 **Exports** — race reports and standings as PDF (`jspdf` + `html2canvas`)

## 🗂️ Repository Structure

```
apps/
  web/             # React 18 + Vite + TypeScript SPA — operator console
                   #   shadcn/ui • Tailwind • TanStack Query • React Router v6

packages/
  eslint/          # @f1-manager/eslint     — shared ESLint config
  typescript/      # @f1-manager/typescript — shared tsconfig presets
```

## 🧱 Tech Stack

| Layer            | Choice                                                |
| ---------------- | ----------------------------------------------------- |
| Build & monorepo | pnpm workspaces • Turborepo                           |
| Frontend         | React 18 • Vite 6 • TypeScript 5                      |
| UI               | shadcn/ui (Radix primitives) • Tailwind CSS • Lucide  |
| State & data     | TanStack Query • React Context • `react-hook-form`   |
| Validation       | Zod                                                   |
| Routing          | React Router v6                                       |
| Visualisation    | Recharts • Three.js • Framer Motion • Embla Carousel  |
| Maps             | React Leaflet                                         |
| Payments         | Stripe (`@stripe/react-stripe-js`)                    |

## 🚀 Quickstart

```bash
git clone <repository-url>
cd f1-manager
pnpm install
```

Start the web app:

```bash
pnpm --filter @f1-manager/web dev
```

The dev server starts on the port reported by Vite (default `http://localhost:5173`).

## 🛠️ Development

Scripts exposed by the `@f1-manager/web` workspace:

| Command                                     | Description                    |
| ------------------------------------------- | ------------------------------ |
| `pnpm --filter @f1-manager/web dev`         | Start the Vite dev server      |
| `pnpm --filter @f1-manager/web build`       | Production build               |
| `pnpm --filter @f1-manager/web preview`     | Preview the production build   |
| `pnpm --filter @f1-manager/web lint`        | Run ESLint                     |
| `pnpm --filter @f1-manager/web lint:fix`    | Run ESLint with autofix        |
| `pnpm --filter @f1-manager/web typecheck`   | Type-check with `tsc --noEmit` |

Turborepo tasks (run from the repo root, applied across all workspaces):

```bash
turbo run dev      # parallel dev across apps
turbo run build    # build everything (cached)
turbo run lint     # lint everything
turbo run format   # format everything
```
