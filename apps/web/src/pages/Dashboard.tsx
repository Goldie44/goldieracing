import { motion } from "framer-motion";
import { Package, Gauge, Wallet, Flag, AlertTriangle, CheckCircle, RotateCcw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import StatCard from "../components/StatCard";
import { calendar, circuitTypes, stock } from "../lib/f1Data";
import { useBudget } from "../lib/BudgetContext";
import { useRace } from "../lib/RaceContext";
import { useAtr } from "../lib/AtrContext";

const typeColors = ["hsl(0, 72%, 51%)", "hsl(210, 60%, 50%)", "hsl(43, 96%, 56%)"];

const pieData = Object.entries(circuitTypes).map(([key, val]) => ({
  name: val.label,
  value: val.count,
}));

const stockData = stock.map(s => ({
  name: s.piece.replace("Aileron ", "A."),
  stock: s.count,
  needed: Math.ceil(24 / s.racesPerPiece),
}));

const nextRace = calendar
  .filter(r => r.type !== "Test")
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

const TOTAL_RACES = 23;
const fabricationNeeds = stock.map(item => {
  const needed = Math.ceil(TOTAL_RACES / item.racesPerPiece);
  const shortfall = Math.max(0, needed - item.count);
  const cycles = shortfall > 0 ? Math.ceil(shortfall / Math.max(1, Math.floor(item.count / 2))) : 0;
  return { ...item, needed, shortfall, cycles };
});

export default function Dashboard() {
  const { reset: resetBudget, sections, totalBudget: ctxTotalBudget } = useBudget();
  const { atrData } = useAtr();
  const atrDeltas = atrData.flatMap(s => s.rows.map(r => {
    const v1 = parseFloat(r.v1), moy = parseFloat(r.moyenne);
    return (!isNaN(v1) && !isNaN(moy)) ? v1 - moy : null;
  })).filter(v => v !== null);
  const perfEcart = atrDeltas.length > 0 ? (atrDeltas.reduce((a, b) => a + b, 0) / atrDeltas.length).toFixed(3) : "—";
  const { done } = useRace();
  const ctxSpent = sections.reduce((a, s) => a + (s.spentTotal || 0), 0);
  const ctxRemaining = ctxTotalBudget - ctxSpent;
  const sortedRaces = calendar.filter(r => r.type !== "Test").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextRaceUnchecked = sortedRaces.find(r => !done[r.id]);
  const budgetPercent = ctxTotalBudget ? ((ctxSpent / ctxTotalBudget) * 100).toFixed(1) : "0.0";
  const totalPieces = stock.reduce((a, b) => a + b.count, 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble · Goldie F1 2023</p>
          <div className="h-1 w-12 bg-primary rounded-full mt-3" />
        </div>
        <button
          onClick={resetBudget}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Budget
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Courses" value="23" icon={Flag} />
        <StatCard label="Pièces en stock" value={totalPieces} icon={Package} />
        <StatCard label="Budget utilisé" value={budgetPercent + "%"} icon={Wallet} />
        <StatCard label="Écart de performance" value={perfEcart} icon={Gauge} />
      </div>

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

      {/* Fabrication Planning Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Planification Fabrication · Saison 2023</h3>
          <span className="ml-auto text-xs text-muted-foreground font-mono">{TOTAL_RACES} courses</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {fabricationNeeds.map((item) => {
            const ok = item.shortfall === 0;
            return (
              <div
                key={item.piece}
                className={`rounded-lg p-3 border ${
                  ok ? "bg-secondary/30 border-border" : "bg-accent/5 border-accent/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground truncate">{item.piece}</span>
                  {ok
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                </div>
                <div className="text-lg font-bold font-mono text-foreground">{item.count}<span className="text-xs text-muted-foreground">/{item.needed}</span></div>
                <div className="text-xs mt-1">
                  {ok
                    ? <span className="text-green-400">Stock OK</span>
                    : <span className="text-accent font-medium">−{item.shortfall} à fabriquer</span>}
                </div>
                {!ok && (
                  <div className="text-xs text-muted-foreground mt-0.5">{item.daysToMake}j/pièce</div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

        {/* Stock Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Stock vs Besoin</h3>
          <ResponsiveContainer height={160}>
            <BarChart data={stockData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 14%, 9%)", border: "1px solid hsl(220, 12%, 16%)", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "hsl(40, 20%, 95%)" }}
              />
              <Bar dataKey="stock" fill="hsl(43, 96%, 56%)" radius={[4, 4, 0, 0]} name="En stock" />
              <Bar dataKey="needed" fill="hsl(220, 12%, 25%)" radius={[4, 4, 0, 0]} name="Besoin saison" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

    </div>
  );
}