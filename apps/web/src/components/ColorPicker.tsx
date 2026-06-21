import { useRef, useState } from "react";

type Props = {
  value: string; // hex sans #, ex: "f59e0b"
  onChange: (hex: string) => void;
};

function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round(h * 60);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return f(0) + f(8) + f(4);
}

export default function ColorPicker({ value, onChange }: Props) {
  const [hue, setHue] = useState(() => hexToHue(value));
  const [lightness, setLightness] = useState(50);
  const [hexInput, setHexInput] = useState(value);
  const rainbowRef = useRef<HTMLDivElement>(null);
  const brightnessRef = useRef<HTMLDivElement>(null);

  const pickFromBar = (
    e: React.MouseEvent,
    ref: React.RefObject<HTMLDivElement>,
    callback: (pct: number) => void
  ) => {
    const rect = ref.current!.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    callback(pct);
  };

  const handleRainbow = (e: React.MouseEvent) => {
    pickFromBar(e, rainbowRef, (pct) => {
      const newHue = Math.round(pct * 360);
      setHue(newHue);
      const hex = hslToHex(newHue, 100, lightness);
      setHexInput(hex);
      onChange(hex);
    });
  };

  const handleBrightness = (e: React.MouseEvent) => {
    pickFromBar(e, brightnessRef, (pct) => {
      const newL = Math.round(10 + pct * 80);
      setLightness(newL);
      const hex = hslToHex(hue, 100, newL);
      setHexInput(hex);
      onChange(hex);
    });
  };

  const handleHexApply = () => {
    if (/^[0-9a-fA-F]{6}$/.test(hexInput)) {
      onChange(hexInput.toLowerCase());
      setHue(hexToHue(hexInput));
    }
  };

  const huePct = (hue / 360) * 100;
  const lightPct = ((lightness - 10) / 80) * 100;

  return (
    <div className="flex flex-col gap-3">
      {/* Aperçu */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg border-2 border-white/15 flex-shrink-0"
          style={{ background: `#${value}` }}
        />
        <div>
          <p className="text-sm font-semibold text-foreground">Couleur d'accent</p>
          <p className="text-xs text-muted-foreground font-mono">#{value}</p>
        </div>
      </div>

      {/* Barres à 50% de largeur */}
      <div style={{ width: "50%" }} className="flex flex-col gap-2">
        {/* Arc-en-ciel */}
        <div
          ref={rainbowRef}
          onClick={handleRainbow}
          className="relative h-7 rounded-full cursor-crosshair border border-border"
          style={{
            background:
              "linear-gradient(to right,hsl(0,100%,50%),hsl(30,100%,50%),hsl(60,100%,50%),hsl(90,100%,50%),hsl(120,100%,50%),hsl(150,100%,50%),hsl(180,100%,50%),hsl(210,100%,50%),hsl(240,100%,50%),hsl(270,100%,50%),hsl(300,100%,50%),hsl(330,100%,50%),hsl(360,100%,50%))",
          }}
        >
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full border-[3px] border-white pointer-events-none"
            style={{
              left: `${huePct}%`,
              background: `#${value}`,
              boxShadow: "0 0 0 1px rgba(0,0,0,.4),0 2px 6px rgba(0,0,0,.6)",
            }}
          />
        </div>

        {/* Luminosité */}
        <div
          ref={brightnessRef}
          onClick={handleBrightness}
          className="relative h-3.5 rounded-full cursor-crosshair border border-border"
          style={{
            background: `linear-gradient(to right,#000,hsl(${hue},100%,50%),#fff)`,
          }}
        >
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white pointer-events-none"
            style={{
              left: `${lightPct}%`,
              boxShadow: "0 0 0 1px rgba(0,0,0,.4)",
            }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-muted-foreground">Sombre</span>
          <span className="text-[10px] text-muted-foreground">Lumineux</span>
        </div>
      </div>

      {/* Hex input à 25% */}
      <div className="flex items-center gap-2" style={{ width: "25%" }}>
        <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden flex-1">
          <span className="px-2 text-muted-foreground text-xs font-mono">#</span>
          <input
            className="bg-transparent border-none outline-none text-foreground font-mono text-xs w-full py-2"
            placeholder="f59e0b"
            maxLength={6}
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleHexApply()}
          />
        </div>
        <button
          onClick={handleHexApply}
          className="px-3 py-2 rounded-lg text-xs font-semibold border whitespace-nowrap text-primary border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
