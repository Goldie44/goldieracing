import { motion } from "framer-motion";
import { Gauge, Zap, Wind, TrendingUp, RotateCcw, Plus } from "lucide-react";
import { useState } from "react";
import { useAtr } from "../lib/AtrContext";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { performance, tireStrategy, developmentUpdates } from "../lib/f1Data";

const radarData = [
  { subject: "Vitesse Max", value: 78 },
  { subject: "Accélération", value: 72 },
  { subject: "DRS", value: 67 },
  { subject: "Virage Faible V.", value: 76 },
  { subject: "Virage Moy. V.", value: 70 },
  { subject: "Virage Gde V.", value: 65 },
  { subject: "Débit d'air", value: 68 },
  { subject: "Refroidissement", value: 74 },
];

const degradationData = [
  { lap: 0, soft: 0, medium: 0, hard: 0 },
  { lap: 10, soft: 0.9, medium: 0.6, hard: 0.4 },
  { lap: 20, soft: 1.8, medium: 1.2, hard: 0.8 },
  { lap: 30, soft: 2.7, medium: 1.8, hard: 1.2 },
  { lap: 40, soft: 3.6, medium: 2.4, hard: 1.6 },
  { lap: 50, soft: 4.5, medium: 3.0, hard: 2.0 },
  { lap: 60, soft: 5.4, medium: 3.6, hard: 2.4 },
];

export default function PerformancePage() {
  const { atrData, setAtrData } = useAtr();
  const [projects, setProjects] = useState(developmentUpdates);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ atr: "", race: "", parts: "" });

  const avg = (sectionIndex) => {
    const rows = atrData[sectionIndex]?.rows || [];
    const vals = rows.map(r => parseFloat(r.v1)).filter(v => !isNaN(v));
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : "—";
  };

  const avgComp = (sectionIndex) => {
    const rows = atrData[sectionIndex]?.rows || [];
    const vals = rows.map(r => parseFloat(r.moyenne)).filter(v => !isNaN(v));
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
  };

  // Map ATR rows to radar subjects in order
  const radarMapped = [
    { subject: "Vitesse Max",      value: parseFloat(atrData[0]?.rows[0]?.v1) || 0, competitor: parseFloat(atrData[0]?.rows[0]?.moyenne) || 0 },
    { subject: "Accélération",     value: parseFloat(atrData[0]?.rows[1]?.v1) || 0, competitor: parseFloat(atrData[0]?.rows[1]?.moyenne) || 0 },
    { subject: "DRS",              value: parseFloat(atrData[0]?.rows[2]?.v1) || 0, competitor: parseFloat(atrData[0]?.rows[2]?.moyenne) || 0 },
    { subject: "Virage Faible V.", value: parseFloat(atrData[1]?.rows[0]?.v1) || 0, competitor: parseFloat(atrData[1]?.rows[0]?.moyenne) || 0 },
    { subject: "Virage Moy. V.",   value: parseFloat(atrData[1]?.rows[1]?.v1) || 0, competitor: parseFloat(atrData[1]?.rows[1]?.moyenne) || 0 },
    { subject: "Virage Gde V.",    value: parseFloat(atrData[1]?.rows[2]?.v1) || 0, competitor: parseFloat(atrData[1]?.rows[2]?.moyenne) || 0 },
    { subject: "Dirty Air",        value: parseFloat(atrData[1]?.rows[3]?.v1) || 0, competitor: parseFloat(atrData[1]?.rows[3]?.moyenne) || 0 },
    { subject: "Refroidissement",  value: parseFloat(atrData[2]?.rows[1]?.v1) || 0, competitor: parseFloat(atrData[2]?.rows[1]?.moyenne) || 0 },
  ];

  return (
    <div>
      <PageHeader title="Performance" subtitle="Analyse des métriques de performance véhicule" />

      {/* BOP Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Vélocité" value={avg(0)} icon={Zap} competitor={avgComp(0)} />
        <StatCard label="Virage" value={avg(1)} icon={Wind} competitor={avgComp(1)} />
        <StatCard label="Composants" value={avg(2)} icon={Gauge} competitor={avgComp(2)} />

      </div>



      <AtrCalTable data={atrData} setData={setAtrData} />

      {/* Development Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold mb-6">Plan de Développement</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6">
            {projects.map((update, i) => (
              <motion.div
                key={update.atr}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex gap-4 relative"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center z-10 shrink-0">
                  <span className="text-xs font-bold font-mono text-primary">{i + 1}</span>
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{update.atr}</span>
                    <span className="text-xs text-muted-foreground">· {update.race}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {update.parts.map(part => (
                      <span key={part} className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Nouveau Projet */}
      <div className="my-6 flex flex-col items-start gap-4">
        <button
          onClick={() => setShowNewProject(v => !v)}
          className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-lg font-medium"
        >
          <Plus className="w-3 h-3" />
          Nouveau projet
        </button>
        {showNewProject && (
          <div className="w-full p-4 rounded-lg border border-border bg-card flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ATR</label>
                <input value={newProject.atr} onChange={e => setNewProject(p => ({...p, atr: e.target.value}))} className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary text-foreground" placeholder="ex: ATR-08" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Course</label>
                <input value={newProject.race} onChange={e => setNewProject(p => ({...p, race: e.target.value}))} className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary text-foreground" placeholder="ex: Monaco" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Pièces (séparées par des virgules)</label>
              <input value={newProject.parts} onChange={e => setNewProject(p => ({...p, parts: e.target.value}))} className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary text-foreground" placeholder="ex: Fond plat, Aileron avant" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewProject(false)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5">Annuler</button>
              <button
                onClick={() => {
                  if (!newProject.atr) return;
                  setProjects(prev => [...prev, { atr: newProject.atr, race: newProject.race, parts: newProject.parts.split(",").map(p => p.trim()).filter(Boolean) }]);
                  setNewProject({ atr: "", race: "", parts: "" });
                  setShowNewProject(false);
                }}
                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        )}
      </div>

      <AtrCalTable data={atrData} setData={setAtrData} title="Prédiction Performance" />
    </div>
  );
}

const initialSections = [
  {
    label: "Vélocité",
    rows: [
      { label: "Vitesse max" },
      { label: "Accélération" },
      { label: "Efficacité du DRS" },
    ],
  },
  {
    label: "Virage",
    rows: [
      { label: "Faible vitesse" },
      { label: "Vitesse moyenne" },
      { label: "Grande vitesse" },
      { label: "Tolérance Dirty air" },
    ],
  },
  {
    label: "Composants",
    rows: [
      { label: "Préservation des pneus" },
      { label: "Refroidissement du moteur" },
      { label: "Poids excédentaire totale" },
    ],
  },
];

function AtrCalTable({ data, setData, title = "Calibration ATR" }) {
  const reset = () => setData(initialSections.map(s => ({
    ...s,
    rows: s.rows.map(r => ({ ...r, v1: "", moyenne: "", delta: "", cd: "", deltaCD: "" })),
  })));

  const update = (si, ri, field, val) => {
    setData(prev => prev.map((s, i) => i !== si ? s : {
      ...s,
      rows: s.rows.map((r, j) => j !== ri ? r : { ...r, [field]: val }),
    }));
  };

  const cellCls = "w-full text-center text-xs font-mono bg-transparent border border-transparent focus:border-primary rounded px-1 py-1 outline-none transition-colors text-foreground";

  const calcDelta = (v1, moyenne) => {
    const a = parseFloat(v1), b = parseFloat(moyenne);
    if (isNaN(a) || isNaN(b)) return "";
    return (a - b).toFixed(3);
  };

  // Compute all deltas and find the 3 smallest values
  const allDeltas = data.flatMap(s => s.rows.map(r => {
    const d = calcDelta(r.v1, r.moyenne);
    return d !== "" ? parseFloat(d) : null;
  })).filter(v => v !== null);
  allDeltas.sort((a, b) => a - b);
  const threshold3 = allDeltas.length >= 3 ? allDeltas[2] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card border border-border rounded-xl p-6 mb-8 overflow-x-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors">
          <RotateCcw className="w-3 h-3" />
          Remettre à zéro
        </button>
      </div>
      {/* Top 3 smallest deltas */}
      {threshold3 !== null && (() => {
        const worst = [];
        data.forEach(s => s.rows.forEach(r => {
          const d = calcDelta(r.v1, r.moyenne);
          if (d !== "") worst.push({ label: r.label, delta: parseFloat(d) });
        }));
        worst.sort((a, b) => a.delta - b.delta);
        const top3 = worst.slice(0, 3);
        return (
          <div className="mb-4 border border-red-500/20 rounded-lg bg-red-500/10 p-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">⚠ 3 plus grands déficits</h4>
            <div className="flex flex-col gap-1.5">
              {top3.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded bg-red-500/10">
                  <span className="text-xs text-foreground font-medium">{item.label}</span>
                  <span className="text-xs font-mono text-red-400 font-bold">{item.delta.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      <table className="w-full text-xs min-w-[640px]">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left py-2 px-2 font-medium w-48"></th>
            <th className="py-2 px-2 font-medium">V1</th>
            <th className="py-2 px-2 font-medium">Concurrent Direct</th>
            <th className="py-2 px-2 font-medium text-yellow-400">Δ Déficit</th>


          </tr>
        </thead>
        <tbody>
          {data.map((section, si) => (
            <>
              <tr key={section.label + "-header"}>
                <td colSpan={6} className="py-2 px-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">{section.label}</span>
                </td>
              </tr>
              {section.rows.map((row, ri) => (
                <tr key={row.label} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-1.5 px-2 text-muted-foreground">{row.label}</td>
                  {["v1", "moyenne"].map(field => (
                    <td key={field} className="py-1 px-1">
                      <input
                        type="number"
                        value={row[field]}
                        onChange={e => update(si, ri, field, e.target.value)}
                        className={cellCls}
                        placeholder="0"
                      />
                    </td>
                  ))}
                  <td className="py-1 px-2">
                    {(() => {
                      const delta = calcDelta(row.v1, row.moyenne);
                      if (delta === "") return null;
                      const val = parseFloat(delta);
                      const isNeg = val < 0;
                      const color = isNeg ? "bg-red-500" : "bg-green-500";
                      const maxWidth = 80;
                      const width = Math.min(Math.abs(val) * 10, maxWidth);
                      return (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono w-14 text-right ${isNeg ? "text-red-400" : "text-green-400"}`}>{delta}</span>
                          <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full ${color} opacity-80`}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </td>


                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>

    </motion.div>
  );
}