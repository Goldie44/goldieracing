import { motion } from "framer-motion";
import { Wallet, TrendingUp, AlertCircle, ChevronDown, ChevronRight, RotateCcw, X } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { usedBudget } from "../lib/f1Data";
import { useState } from "react";
import { useBudget } from "../lib/BudgetContext";

const fmt = (v) => v != null ? `${(v / 1000000).toFixed(2)}M €` : "—";
const fmtPct = (v, total) => total ? `${((v / total) * 100).toFixed(1)}%` : "—";

export default function BudgetPage() {
  const { sections, setSections, totalBudget, setTotalBudget } = useBudget();
  const [expanded, setExpanded] = useState({});
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(totalBudget);

  const totalSpent = sections.reduce((a, s) => a + (s.spentTotal || 0), 0);
  const totalPct = ((totalSpent / totalBudget) * 100).toFixed(1);
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalPct;

  const updateSpent = (i, val) => {
    setSections(prev => prev.map((s, idx) => idx === i ? { ...s, spentTotal: Number(val) || 0 } : s));
  };

  const toggle = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  const pieData = sections.map(s => ({ name: s.section, value: s.spentTotal }));

  return (
    <div>
      <PageHeader title="Budget" subtitle="Répartition du plafond budgétaire · Saison 2023" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plafond total</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
          </div>
          {editingBudget ? (
            <form onSubmit={e => { e.preventDefault(); setTotalBudget(Number(budgetInput)); setEditingBudget(false); }} className="flex items-center gap-2">
              <input
                autoFocus
                type="number"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                className="w-full text-lg font-bold font-mono bg-secondary/50 border border-primary rounded px-2 py-0.5 outline-none text-foreground"
              />
              <button type="submit" className="text-xs text-primary font-semibold">OK</button>
            </form>
          ) : (
            <button onClick={() => { setBudgetInput(totalBudget); setEditingBudget(true); }} className="text-left w-full">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-foreground font-mono">{(totalBudget / 1000000).toFixed(1)}M</span>
                <span className="text-sm text-muted-foreground">€</span>
                <span className="text-xs text-primary ml-1">✏️</span>
              </div>
            </button>
          )}
        </div>
        <StatCard label="Dépensé" value={(totalSpent / 1000000).toFixed(1) + "M"} unit="€" icon={TrendingUp} />
        <StatCard label="Restant" value={(remaining / 1000000).toFixed(1) + "M"} unit="€" icon={AlertCircle} />
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Utilisation du plafond</span>
          <span className="text-sm font-mono text-primary">{percentUsed}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentUsed}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>0 €</span>
          <span>{(totalBudget / 1000000).toFixed(0)}M €</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold mb-4">Répartition dépensée</h3>
          <ResponsiveContainer height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" strokeWidth={0}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={sections[i].color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => fmt(v)}
                contentStyle={{ background: "hsl(220,14%,9%)", border: "1px solid hsl(220,12%,16%)", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "hsl(40,20%,95%)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {sections.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-xs text-muted-foreground truncate flex-1">{s.section}</span>
                <span className="text-xs font-mono text-foreground">{totalSpent ? ((s.spentTotal / totalSpent) * 100).toFixed(1) : 0}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold mb-4">Détail des allocations</h3>

          {/* % total indicator */}
          <div className={`flex items-center justify-between mb-4 px-2 py-2 rounded-lg text-xs font-mono ${
            Math.abs(Number(totalPct) - 100) < 0.1
              ? 'bg-green-500/10 text-green-400'
              : Number(totalPct) > 100
              ? 'bg-red-500/10 text-red-400'
              : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            <span>Total alloué</span>
            <span className="font-bold">{totalPct}% / 100%</span>
          </div>

          {/* Header */}
          <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium mb-3 px-2">
            <span>Poste</span>
            <span className="text-right">Dépensé (∑) %</span>
            <span className="text-right">Alloué</span>
          </div>

          <div className="space-y-1">
            {sections.map((s, i) => (
              <div key={i}>
                {/* Section row */}
                <div className="w-full grid grid-cols-3 items-center py-2 px-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <button onClick={() => s.items.length > 0 && toggle(i)} className="flex items-center gap-2 text-left">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-sm font-medium truncate">{s.section}</span>
                    {s.items.length > 0 && (
                      expanded[i]
                        ? <ChevronDown className="w-3 h-3 text-muted-foreground ml-1 shrink-0" />
                        : <ChevronRight className="w-3 h-3 text-muted-foreground ml-1 shrink-0" />
                    )}
                  </button>
                  <div className="flex items-center justify-end gap-1">
                    <input
                      type="number"
                      min={0}
                      value={s.spentTotal}
                      onChange={e => updateSpent(i, e.target.value)}
                      className="w-20 text-right text-sm font-mono bg-secondary/50 border border-transparent focus:border-primary rounded px-1.5 py-0.5 outline-none transition-colors"
                      style={{ color: s.color }}
                    />
                    <button onClick={() => updateSpent(i, 0)} className="text-muted-foreground/40 hover:text-red-400 transition-colors" title="Remettre à 0">
                      <X className="w-3 h-3" />
                    </button>
                    <span className="text-xs text-muted-foreground w-10 text-right">{totalBudget ? ((s.spentTotal / totalBudget) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <span className="text-sm font-mono text-right text-muted-foreground">{fmt(s.allocatedTotal)}</span>
                </div>

                {/* Sub-items */}
                {expanded[i] && s.items.length > 0 && (
                  <div className="ml-6 border-l border-border pl-3 mb-1 space-y-0.5">
                    {s.items.map((item, j) => (
                      <div key={j} className="grid grid-cols-3 text-xs py-1.5 px-2 text-muted-foreground">
                        <span>{item.label}</span>
                        <span className="text-right">{fmt(item.spent)}</span>
                        <span className="text-right">{fmt(item.allocated)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Total row */}
            <div className="grid grid-cols-3 items-center py-2.5 px-2 border-t border-border mt-2 pt-3">
              <span className="text-sm font-bold">Total</span>
              <div className="flex items-center justify-end gap-1">
                <span className={`text-sm font-bold font-mono ${
                  Math.abs(Number(totalPct) - 100) < 0.1 ? 'text-green-400' : Number(totalPct) > 100 ? 'text-red-400' : 'text-yellow-400'
                }`}>{fmt(totalSpent)}</span>
                <span className={`text-xs font-mono ${
                  Math.abs(Number(totalPct) - 100) < 0.1 ? 'text-green-400' : Number(totalPct) > 100 ? 'text-red-400' : 'text-yellow-400'
                }`}>({totalPct}%)</span>
              </div>
              <span className="text-sm font-bold font-mono text-right text-muted-foreground">{fmt(totalBudget)}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}