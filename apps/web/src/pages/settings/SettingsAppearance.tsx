import { useRef } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useAppearance } from "@/lib/AppearanceContext";
import ColorPicker from "@/components/ColorPicker";

const FONT_FAMILIES = [
  { label: "Inter (défaut)", value: "Inter, sans-serif" },
  { label: "Roboto Mono", value: "'Roboto Mono', monospace" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { label: "Orbitron", value: "'Orbitron', sans-serif" },
  { label: "Rajdhani", value: "'Rajdhani', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Système", value: "system-ui, sans-serif" },
];

const FONT_SIZES = [
  { label: "Très petite — 11px", value: "11px" },
  { label: "Petite — 13px", value: "13px" },
  { label: "Normale — 15px", value: "15px" },
  { label: "Grande — 17px", value: "17px" },
  { label: "Très grande — 20px", value: "20px" },
];

function extractDominantColor(src: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      canvas.width = 80; canvas.height = 80;
      ctx.drawImage(img, 0, 0, 80, 80);
      const data = ctx.getImageData(0, 0, 80, 80).data;
      const buckets: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < 20 || brightness > 235) continue;
        const key = `${data[i] >> 5},${data[i + 1] >> 5},${data[i + 2] >> 5}`;
        buckets[key] = (buckets[key] ?? 0) + 1;
      }
      let max = 0, best = "0,0,0";
      for (const [k, v] of Object.entries(buckets)) {
        if (v > max) { max = v; best = k; }
      }
      const [r, g, b] = best.split(",").map((v) => (parseInt(v) << 5) | 0x10);
      resolve(((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1));
    };
    img.src = src;
  });
}

export default function SettingsAppearance() {
  const { theme, setTheme } = useTheme();
  const {
    accentHex, setAccentHex,
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    bgImage, setBgImage,
    bgOpacity, setBgOpacity,
    bgBlur, setBgBlur,
  } = useAppearance();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBgImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleMatch = async () => {
    if (!bgImage) return;
    const hex = await extractDominantColor(bgImage);
    setAccentHex(hex);
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl">

      {/* Thème */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Thème</p>
        <div className="flex gap-3">
          {(["dark", "light", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium border transition-all ${
                theme === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {t === "dark" ? "🌙 Sombre" : t === "light" ? "☀️ Clair" : "💻 Système"}
            </button>
          ))}
        </div>
      </div>

      {/* Couleur d'accent */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Couleur d'accent</p>
        <ColorPicker value={accentHex} onChange={setAccentHex} />
      </div>

      {/* Police */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Police</p>
        <div className="flex gap-3">
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="bg-card border border-border rounded-lg text-sm text-foreground px-3 py-2 outline-none cursor-pointer"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="bg-card border border-border rounded-lg text-sm text-foreground px-3 py-2 outline-none cursor-pointer"
          >
            {FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-muted-foreground" style={{ fontFamily, fontSize }}>
          Aperçu — F1 Manager 2023 · Goldie Racing
        </p>
      </div>

      {/* Image de fond */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Image de fond</p>

        <div
          onClick={() => fileRef.current?.click()}
          className="relative flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border cursor-pointer overflow-hidden hover:border-primary/40 transition-colors"
          style={{ width: 180, height: 55 }}
        >
          {bgImage && (
            <div
              className="absolute inset-0 bg-cover bg-center rounded-lg"
              style={{
                backgroundImage: `url(${bgImage})`,
                opacity: bgOpacity / 100,
                filter: `blur(${(bgBlur / 100) * 20}px)`,
              }}
            />
          )}
          <div className="relative z-10 flex items-center gap-2">
            <span className="text-base">🖼️</span>
            <span className="text-xs text-muted-foreground">
              {bgImage ? "Changer l'image" : "Clique ou glisse une image"}
            </span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileLoad} />
        </div>

        <div className="flex flex-col gap-3 mt-3" style={{ width: 180 }}>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-medium">Opacité</span>
              <span className="text-xs text-primary font-mono font-semibold">{bgOpacity}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={bgOpacity}
              onChange={(e) => setBgOpacity(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-medium">Flou</span>
              <span className="text-xs text-primary font-mono font-semibold">{bgBlur}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={bgBlur}
              onChange={(e) => setBgBlur(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {bgImage && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleMatch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
              >
                🎨 Matcher la couleur d'accent
              </button>
              <button
                onClick={() => { setBgImage(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 transition-colors"
              >
                🗑️ Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
