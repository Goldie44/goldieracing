import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import PageHeader from "../components/PageHeader";
import { stock } from "../lib/f1Data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

const STOCK_COUNTS_KEY = "goldie-racing:stock-counts";
const STOCK_COSTS_KEY = "goldie-racing:stock-costs";
const STOCK_LIFESPANS_KEY = "goldie-racing:stock-lifespans";

export default function StockPage() {
  const { t } = useTranslation("stock");
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try {
      const stored = window.localStorage.getItem(STOCK_COUNTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return Object.fromEntries(stock.map(s => [s.piece, 0]));
  });

  const [costs, setCosts] = useState<Record<string, number>>(() => {
    try {
      const stored = window.localStorage.getItem(STOCK_COSTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return Object.fromEntries(stock.map(s => [s.piece, 0]));
  });

  const [lifespans, setLifespans] = useState<Record<string, number>>(() => {
    try {
      const stored = window.localStorage.getItem(STOCK_LIFESPANS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return Object.fromEntries(stock.map(s => [s.piece, 0]));
  });

  useEffect(() => {
    try { window.localStorage.setItem(STOCK_COUNTS_KEY, JSON.stringify(counts)); } catch {}
  }, [counts]);

  useEffect(() => {
    try { window.localStorage.setItem(STOCK_COSTS_KEY, JSON.stringify(costs)); } catch {}
  }, [costs]);

  useEffect(() => {
    try { window.localStorage.setItem(STOCK_LIFESPANS_KEY, JSON.stringify(lifespans)); } catch {}
  }, [lifespans]);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const resetAll = () => {
    setCounts(Object.fromEntries(stock.map(s => [s.piece, 0])));
    setCosts(Object.fromEntries(stock.map(s => [s.piece, 0])));
    setLifespans(Object.fromEntries(stock.map(s => [s.piece, 0])));
    setResetDialogOpen(false);
  };

  const totalCost = stock.reduce((a, b) => a + (costs[b.piece] * counts[b.piece] * lifespans[b.piece] || 0), 0);

  const chartData = stock.map(s => ({
    name: s.piece,
    capacité: counts[s.piece] * lifespans[s.piece],
    stock: counts[s.piece],
  }));

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="flex justify-end mt-6 mb-2">
        <Button
          variant="destructive"
          className="flex items-center gap-1.5"
          onClick={() => setResetDialogOpen(true)}
        >
          <ArrowPathIcon className="w-4 h-4" />
          {t("resetAll")}
        </Button>
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("resetTitle")}</DialogTitle>
            <DialogDescription>
              {t("resetDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={resetAll}>{t("confirmReset")}</Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">{t("cancel")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <h3 className="text-sm font-semibold mb-4">{t("coverageChart")}</h3>
        <ResponsiveContainer height={200}>
          <BarChart data={chartData} barGap={4}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(220, 14%, 9%)", border: "1px solid hsl(220, 12%, 16%)", borderRadius: "8px", fontSize: "12px" }}
              labelStyle={{ color: "hsl(40, 20%, 95%)" }}
            />
            <Bar dataKey="capacité" fill="hsl(220, 12%, 25%)" radius={[4, 4, 0, 0]} name={t("seasonCapacity")} />
            <Bar dataKey="stock" fill="hsl(43, 96%, 56%)" radius={[4, 4, 0, 0]} name={t("inStock")} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Pieces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stock.map((item, i) => {
          const lifespan = lifespans[item.piece] ?? item.racesPerPiece;
          const capacity = counts[item.piece] * lifespan;
          const health = capacity >= 24 ? "good" : item.understock <= 1 ? "warning" : "critical";

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
                  <span className="text-xs text-muted-foreground">{t("daysToMake", { count: item.daysToMake })}</span>
                </div>
                {health === "good" ? (
                  <CheckCircleIcon className="w-4 h-4 text-green-400" />
                ) : health === "warning" ? (
                  <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
                ) : (
                  <ExclamationTriangleIcon className="w-4 h-4 text-white" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">{t("inStock")}</div>
                  <input
                    type="number"
                    min={0}
                    value={counts[item.piece]}
                    onChange={e => setCounts(prev => ({ ...prev, [item.piece]: Number(e.target.value) }))}
                    className="text-lg font-bold font-mono bg-transparent w-full outline-none border-b border-transparent focus:border-primary transition-colors"
                  />
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">{t("lifespan")}</div>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      min={1}
                      value={lifespans[item.piece]}
                      onChange={e => setLifespans(prev => ({ ...prev, [item.piece]: Number(e.target.value) }))}
                      className="text-lg font-bold font-mono bg-transparent w-full outline-none border-b border-transparent focus:border-primary transition-colors"
                    />
                    <span className="text-xs text-muted-foreground">{t("races")}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("seasonCapacity")}</span>
                  <span className="font-mono">{capacity}</span>
                </div>

                <div className="flex justify-between text-xs items-center">
                   <span className="text-muted-foreground">{t("unitCost")}</span>
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
        <span className="text-sm text-muted-foreground">{t("totalCost")}</span>
        <span className="text-xl font-bold font-mono text-primary">{(totalCost / 1000000).toFixed(1)}M €</span>
      </motion.div>
    </div>
  );
}
