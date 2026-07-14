import { TVA_STANDARD, TVA_REDUCED, suggestTvaRate, tvaRateLabel } from "./tva";

test("defaults to the standard Guadeloupe rate for ordinary work", () => {
  expect(suggestTvaRate({ category: "Maçonnerie", description: "Mur en agglos 20cm" })).toBe(TVA_STANDARD);
  expect(suggestTvaRate({ category: "Peinture", description: "Peinture façade acrylique" })).toBe(TVA_STANDARD);
  expect(suggestTvaRate({ category: "Carrelage", description: "Pose carrelage salle de bain" })).toBe(TVA_STANDARD);
});

test("suggests the reduced rate for energy-renovation keywords", () => {
  expect(suggestTvaRate({ description: "Isolation thermique des combles perdus" })).toBe(TVA_REDUCED);
  expect(suggestTvaRate({ description: "Installation pompe à chaleur air/eau" })).toBe(TVA_REDUCED);
  expect(suggestTvaRate({ description: "Remplacement chaudière à condensation" })).toBe(TVA_REDUCED);
  expect(suggestTvaRate({ description: "Pose chauffe-eau thermodynamique" })).toBe(TVA_REDUCED);
  expect(suggestTvaRate({ description: "Fenêtres double vitrage salon" })).toBe(TVA_REDUCED);
  expect(suggestTvaRate({ description: "Installation panneaux solaires photovoltaïques" })).toBe(TVA_REDUCED);
});

test("matches keywords without accents and regardless of case", () => {
  expect(suggestTvaRate({ description: "ISOLATION DES COMBLES" })).toBe(TVA_REDUCED);
  expect(suggestTvaRate({ description: "pompe a chaleur air eau" })).toBe(TVA_REDUCED);
});

test("does not false-positive on unrelated work mentioning similar words", () => {
  // "chaudière" alone (no "à condensation") shouldn't trigger — a standard
  // boiler swap doesn't automatically qualify for the reduced rate.
  expect(suggestTvaRate({ description: "Réparation chaudière" })).toBe(TVA_STANDARD);
});

test("tvaRateLabel returns a readable label for known and unknown rates", () => {
  expect(tvaRateLabel(TVA_STANDARD)).toContain("8,5");
  expect(tvaRateLabel(TVA_REDUCED)).toContain("2,1");
  expect(tvaRateLabel(20)).toBe("20 %");
});
