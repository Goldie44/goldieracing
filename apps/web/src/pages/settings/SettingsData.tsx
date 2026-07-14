import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/lib/BudgetContext";
import { useRace } from "@/lib/RaceContext";
import { useAtr } from "@/lib/AtrContext";
import { useProfile } from "@/lib/ProfileContext";
import SaveSlot, { type SaveSlotData } from "@/components/SaveSlot";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SAVES_KEY = "goldie_saves";
const MAX_SLOTS = 10;

function loadSlots(): SaveSlotData[] {
  try {
    const raw = localStorage.getItem(SAVES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function persistSlots(slots: SaveSlotData[]) {
  try { localStorage.setItem(SAVES_KEY, JSON.stringify(slots)); } catch {}
}

export default function SettingsData() {
  const { t } = useTranslation("settings");
  const { teamName, setTeamName } = useProfile();
  const { sections, totalBudget, setSections, setTotalBudget, reset: resetBudget } = useBudget();
  const { done, reset: resetRace } = useRace();
  const { atrData, setAtrData, reset: resetAtr } = useAtr();
  const [slots, setSlots] = useState<SaveSlotData[]>(loadSlots);
  const importRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const storage = window.app?.atrVisionApiKey;
    if (!storage) return;
    storage.load().then((value) => setApiKey(value ?? "")).catch(() => {});
  }, []);

  const handleApiKeyBlur = () => {
    void window.app?.atrVisionApiKey?.save(apiKey);
  };

  const updateSlots = (next: SaveSlotData[]) => {
    setSlots(next);
    persistSlots(next);
  };

  const handleNewSave = () => {
    if (slots.length >= MAX_SLOTS) return;
    const newSlot: SaveSlotData = {
      id: crypto.randomUUID(),
      name: `${t("data.saveNamePrefix")} ${new Date().toLocaleDateString("fr-FR")}`,
      createdAt: new Date().toISOString(),
      data: {
        teamName,
        budget: { sections: structuredClone(sections), totalBudget },
        race: { done: structuredClone(done) },
        atr: structuredClone(atrData),
      },
    };
    updateSlots([newSlot, ...slots]);
  };

  const handleLoad = (slot: SaveSlotData) => {
    if (slot.data.teamName) setTeamName(slot.data.teamName);
    setSections(slot.data.budget.sections as typeof sections);
    setTotalBudget(slot.data.budget.totalBudget);
    localStorage.setItem("goldie-racing:race-done", JSON.stringify(slot.data.race.done));
    setAtrData(slot.data.atr as typeof atrData);
    window.location.reload();
  };

  const handleRename = (id: string, name: string) => {
    updateSlots(slots.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleExport = (slot: SaveSlotData) => {
    const blob = new Blob([JSON.stringify(slot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slot.name.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    updateSlots(slots.filter((s) => s.id !== id));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const slot: SaveSlotData = JSON.parse(ev.target?.result as string);
        if (!slot.id || !slot.data) throw new Error("Format invalide");
        const imported: SaveSlotData = {
          ...slot,
          id: crypto.randomUUID(),
          name: `${slot.name}${t("data.importedSuffix")}`,
        };
        updateSlots([imported, ...slots].slice(0, MAX_SLOTS));
      } catch {
        alert(t("data.invalidFile"));
      }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-8 max-w-xl">

      {/* Sauvegardes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("data.saves", { count: slots.length, max: MAX_SLOTS })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => importRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground border border-border hover:text-foreground hover:bg-secondary transition-colors"
            >
              {t("data.importJson")}
            </button>
            <button
              onClick={handleNewSave}
              disabled={slots.length >= MAX_SLOTS}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("data.newSave")}
            </button>
          </div>
        </div>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
            {t("data.noSaves")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {slots.map((slot) => (
              <SaveSlot
                key={slot.id}
                slot={slot}
                onLoad={handleLoad}
                onRename={handleRename}
                onExport={handleExport}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reset */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t("data.resetTitle")}
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: t("data.resetBudgetLabel"), action: resetBudget, desc: t("data.resetBudgetDesc") },
            { label: t("data.resetRaceLabel"), action: resetRace, desc: t("data.resetRaceDesc") },
            { label: t("data.resetAtrLabel"), action: resetAtr, desc: t("data.resetAtrDesc") },
          ].map(({ label, action, desc }) => (
            <AlertDialog key={label}>
              <AlertDialogTrigger asChild>
                <button className="flex items-center justify-between px-4 py-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors text-left w-full">
                  <div>
                    <p className="text-sm font-medium text-destructive">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <span className="text-destructive/60 text-xs font-medium ml-4 flex-shrink-0">{t("data.resetArrow")}</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{label}</AlertDialogTitle>
                  <AlertDialogDescription>{`${desc} ${t("data.resetIrreversible")}`}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("data.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={action} className="bg-destructive hover:bg-destructive/90">
                    {t("data.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </div>
      </div>

      {/* IA Vision */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t("data.aiVisionTitle")}
        </p>
        <label className="block mb-1 text-sm font-medium">{t("data.aiVisionApiKeyLabel")}</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onBlur={handleApiKeyBlur}
          placeholder={t("data.aiVisionApiKeyPlaceholder")}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-1">{t("data.aiVisionApiKeyHint")}</p>
      </div>
    </div>
  );
}
