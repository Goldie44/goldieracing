export type AtrVisionEntry = {
  section: string;
  label: string;
  v1: string;
  moyenne: string;
};

export const ATR_SECTIONS: { label: string; rows: string[] }[] = [
  { label: "Vélocité", rows: ["Vitesse max (km/h)", "Accélération", "Efficacité du DRS (%)"] },
  { label: "Virage", rows: ["Faible vitesse", "Vitesse moyenne", "Grande vitesse", "Tolérance Dirty air (%)"] },
  { label: "Composants", rows: ["Préservation des pneus", "Refroidissement du moteur", "Poids excédentaire totale (Kg)"] },
];

// Given a starting index that should point at a top-level "[", scans forward tracking
// bracket depth (ignoring brackets inside JSON string values) to find the matching "]".
// Returns undefined if the brackets never balance before the end of the text.
function scanMatchingBracket(text: string, start: number): string | undefined {
  let depth = 0;
  let inString = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (char === "\\") {
        i++; // skip the escaped character
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "[") {
      depth++;
    } else if (char === "]") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return undefined;
}

// Finds the JSON array in the model's response that actually holds our data. Surrounding
// prose can contain unrelated brackets (footnote markers like "[1]", stray "[x]" text, etc.),
// so a naive "first [ to last ]" match can span way past the real array or land on the wrong
// one entirely. Instead, walk through every top-level "[" in order, extract the bracket-depth-
// matched candidate span for each, and return the first one that actually parses as a JSON
// array of objects.
function extractJsonArray(text: string): string | undefined {
  let searchFrom = 0;

  while (true) {
    const start = text.indexOf("[", searchFrom);
    if (start === -1) {
      return undefined;
    }

    const candidate = scanMatchingBracket(text, start);
    if (candidate) {
      try {
        const parsed: unknown = JSON.parse(candidate);
        if (Array.isArray(parsed) && parsed.some((entry) => typeof entry === "object" && entry !== null)) {
          return candidate;
        }
      } catch {
        // Not valid JSON on its own; keep looking for another candidate bracket.
      }
    }

    searchFrom = start + 1;
  }
}

export function parseAtrVisionResponse(text: string): AtrVisionEntry[] {
  const jsonSlice = extractJsonArray(text);
  if (!jsonSlice) {
    throw new Error("Aucun tableau JSON trouvé dans la réponse du modèle.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonSlice);
  } catch {
    throw new Error("La réponse du modèle contient un JSON invalide.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("La réponse du modèle n'est pas un tableau.");
  }

  return parsed
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      section: typeof entry.section === "string" ? entry.section.trim() : "",
      label: typeof entry.label === "string" ? entry.label.trim() : "",
      v1: entry.v1 !== undefined && entry.v1 !== null ? String(entry.v1) : "",
      moyenne: entry.moyenne !== undefined && entry.moyenne !== null ? String(entry.moyenne) : "",
    }))
    .filter((entry) => entry.section !== "" && entry.label !== "");
}
