import { useRef, useState } from "react";
import { useBudget } from "@/lib/BudgetContext";
import { useRace } from "@/lib/RaceContext";
import { useAtr } from "@/lib/AtrContext";
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
  const { sections, totalBudget, setSections, setTotalBudget, reset: resetBudget } = useBudget();
  const { done, reset: resetRace } = useRace();
  const { atrData, setAtrData, reset: resetAtr } = useAtr();
  const [slots, setSlots] = useState<SaveSlotData[]>(loadSlots);
  const importRef = useRef<HTMLInputElement>(null);

  const updateSlots = (next: SaveSlotData[]) => {
    setSlots(next);
    persistSlots(next);
  };

  const handleNewSave = () => {
    if (slots.length >= MAX_SLOTS) return;
    const newSlot: SaveSlotData = {
      id: crypto.randomUUID(),
      name: `Sauvegarde ${new Date().toLocaleDateString("fr-FR")}`,
      createdAt: new Date().toISOString(),
      data: {
        budget: { sections: structuredClone(sections), totalBudget },
        race: { done: structuredClone(done) },
        atr: structuredClone(atrData),
      },
    };
    updateSlots([newSlot, ...slots]);
  };

  const handleLoad = (slot: SaveSlotData) => {
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
          name: `${slot.name} (importé)`,
        };
        updateSlots([imported, ...slots].slice(0, MAX_SLOTS));
      } catch {
        alert("Fichier JSON invalide.");
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
            Sauvegardes ({slots.length}/{MAX_SLOTS})
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => importRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground border border-border hover:text-foreground hover:bg-secondary transition-colors"
            >
              Importer JSON
            </button>
            <button
              onClick={handleNewSave}
              disabled={slots.length >= MAX_SLOTS}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Nouvelle sauvegarde
            </button>
          </div>
        </div>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
            Aucune sauvegarde. Crée-en une !
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
          Réinitialisation
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: "Reset Budget", action: resetBudget, desc: "Remet toutes les dépenses et allocations à zéro." },
            { label: "Reset Courses", action: resetRace, desc: "Décoche toutes les courses marquées comme terminées." },
            { label: "Reset ATR", action: resetAtr, desc: "Efface toutes les valeurs du tableau ATR." },
          ].map(({ label, action, desc }) => (
            <AlertDialog key={label}>
              <AlertDialogTrigger asChild>
                <button className="flex items-center justify-between px-4 py-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors text-left w-full">
                  <div>
                    <p className="text-sm font-medium text-destructive">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <span className="text-destructive/60 text-xs font-medium ml-4 flex-shrink-0">Réinitialiser →</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{label}</AlertDialogTitle>
                  <AlertDialogDescription>{desc} Cette action est irréversible.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={action} className="bg-destructive hover:bg-destructive/90">
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </div>
      </div>
    </div>
  );
}
