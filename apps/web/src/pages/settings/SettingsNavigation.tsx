import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavOrder } from "@/lib/NavOrderContext";
import NavList from "@/components/NavList";
import { PencilIcon } from "@heroicons/react/24/outline";

export default function SettingsNavigation() {
  const { t } = useTranslation("settings");
  const { orderedItems, reorder } = useNavOrder();
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{t("navigation.order")}</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {t("navigation.hint")}
        </p>
        <div className="flex flex-col gap-1">
          <NavList
            items={orderedItems}
            activePath=""
            isEditMode={isEditMode}
            droppableId="settings-nav"
            onReorder={reorder}
            onItemClick={undefined}
          />
        </div>
      </div>
      <button
        onClick={() => setIsEditMode((p) => !p)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-fit ${
          isEditMode
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
      >
        <PencilIcon className="w-3.5 h-3.5" />
        {isEditMode ? t("navigation.finish") : t("navigation.edit")}
      </button>
    </div>
  );
}
