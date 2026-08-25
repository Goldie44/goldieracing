import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonFr from "./locales/fr/common.json";
import layoutFr from "./locales/fr/layout.json";
import settingsFr from "./locales/fr/settings.json";
import welcomeFr from "./locales/fr/welcome.json";
import dashboardFr from "./locales/fr/dashboard.json";
import staffFr from "./locales/fr/staff.json";
import budgetFr from "./locales/fr/budget.json";
import calendarFr from "./locales/fr/calendar.json";
import performanceFr from "./locales/fr/performance.json";
import rdFr from "./locales/fr/rd.json";
import stockFr from "./locales/fr/stock.json";
import strategyFr from "./locales/fr/strategy.json";
import notfoundFr from "./locales/fr/notfound.json";
import tourFr from "./locales/fr/tour.json";

import commonEn from "./locales/en/common.json";
import layoutEn from "./locales/en/layout.json";
import settingsEn from "./locales/en/settings.json";
import welcomeEn from "./locales/en/welcome.json";
import dashboardEn from "./locales/en/dashboard.json";
import staffEn from "./locales/en/staff.json";
import budgetEn from "./locales/en/budget.json";
import calendarEn from "./locales/en/calendar.json";
import performanceEn from "./locales/en/performance.json";
import rdEn from "./locales/en/rd.json";
import stockEn from "./locales/en/stock.json";
import strategyEn from "./locales/en/strategy.json";
import notfoundEn from "./locales/en/notfound.json";
import tourEn from "./locales/en/tour.json";

const resources = {
  fr: {
    common: commonFr, layout: layoutFr, settings: settingsFr, welcome: welcomeFr,
    dashboard: dashboardFr, staff: staffFr, budget: budgetFr, calendar: calendarFr,
    performance: performanceFr, rd: rdFr, stock: stockFr, strategy: strategyFr,
    notfound: notfoundFr, tour: tourFr,
  },
  en: {
    common: commonEn, layout: layoutEn, settings: settingsEn, welcome: welcomeEn,
    dashboard: dashboardEn, staff: staffEn, budget: budgetEn, calendar: calendarEn,
    performance: performanceEn, rd: rdEn, stock: stockEn, strategy: strategyEn,
    notfound: notfoundEn, tour: tourEn,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    ns: Object.keys(resources.fr),
    defaultNS: "common",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "goldie-racing:language",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
    debug: import.meta.env.DEV,
  });

export default i18n;
