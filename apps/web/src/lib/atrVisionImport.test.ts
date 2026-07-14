import { describe, expect, it } from "vitest";
import { mergeAtrVisionEntries } from "./atrVisionImport";

const baseData = [
  {
    label: "Vélocité",
    rows: [
      { label: "Vitesse max (km/h)", v1: "300", moyenne: "290", delta: "", cd: "", deltaCD: "", gainsAttendus: "0" },
      { label: "Accélération", v1: "", moyenne: "", delta: "", cd: "", deltaCD: "", gainsAttendus: "0" },
    ],
  },
];

describe("mergeAtrVisionEntries", () => {
  it("overwrites v1 and moyenne for matching section/label entries", () => {
    const result = mergeAtrVisionEntries(baseData, [
      { section: "Vélocité", label: "Vitesse max (km/h)", v1: "312", moyenne: "305" },
    ]);
    expect(result[0].rows[0].v1).toBe("312");
    expect(result[0].rows[0].moyenne).toBe("305");
  });

  it("leaves rows with no matching entry untouched", () => {
    const result = mergeAtrVisionEntries(baseData, [
      { section: "Vélocité", label: "Vitesse max (km/h)", v1: "312", moyenne: "305" },
    ]);
    expect(result[0].rows[1]).toEqual(baseData[0].rows[1]);
  });

  it("does not overwrite a field when the entry omits it", () => {
    const result = mergeAtrVisionEntries(baseData, [
      { section: "Vélocité", label: "Vitesse max (km/h)", v1: "312", moyenne: "" },
    ]);
    expect(result[0].rows[0].v1).toBe("312");
    expect(result[0].rows[0].moyenne).toBe("290");
  });

  it("ignores entries whose section/label do not match any row", () => {
    const result = mergeAtrVisionEntries(baseData, [
      { section: "Inconnue", label: "Rien", v1: "1", moyenne: "2" },
    ]);
    expect(result).toEqual(baseData);
  });

  it("does not mutate the input data", () => {
    const clone = structuredClone(baseData);
    mergeAtrVisionEntries(baseData, [
      { section: "Vélocité", label: "Vitesse max (km/h)", v1: "999", moyenne: "999" },
    ]);
    expect(baseData).toEqual(clone);
  });
});
