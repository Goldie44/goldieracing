import { createContext, useContext, useEffect, useState } from "react";
import {
  BeakerIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CubeIcon,
  FlagIcon,
  Squares2X2Icon,
  WalletIcon,
} from "@heroicons/react/24/outline";

const NAV_ORDER_STORAGE_KEY = "goldie-racing:nav-order";

export const settingsNavItem = {
  path: "/settings",
  icon: Cog6ToothIcon,
  labelKey: "nav.settings",
};

const navItemsSource = [
  { path: "/", icon: Squares2X2Icon, labelKey: "nav.dashboard" },
  { path: "/calendar", icon: CalendarDaysIcon, labelKey: "nav.calendar" },
  { path: "/stock", icon: CubeIcon, labelKey: "nav.stock" },
  { path: "/performance", icon: ChartBarIcon, labelKey: "nav.performance" },
  { path: "/budget", icon: WalletIcon, labelKey: "nav.budget" },
  { path: "/rd", icon: BeakerIcon, labelKey: "nav.rd" },
  { path: "/strategy", icon: FlagIcon, labelKey: "nav.strategy" },
];

const mergeOrder = savedPaths => {
  const remaining = new Map(navItemsSource.map(item => [item.path, item]));
  const ordered = [];

  for (const path of savedPaths) {
    const item = remaining.get(path);
    if (item) {
      ordered.push(item);
      remaining.delete(path);
    }
  }

  // Pages absentes de l'ordre sauvegardé (ajoutées par une mise à jour de
  // l'app depuis la dernière sauvegarde) sont ajoutées à la fin, dans leur
  // ordre source.
  for (const item of navItemsSource) {
    if (remaining.has(item.path)) ordered.push(item);
  }

  return ordered;
};

const loadStoredOrder = () => {
  if (typeof window === "undefined") return navItemsSource;

  try {
    const stored = window.localStorage.getItem(NAV_ORDER_STORAGE_KEY);
    if (!stored) return navItemsSource;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return navItemsSource;

    return mergeOrder(parsed);
  } catch (error) {
    console.error("Unable to load nav order", error);
    return navItemsSource;
  }
};

type NavOrderContextValue = {
  orderedItems: typeof navItemsSource;
  reorder: (from: number, to: number) => void;
  settingsItem: typeof settingsNavItem;
};

const NavOrderContext = createContext<NavOrderContextValue>(null!);

export function NavOrderProvider({ children }) {
  const [orderedItems, setOrderedItems] = useState(loadStoredOrder);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        NAV_ORDER_STORAGE_KEY,
        JSON.stringify(orderedItems.map(item => item.path))
      );
    } catch (error) {
      console.error("Unable to save nav order", error);
    }
  }, [orderedItems]);

  const reorder = (fromIndex, toIndex) => {
    setOrderedItems(prev => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  return (
    <NavOrderContext.Provider value={{ orderedItems, reorder, settingsItem: settingsNavItem }}>
      {children}
    </NavOrderContext.Provider>
  );
}

export function useNavOrder() {
  return useContext(NavOrderContext);
}
