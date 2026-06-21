import { motion } from "framer-motion";
import { useState } from "react";
import {
  CheckCircleIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import StatCard from "../components/StatCard";
import { calendar, circuitTypes, stock } from "../lib/f1Data";
import { useBudget } from "../lib/BudgetContext";
import { useRace } from "../lib/RaceContext";
import { useAtr } from "../lib/AtrContext";

const STOCK_COUNTS_KEY = "goldie-racing:stock-counts";
const STOCK_LIFESPANS_KEY = "goldie-racing:stock-lifespans";

const typeColors = ["hsl(0, 72%, 51%)", "hsl(210, 60%, 50%)", "hsl(43, 96%, 56%)"];

const pieData = Object.entries(circuitTypes).map(([key, val]) => ({
  name: val.label,
  value: val.count,
}));


function useStockHealth() {
  const [counts] = useState<Record<string, number>>(() => {
    try {
      const stored = window.localStorage.getItem(STOCK_COUNTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return Object.fromEntries(stock.map(s => [s.piece, s.count]));
  });
  const [lifespans] = useState<Record<string, number>>(() => {
    try {
      const stored = window.localStorage.getItem(STOCK_LIFESPANS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return Object.fromEntries(stock.map(s => [s.piece, s.racesPerPiece]));
  });

  return stock.map(item => {
    const count = counts[item.piece] ?? item.count;
    const lifespan = lifespans[item.piece] ?? item.racesPerPiece;
    const capacity = count * lifespan;
    const health: "good" | "warning" | "critical" =
      capacity >= 24 ? "good" : item.understock <= 1 ? "warning" : "critical";
    return { piece: item.piece, count, capacity, health };
  });
}

export default function Dashboard() {
  const { sections, totalBudget: ctxTotalBudget } = useBudget();
  const { atrData } = useAtr();
  const calcAtrDelta = (r) => {
    const v1 = parseFloat(r.v1) || 0;
    const gains = parseFloat(r.gainsAttendus) || 0;
    const moy = parseFloat(r.moyenne);
    return isNaN(moy) ? null : v1 + gains - moy;
  };
  const allDeltasWithLabel = atrData.flatMap(s => s.rows.map(r => {
    const d = calcAtrDelta(r);
    return d !== null ? { label: r.label, delta: d } : null;
  })).filter(Boolean);
  const atrDeltaValues = allDeltasWithLabel.map(x => x.delta);
const top3Deficits = [...allDeltasWithLabel].sort((a, b) => a.delta - b.delta).slice(0, 3);
  const stockItems = useStockHealth();
  const stockGood = stockItems.filter(i => i.health === "good").length;
  const stockWarning = stockItems.filter(i => i.health === "warning").length;
  const stockCritical = stockItems.filter(i => i.health === "critical").length;
  const stockAlerts = stockItems.filter(i => i.health !== "good");
  const { done } = useRace();
  const ctxSpent = sections.reduce((a, s) => a + (s.spentTotal || 0), 0);
  const ctxRemaining = ctxTotalBudget - ctxSpent;
  const sortedRaces = calendar.filter(r => r.type !== "Test").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextRaceUnchecked = sortedRaces.find(r => !done[r.id]);
  const budgetPercent = ctxTotalBudget ? ((ctxSpent / ctxTotalBudget) * 100).toFixed(1) : "0.0";
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <div className="h-1 w-12 bg-primary rounded-full mt-3" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard label="Courses" value="23" icon={FlagIcon} />
        <StatCard label="Budget utilisé" value={budgetPercent + "%"} icon={WalletIcon} />
      </div>

      {/* Top 3 Déficits */}
      {top3Deficits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-8"
        >
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            ⚠ 3 plus grands déficits · Écart de performance
          </h3>
          <div className="flex flex-col gap-2">
            {top3Deficits.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/10">
                <span className="text-sm text-foreground font-medium">{item.label}</span>
                <span className="text-sm font-mono font-bold text-red-400">{item.delta.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Next Race Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-primary/10 via-card to-accent/10 border border-primary/20 rounded-xl p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-primary uppercase tracking-widest">Prochaine Course</span>
            <h2 className="text-xl font-bold mt-1">{nextRaceUnchecked?.name ?? "Toutes les courses terminées 🏁"}</h2>
            <p className="text-sm text-muted-foreground mt-1">{nextRaceUnchecked?.circuit}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
            <div className="text-xs text-muted-foreground">Type</div>
              <div className="text-sm font-semibold text-primary">{nextRaceUnchecked?.type}</div>
            </div>
            <div className="text-right">
            <div className="text-xs text-muted-foreground">Stratégie</div>
              <div className="text-sm font-semibold">{nextRaceUnchecked?.strategy}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stock Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <div className="flex items-center gap-2 mb-5">
          <CubeIcon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">État du Stock Pièces</h3>
          <span className="ml-auto text-xs text-muted-foreground font-mono">{stockItems.length} pièces</span>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
            <div className="text-2xl font-bold font-mono text-green-400">{stockGood}</div>
            <div className="text-xs text-muted-foreground mt-1">Stock OK</div>
          </div>
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-center">
            <div className="text-2xl font-bold font-mono text-yellow-400">{stockWarning}</div>
            <div className="text-xs text-muted-foreground mt-1">Attention</div>
          </div>
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
            <div className="text-2xl font-bold font-mono text-red-400">{stockCritical}</div>
            <div className="text-xs text-muted-foreground mt-1">Critique</div>
          </div>
        </div>

        {/* Alert list */}
        {stockAlerts.length > 0 ? (
          <div className="flex flex-col gap-2">
            {stockAlerts.map(item => (
              <div
                key={item.piece}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  item.health === "critical"
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-yellow-500/10 border border-yellow-500/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className={`w-3.5 h-3.5 flex-shrink-0 ${item.health === "critical" ? "text-red-400" : "text-yellow-400"}`} />
                  <span className="text-sm font-medium">{item.piece}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{item.count} pcs · {item.capacity} courses</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircleIcon className="w-4 h-4" />
            <span>Tous les stocks sont suffisants pour la saison</span>
          </div>
        )}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* Circuit Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Types de Circuit</h3>
          <div className="flex items-center gap-6">
            <div className="w-36 h-36">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={typeColors[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: typeColors[i] }} />
                    <span className="text-sm text-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
