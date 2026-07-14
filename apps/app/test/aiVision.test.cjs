const assert = require("node:assert/strict");
const test = require("node:test");

const { parseAtrVisionResponse } = require("../dist/aiVision");

test("parses a well-formed JSON array response", () => {
  const text = 'Voici les valeurs: [{"section":"Vélocité","label":"Vitesse max (km/h)","v1":"312","moyenne":"305"}]';
  const result = parseAtrVisionResponse(text);
  assert.deepEqual(result, [
    { section: "Vélocité", label: "Vitesse max (km/h)", v1: "312", moyenne: "305" },
  ]);
});

test("fills missing v1/moyenne fields with empty strings", () => {
  const text = '[{"section":"Virage","label":"Faible vitesse","moyenne":"70"}]';
  const result = parseAtrVisionResponse(text);
  assert.deepEqual(result, [
    { section: "Virage", label: "Faible vitesse", v1: "", moyenne: "70" },
  ]);
});

test("drops entries missing a section or label", () => {
  const text = '[{"section":"Virage","v1":"70"},{"label":"Sans section","v1":"1"}]';
  const result = parseAtrVisionResponse(text);
  assert.deepEqual(result, []);
});

test("throws when no JSON array is present", () => {
  assert.throws(() => parseAtrVisionResponse("Désolé, je ne peux pas lire cette image."));
});

test("throws when the JSON array is malformed", () => {
  assert.throws(() => parseAtrVisionResponse("[{\"section\": \"Virage\", ]"));
});
