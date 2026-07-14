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

export function parseAtrVisionResponse(text: string): AtrVisionEntry[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Aucun tableau JSON trouvé dans la réponse du modèle.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("La réponse du modèle contient un JSON invalide.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("La réponse du modèle n'est pas un tableau.");
  }

  return parsed
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      section: typeof entry.section === "string" ? entry.section : "",
      label: typeof entry.label === "string" ? entry.label : "",
      v1: entry.v1 !== undefined && entry.v1 !== null ? String(entry.v1) : "",
      moyenne: entry.moyenne !== undefined && entry.moyenne !== null ? String(entry.moyenne) : "",
    }))
    .filter((entry) => entry.section !== "" && entry.label !== "");
}
