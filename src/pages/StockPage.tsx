import { motion } from "framer-motion";
import { useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import PageHeader from "../components/PageHeader";
import { stock } from "../lib/f1Data";

export default function StockPage() {
  const [counts, setCounts] = useState(() => Object.fromEntries(stock.map(s => [s.piece, s.count])));
  const [costs, setCosts] = useState(() => Object.fromEntries(stock.map(s => [s.piece, s.costUnit])));
  const totalCost = stock.reduce((a, b) => a + (costs[b.piece] * b.capacity || 0), 0);

  const chartData = stock.map(s => ({
    name: s.piece,
    capacité: s.capacity,
    stock: counts[s.piece],
  }));

  return (
    <div>
      <PageHeader title="Stock Pièces" subtitle="Inventaire et gestion des composants" />

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <h3 className="text-sm font-semibold mb-4">Capacité vs Stock actuel</h3>
        <ResponsiveContainer height={200}>
          <BarChart data={chartData} barGap={4}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(220, 14%, 9%)", border: "1px solid hsl(220, 12%, 16%)", borderRadius: "8px", fontSize: "12px" }}
              labelStyle={{ color: "hsl(40, 20%, 95%)" }}
            />
            <Bar dataKey="capacité" fill="hsl(220, 12%, 25%)" radius={[4, 4, 0, 0]} name="Capacité saison" />
            <Bar dataKey="stock" fill="hsl(43, 96%, 56%)" radius={[4, 4, 0, 0]} name="En stock" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Pieces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stock.map((item, i) => {
          const health = item.count >= Math.ceil(24 / item.racesPerPiece) ? "good" : item.understock <= 1 ? "warning" : "critical";

          return (
            <motion.div
              key={item.piece}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold">{item.piece}</h3>
                  <span className="text-xs text-muted-foreground">{item.daysToMake}j de fabrication</span>
                </div>
                {health === "good" ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : health === "warning" ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">En stock</div>
                  <input
                    type="number"
                    min={0}
                    value={counts[item.piece]}
                    onChange={e => setCounts(prev => ({ ...prev, [item.piece]: Number(e.target.value) }))}
                    className="text-lg font-bold font-mono bg-transparent w-full outline-none border-b border-transparent focus:border-primary transition-colors"
                  />
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Durée de vie</div>
                  <div className="text-lg font-bold font-mono">{item.racesPerPiece}<span className="text-xs text-muted-foreground ml-1">courses</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Capacité saison</span>
                  <span className="font-mono">{item.capacity}</span>
                </div>

                <div className="flex justify-between text-xs items-center">
                   <span className="text-muted-foreground">Coût unitaire</span>
                   <div className="flex items-center gap-1">
                     <input
                       type="number"
                       min={0}
                       value={costs[item.piece]}
                       onChange={e => setCosts(prev => ({ ...prev, [item.piece]: Number(e.target.value) }))}
                       className="w-20 text-right font-mono text-primary bg-transparent border-b border-transparent focus:border-primary outline-none transition-colors text-xs"
                     />
                     <span className="text-muted-foreground">€</span>
                   </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-card border border-primary/20 rounded-xl p-5 flex items-center justify-between"
      >
        <span className="text-sm text-muted-foreground">Coût total de fabrication</span>
        <span className="text-xl font-bold font-mono text-primary">{(totalCost / 1000000).toFixed(1)}M €</span>
      </motion.div>
    </div>
  );
}