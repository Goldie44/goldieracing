import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import SettingsAppearance from "./settings/SettingsAppearance";
import SettingsProfile from "./settings/SettingsProfile";
import SettingsData from "./settings/SettingsData";
import SettingsNavigation from "./settings/SettingsNavigation";

const TABS = [
  { id: "appearance", label: "🎨 Apparence" },
  { id: "profile", label: "🏎️ Profil" },
  { id: "data", label: "💾 Données" },
  { id: "navigation", label: "🧭 Navigation" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("appearance");

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Personnalise l'application" />

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
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "appearance" && <SettingsAppearance />}
      {activeTab === "profile" && <SettingsProfile />}
      {activeTab === "data" && <SettingsData />}
      {activeTab === "navigation" && <SettingsNavigation />}
    </div>
  );
}
