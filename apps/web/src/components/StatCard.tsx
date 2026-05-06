import { motion } from "framer-motion";
import type { ComponentType, SVGProps } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  trend?: number;
  color?: string;
  competitor?: string | number;
};

export default function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  competitor,
}: StatCardProps) {
  const valueStr = String(value);
  const competitorStr = competitor !== undefined ? String(competitor) : undefined;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold font-mono ${
          competitorStr && valueStr !== "—"
            ? parseFloat(valueStr) > parseFloat(competitorStr) ? "text-green-400" : parseFloat(valueStr) < parseFloat(competitorStr) ? "text-red-400" : "text-foreground"
            : "text-foreground"
        }`}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {competitorStr && (
        <div className="text-xs mt-1 text-muted-foreground">
          Concurrent: <span className="font-mono">{competitorStr}</span>
        </div>
      )}
      {trend !== undefined && (
        <div className={`text-xs mt-2 font-medium ${trend > 0 ? "text-green-400" : "text-red-400"}`}>
          {trend > 0 ? "+" : ""}{trend}%
        </div>
      )}
    </motion.div>
  );
}
