import { motion } from "framer-motion";
import { MapPin, Calendar as CalIcon, Zap, Shield, Wind, CheckCircle2, Circle } from "lucide-react";
import { useRace } from "../lib/RaceContext";
import PageHeader from "../components/PageHeader";
import { calendar } from "../lib/f1Data";
import moment from "moment";

const typeConfig = {
  "Rapide": { icon: Zap, badge: "bg-red-500/15 text-red-400 border-red-500/20" },
  "équilibre": { icon: Shield, badge: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  "Déportance": { icon: Wind, badge: "bg-primary/15 text-primary border-primary/20" },
  "Test": { icon: CalIcon, badge: "bg-muted text-muted-foreground border-border" },
};

export default function CalendarPage() {
  const races = calendar.sort((a, b) => new Date(a.date) - new Date(b.date));
  const { done, toggle } = useRace();

  return (
    <div>
      <PageHeader title="Calendrier 2023" subtitle="23 courses · Roadmap complète de la saison" />

      <div className="space-y-3">
        {races.map((race, i) => {
          const config = typeConfig[race.type] || typeConfig["Test"];
          const TypeIcon = config.icon;

          return (
            <motion.div
              key={race.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-card border rounded-xl p-4 md:p-5 transition-all group ${
                done[race.id] ? 'border-green-500/30 opacity-60' : 'border-border hover:border-primary/20'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                {/* Checkbox */}
                <button onClick={() => toggle(race.id)} className="flex-shrink-0">
                  {done[race.id]
                    ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                    : <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />}
                </button>
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
                    <MapPin className="w-3 h-3 text-muted-foreground" />
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

                  {/* Strategy */}
                  <div className="hidden md:block text-xs text-muted-foreground font-mono bg-secondary px-2.5 py-1 rounded">
                    {race.strategy}
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