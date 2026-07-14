export type AtrVisionEntry = {
  section: string;
  label: string;
  v1?: string;
  moyenne?: string;
};

type AtrRow = {
  label: string;
  v1: string;
  moyenne: string;
  [key: string]: unknown;
};

type AtrSection = {
  label: string;
  rows: AtrRow[];
};

export function mergeAtrVisionEntries(
  data: AtrSection[],
  entries: AtrVisionEntry[],
): AtrSection[] {
  return data.map((section) => ({
    ...section,
    rows: section.rows.map((row) => {
      const match = entries.find(
        (entry) => entry.section === section.label && entry.label === row.label,
      );
      if (!match) return row;

      return {
        ...row,
        ...(match.v1 ? { v1: match.v1 } : {}),
        ...(match.moyenne ? { moyenne: match.moyenne } : {}),
      };
    }),
  }));
}
