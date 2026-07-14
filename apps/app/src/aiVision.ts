import Anthropic from "@anthropic-ai/sdk";

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

export function buildAtrVisionPrompt(): string {
  const sectionsDescription = ATR_SECTIONS
    .map((s) => `- ${s.label}: ${s.rows.join(", ")}`)
    .join("\n");

  return `Tu regardes une capture d'écran de l'écran de comparaison technique du jeu F1 Manager. Cet écran affiche, pour chaque caractéristique technique de la monoplace, deux valeurs numériques côte à côte : la valeur de la monoplace du joueur, et la valeur moyenne des concurrents.

Les caractéristiques attendues sont regroupées par section :
${sectionsDescription}

Lis les valeurs affichées sur la capture d'écran et renvoie UNIQUEMENT un tableau JSON (sans texte autour), avec une entrée par caractéristique trouvée, au format :
[{ "section": "<nom de la section>", "label": "<nom exact de la ligne>", "v1": "<valeur monoplace>", "moyenne": "<valeur concurrent>" }]

Si une valeur n'est pas visible ou lisible sur l'image, omets le champ correspondant plutôt que d'inventer une valeur.`;
}

export async function callAtrVisionApi(
  imageBase64: string,
  mediaType: string,
  apiKey: string,
): Promise<AtrVisionEntry[]> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType as "image/png", data: imageBase64 },
          },
          { type: "text", text: buildAtrVisionPrompt() },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Le modèle n'a renvoyé aucun texte exploitable.");
  }

  return parseAtrVisionResponse(textBlock.text);
}
