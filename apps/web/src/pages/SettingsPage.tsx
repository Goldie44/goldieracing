import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/PageHeader";
import SettingsAppearance from "./settings/SettingsAppearance";
import SettingsProfile from "./settings/SettingsProfile";
import SettingsData from "./settings/SettingsData";
import SettingsNavigation from "./settings/SettingsNavigation";
import SettingsLanguage from "./settings/SettingsLanguage";

const TABS = [
  { id: "appearance", labelKey: "tabs.appearance" },
  { id: "profile", labelKey: "tabs.profile" },
  { id: "data", labelKey: "tabs.data" },
  { id: "navigation", labelKey: "tabs.navigation" },
  { id: "language", labelKey: "tabs.language" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SettingsPage() {
  const { t } = useTranslation("settings");
  const [activeTab, setActiveTab] = useState<TabId>("appearance");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-8 mt-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "appearance" && <SettingsAppearance />}
      {activeTab === "profile" && <SettingsProfile />}
      {activeTab === "data" && <SettingsData />}
      {activeTab === "navigation" && <SettingsNavigation />}
      {activeTab === "language" && <SettingsLanguage />}
    </div>
  );
}
