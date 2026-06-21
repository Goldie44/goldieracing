import { useState } from "react";
import { PencilIcon, ArrowDownTrayIcon, TrashIcon } from "@heroicons/react/24/outline";

export type SaveSlotData = {
  id: string;
  name: string;
  createdAt: string; // ISO string
  data: {
    budget: { sections: unknown[]; totalBudget: number };
    race: { done: Record<string, boolean> };
    atr: unknown[];
  };
};

type Props = {
  slot: SaveSlotData;
  onLoad: (slot: SaveSlotData) => void;
  onRename: (id: string, name: string) => void;
  onExport: (slot: SaveSlotData) => void;
  onDelete: (id: string) => void;
};

export default function SaveSlot({ slot, onLoad, onRename, onExport, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(slot.name);

  const commitRename = () => {
    setEditing(false);
    if (name.trim() && name !== slot.name) onRename(slot.id, name.trim());
    else setName(slot.name);
  };

  const date = new Date(slot.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors">
      {editing ? (
        <input
          autoFocus
          className="flex-1 bg-transparent border-b border-primary outline-none text-sm text-foreground"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => e.key === "Enter" && commitRename()}
        />
      ) : (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{slot.name}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
      )}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onLoad(slot)}
          className="px-2 py-1 rounded text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          Charger
        </button>
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Renommer"
        >
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onExport(slot)}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Exporter JSON"
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(slot.id)}
          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Supprimer"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
