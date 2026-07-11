import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  BoltIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CloudIcon,
  MapPinIcon,
  ShieldCheckIcon,
  StopCircleIcon,
} from "@heroicons/react/24/outline";
import { useRace } from "../lib/RaceContext";
import PageHeader from "../components/PageHeader";
import { calendar } from "../lib/f1Data";
import moment from "moment";
import { useTranslation } from "react-i18next";

const typeConfig = {
  "Rapide": { icon: BoltIcon, badge: "bg-red-500/15 text-red-400 border-red-500/20" },
  "équilibre": { icon: ShieldCheckIcon, badge: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  "Déportance": { icon: CloudIcon, badge: "bg-primary/15 text-primary border-primary/20" },
  "Test": { icon: CalendarDaysIcon, badge: "bg-muted text-muted-foreground border-border" },
};

const STORAGE_KEY = "calendarOrder";

export default function CalendarPage() {
  const { t } = useTranslation("calendar");
  const { done, toggle } = useRace();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [races, setRaces] = useState(() => {
    const initial = [...calendar].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (typeof window === "undefined") return initial;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids: number[] = JSON.parse(stored);
        const ordered = ids
          .map((id) => initial.find((race) => race.id === id))
          .filter((race): race is typeof calendar[number] => Boolean(race));
        const remaining = initial.filter((race) => !ids.includes(race.id));
        return [...ordered, ...remaining];
      }
    } catch {
      // ignore invalid stored order
    }
    return initial;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(races.map((race) => race.id)));
  }, [races]);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (index: number) => {
    setDragOverIndex(null);
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }

    setRaces((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="mb-6 text-sm text-muted-foreground">{t("dragHint")}</div>

      <div className="space-y-3">
        {races.map((race, i) => {
          const config = typeConfig[race.type] || typeConfig["Test"];
          const TypeIcon = config.icon;

          return (
            <motion.div
              key={race.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              onDragEnter={() => handleDragEnter(i)}
              onDragLeave={() => handleDragLeave(i)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(i)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-card border rounded-xl p-4 md:p-5 transition-all group ${
                done[race.id] ? 'border-green-500/30 opacity-60' : 'border-border hover:border-primary/20'
              } ${dragIndex === i ? 'opacity-60 bg-primary/10' : ''} ${dragOverIndex === i ? 'border-dashed border-primary/60 bg-primary/5' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                {/* Checkbox */}
                <button onClick={() => toggle(race.id)} className="flex-shrink-0">
                  {done[race.id]
                    ? <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    : <StopCircleIcon className="w-5 h-5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />}
                </button>
                {dragOverIndex === i && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary border border-primary/20 rounded-full px-2 py-1 bg-primary/10">{t("dropHere")}</span>
                )}
                {/* Race Number */}
                <div className="flex items-center gap-4 md:w-12">
                  <span className="text-2xl font-bold font-mono text-muted-foreground/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Race Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {race.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPinIcon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">{race.circuit}</span>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {moment(race.date).format("DD MMM")}
                    </div>
                    <div className="text-xs text-muted-foreground/60">
                      {moment(race.date).format("YYYY")}
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${config.badge}`}>
                    <TypeIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">{race.type}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
