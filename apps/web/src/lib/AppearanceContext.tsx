import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const ACCENT_KEY = "goldie-racing:accent-color";
const FONT_FAMILY_KEY = "goldie-racing:font-family";
const FONT_SIZE_KEY = "goldie-racing:font-size";
const FONT_COLOR_KEY = "goldie-racing:font-color";
const BG_IMAGE_KEY = "goldie-racing:bg-image";
const BG_OPACITY_KEY = "goldie-racing:bg-opacity";
const BG_BLUR_KEY = "goldie-racing:bg-blur";

type AppearanceContextValue = {
  accentHex: string;
  setAccentHex: (hex: string) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  fontSize: string;
  setFontSize: (s: string) => void;
  fontColor: string;
  setFontColor: (hex: string) => void;
  bgImage: string | null;
  setBgImage: (img: string | null) => void;
  bgOpacity: number;
  setBgOpacity: (v: number) => void;
  bgBlur: number;
  setBgBlur: (v: number) => void;
};

const AppearanceContext = createContext<AppearanceContextValue>(null!);

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return `${Math.round(h * 60)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyAccent(hex: string) {
  const hsl = hexToHsl(hex);
  const root = document.documentElement;
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--chart-1", hsl);
  root.style.setProperty("--sidebar-primary", hsl);
  root.style.setProperty("--sidebar-ring", hsl);
}

function applyFont(family: string, size: string) {
  const root = document.documentElement;
  root.style.setProperty("--app-font-family", family);
  root.style.setProperty("--app-font-size", size);
}

function applyFontColor(hex: string) {
  document.documentElement.style.setProperty("--foreground", hexToHsl(hex));
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [accentHex, setAccentHexState] = useState(() =>
    localStorage.getItem(ACCENT_KEY) ?? "f59e0b"
  );
  const [fontFamily, setFontFamilyState] = useState(() =>
    localStorage.getItem(FONT_FAMILY_KEY) ?? "Inter, sans-serif"
  );
  const [fontSize, setFontSizeState] = useState(() =>
    localStorage.getItem(FONT_SIZE_KEY) ?? "15px"
  );
  const [fontColor, setFontColorState] = useState(() =>
    localStorage.getItem(FONT_COLOR_KEY) ?? "e2e8f0"
  );
  const [bgImage, setBgImageState] = useState<string | null>(() =>
    localStorage.getItem(BG_IMAGE_KEY)
  );
  const [bgOpacity, setBgOpacityState] = useState(() =>
    Number(localStorage.getItem(BG_OPACITY_KEY) ?? 40)
  );
  const [bgBlur, setBgBlurState] = useState(() =>
    Number(localStorage.getItem(BG_BLUR_KEY) ?? 32)
  );

  useEffect(() => { applyAccent(accentHex); }, [accentHex]);
  useEffect(() => { applyFont(fontFamily, fontSize); }, [fontFamily, fontSize]);
  useEffect(() => { applyFontColor(fontColor); }, [fontColor]);

  const setAccentHex = (hex: string) => {
    setAccentHexState(hex);
    try { localStorage.setItem(ACCENT_KEY, hex); } catch {}
  };
  const setFontFamily = (f: string) => {
    setFontFamilyState(f);
    try { localStorage.setItem(FONT_FAMILY_KEY, f); } catch {}
  };
  const setFontSize = (s: string) => {
    setFontSizeState(s);
    try { localStorage.setItem(FONT_SIZE_KEY, s); } catch {}
  };
  const setFontColor = (hex: string) => {
    setFontColorState(hex);
    try { localStorage.setItem(FONT_COLOR_KEY, hex); } catch {}
  };
  const setBgImage = (img: string | null) => {
    setBgImageState(img);
    try {
      if (img) localStorage.setItem(BG_IMAGE_KEY, img);
      else localStorage.removeItem(BG_IMAGE_KEY);
    } catch {}
  };
  const setBgOpacity = (v: number) => {
    setBgOpacityState(v);
    try { localStorage.setItem(BG_OPACITY_KEY, String(v)); } catch {}
  };
  const setBgBlur = (v: number) => {
    setBgBlurState(v);
    try { localStorage.setItem(BG_BLUR_KEY, String(v)); } catch {}
  };

  return (
    <AppearanceContext.Provider value={{
      accentHex, setAccentHex,
      fontFamily, setFontFamily,
      fontSize, setFontSize,
      fontColor, setFontColor,
      bgImage, setBgImage,
      bgOpacity, setBgOpacity,
      bgBlur, setBgBlur,
    }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export const useAppearance = () => useContext(AppearanceContext);
