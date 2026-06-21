import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  BoltIcon,
  CloudIcon,
  PlusIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import PageHeader from "../components/PageHeader";
import { calendar, tireStrategy } from "../lib/f1Data";

type Compound = "soft" | "medium" | "hard";

type Stint = {
  id: number;
  compound: Compound;
  lapIn: number;
};

type RaceStrategy = {
  compoundStart: Compound | null;
  stints: Stint[];
  notes: string;
};

type StrategyStore = Record<string, RaceStrategy>;

const STORAGE_KEY = "goldie-racing:tire-strategy";

const COMPOUND_COLORS: Record<Compound, string> = {
  soft: tireStrategy.soft.color,
  medium: tireStrategy.medium.color,
  hard: tireStrategy.hard.color,
};

const COMPOUND_LABELS: Record<Compound, string> = {
  soft: "S",
  medium: "M",
  hard: "H",
};

const COMPOUND_CYCLE: Compound[] = ["soft", "medium", "hard"];

const TYPE_CONFIG = {
  Rapide: { icon: BoltIcon, badge: "bg-red-500/15 text-red-400 border-red-500/20" },
  équilibre: { icon: ShieldCheckIcon, badge: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  Déportance: { icon: CloudIcon, badge: "bg-primary/15 text-primary border-primary/20" },
};

const races = [...calendar]
  .filter((r) => r.type !== "Test")
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

const defaultStrategy = (): RaceStrategy => ({
  compoundStart: null,
  stints: [],
  notes: "",
});

function loadStore(): StrategyStore {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function nextCompound(current: Compound | null): Compound {
  if (!current) return "soft";
  const idx = COMPOUND_CYCLE.indexOf(current);
  return COMPOUND_CYCLE[(idx + 1) % COMPOUND_CYCLE.length];
}

function CompoundBadge({
  compound,
  onClick,
  size = "md",
}: {
  compound: Compound | null;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";
  return (
    <button
      onClick={onClick}
      title="Cliquer pour changer le compound"
      className={`${dim} rounded-full border-2 font-bold flex items-center justify-center transition-all hover:scale-110 active:scale-95`}
      style={
        compound
          ? {
              borderColor: COMPOUND_COLORS[compound],
              backgroundColor: COMPOUND_COLORS[compound] + "33",
              color: COMPOUND_COLORS[compound],
            }
          : {
              borderColor: "hsl(var(--border))",
              backgroundColor: "transparent",
              color: "hsl(var(--muted-foreground))",
            }
      }
    >
      {compound ? COMPOUND_LABELS[compound] : "·"}
    </button>
  );
}

export default function StrategyPage() {
  const [store, setStore] = useState<StrategyStore>(loadStore);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error("Unable to save tire strategy", error);
    }
  }, [store]);

  const getStrategy = (id: number): RaceStrategy =>
    store[String(id)] ?? defaultStrategy();

  const updateStrategy = (id: number, patch: Partial<RaceStrategy>) => {
    setStore((prev) => ({
      ...prev,
      [String(id)]: { ...(prev[String(id)] ?? defaultStrategy()), ...patch },
    }));
  };

  const maxStints = Math.max(2, ...races.map((r) => getStrategy(r.id).stints.length));

  const cycleCompoundStart = (id: number) =>
    updateStrategy(id, { compoundStart: nextCompound(getStrategy(id).compoundStart) });

  const cycleStintCompound = (raceId: number, idx: number) => {
    const stints = getStrategy(raceId).stints.map((s, i) =>
      i === idx ? { ...s, compound: nextCompound(s.compound) } : s
    );
    updateStrategy(raceId, { stints });
  };

  const updateStintLap = (raceId: number, idx: number, lapIn: number) => {
    const stints = getStrategy(raceId).stints.map((s, i) =>
      i === idx ? { ...s, lapIn } : s
    );
    updateStrategy(raceId, { stints });
  };

  const addStint = (raceId: number) => {
    const stints = getStrategy(raceId).stints;
    updateStrategy(raceId, {
      stints: [...stints, { id: Date.now() + Math.random(), compound: "medium", lapIn: 0 }],
    });
  };

  const removeStint = (raceId: number, idx: number) => {
    const stints = getStrategy(raceId).stints.filter((_, i) => i !== idx);
    updateStrategy(raceId, { stints });
  };

  return (
    <div>
      <PageHeader title="Stratégie Pneus" subtitle="Planification des relais par course" />

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8">#</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Grand Prix</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Type</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Départ</th>
              {Array.from({ length: maxStints }).map((_, i) => (
                <th
                  key={i}
                  className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28"
                >
                  Relais {i + 1}
                </th>
              ))}
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-36">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {races.map((race, i) => {
              const strat = getStrategy(race.id);
              const typeConf = TYPE_CONFIG[race.type as keyof typeof TYPE_CONFIG];
              const TypeIcon = typeConf?.icon;

              return (
                <motion.tr
                  key={race.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/40 hover:bg-muted/10 transition-colors group"
                >
                  {/* # */}
                  <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground/50">
                    {String(i + 1).padStart(2, "0")}
                  </td>

                  {/* GP */}
                  <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                    {race.name}
                  </td>

                  {/* Type */}
                  <td className="px-3 py-2.5 text-center">
                    {typeConf && TypeIcon && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${typeConf.badge}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {race.type}
                      </span>
                    )}
                  </td>

                  {/* Compound de départ */}
                  <td className="px-3 py-2.5">
                    <div className="flex justify-center">
                      <CompoundBadge
                        compound={strat.compoundStart}
                        onClick={() => cycleCompoundStart(race.id)}
                      />
                    </div>
                  </td>

                  {/* Relais */}
                  {Array.from({ length: maxStints }).map((_, stintIdx) => {
                    const stint = strat.stints[stintIdx];
                    const isNext = stintIdx === strat.stints.length;

                    return (
                      <td key={stintIdx} className="px-2 py-2.5 text-center">
                        {stint ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                              <CompoundBadge
                                compound={stint.compound}
                                onClick={() => cycleStintCompound(race.id, stintIdx)}
                                size="sm"
                              />
                              <button
                                onClick={() => removeStint(race.id, stintIdx)}
                                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                              >
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </div>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={stint.lapIn === 0 ? "" : stint.lapIn}
                              onChange={(e) =>
                                updateStintLap(race.id, stintIdx, parseInt(e.target.value) || 0)
                              }
                              placeholder="T—"
                              className="w-12 bg-transparent border border-border/50 rounded px-1 py-0.5 text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/30"
                            />
                          </div>
                        ) : (
                          isNext && (
                            <button
                              onClick={() => addStint(race.id)}
                              className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                              title="Ajouter un relais"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </td>
                    );
                  })}

                  {/* Notes */}
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      value={strat.notes}
                      onChange={(e) => updateStrategy(race.id, { notes: e.target.value })}
                      placeholder="Notes..."
                      className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none focus:text-foreground placeholder:text-muted-foreground/25"
                    />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
