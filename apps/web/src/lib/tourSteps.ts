export const TOUR_ROUTES = [
  "/",
  "/calendar",
  "/stock",
  "/performance",
  "/budget",
  "/rd",
  "/strategy",
  "/settings",
] as const;

export type TourRoute = typeof TOUR_ROUTES[number];

export type TourStep = {
  id: string;
  path: TourRoute;
  targetId: string;
  titleKey: string;
  bodyKey: string;
};

const step = (id: string, path: TourRoute): TourStep => ({
  id,
  path,
  targetId: id,
  titleKey: `steps.${toCamelCase(id)}.title`,
  bodyKey: `steps.${toCamelCase(id)}.body`,
});

function toCamelCase(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export const tourSteps: TourStep[] = [
  step("nav-sidebar", "/"),
  step("dashboard-stats", "/"),
  step("dashboard-deficits", "/"),
  step("dashboard-next-race", "/"),
  step("dashboard-stock", "/"),
  step("calendar-list", "/calendar"),
  step("calendar-race-card", "/calendar"),
  step("budget-stats", "/budget"),
  step("budget-cap-usage", "/budget"),
  step("budget-allocation", "/budget"),
  step("rd-create-project", "/rd"),
  step("rd-active-projects", "/rd"),
  step("rd-aero-table", "/rd"),
  step("performance-atr-table", "/performance"),
  step("performance-import-screenshot", "/performance"),
  step("performance-dev-plan", "/performance"),
  step("stock-coverage-chart", "/stock"),
  step("stock-pieces-grid", "/stock"),
  step("strategy-params", "/strategy"),
  step("strategy-ranking", "/strategy"),
  step("strategy-optimal", "/strategy"),
  step("settings-tabs", "/settings"),
  step("settings-saves", "/settings"),
];
