// TVA BTP en Guadeloupe (DOM) : seulement 2 taux possibles, différents de la
// métropole (20/10/5.5 %) — voir https://entreprendre.service-public.gouv.fr/vosdroits/F23568
//
// - 8,5 % : taux normal — construction neuve ET rénovation générale (en DOM,
//   contrairement à la métropole, il n'existe pas de taux intermédiaire à 10 %
//   pour la rénovation non-énergétique : elle reste au taux normal).
// - 2,1 % : taux réduit — uniquement les travaux d'amélioration de la
//   performance énergétique (isolation, chauffage/eau chaude performants,
//   énergies renouvelables) dans un logement achevé depuis plus de 2 ans.
//   Une attestation client (Cerfa) est obligatoire pour appliquer ce taux.
export const TVA_STANDARD = 8.5;
export const TVA_REDUCED = 2.1;

export const TVA_RATE_OPTIONS = [
  { value: TVA_STANDARD, label: "8,5 % — Taux normal (Guadeloupe)" },
  { value: TVA_REDUCED, label: "2,1 % — Taux réduit (rénovation énergétique, logement +2 ans)" },
];

// Le taux réduit dépend de la nature précise du poste, pas d'une grande
// catégorie ("Rénovation" ou "Plomberie" mélangent des postes éligibles et
// non-éligibles) — ces mots-clés ciblent les travaux réellement couverts par
// le taux réduit. Chaque terme est listé avec et sans accents pour un match
// robuste sans dépendre d'une normalisation Unicode. Volontairement prudent :
// en cas de doute, le taux normal s'applique et l'admin corrige manuellement.
const ENERGY_KEYWORDS = [
  "isolation", "isolant", "combles", "rampants",
  "pompe à chaleur", "pompe a chaleur", "pac air", "pac eau",
  "chaudière à condensation", "chaudiere a condensation",
  "chauffe-eau thermodynamique", "ballon thermodynamique", "chauffe-eau solaire",
  "double vitrage", "triple vitrage", "fenêtre isolante", "fenetre isolante",
  "panneau solaire", "photovoltaïque", "photovoltaique", "solaire thermique",
  "ventilation double flux", "vmc double flux",
  "brasseur d'air basse consommation", "climatisation performance",
];

/**
 * Suggère le taux de TVA applicable à partir de la description (et,
 * accessoirement, de la catégorie) d'un poste. Toujours une suggestion à
 * pré-remplir, jamais une valeur imposée — le champ reste modifiable.
 */
export function suggestTvaRate({ category = "", description = "" } = {}) {
  const haystack = `${category} ${description}`.toLowerCase();
  const isEnergyWork = ENERGY_KEYWORDS.some(kw => haystack.includes(kw));
  return isEnergyWork ? TVA_REDUCED : TVA_STANDARD;
}

export function tvaRateLabel(rate) {
  const match = TVA_RATE_OPTIONS.find(o => o.value === rate);
  return match ? match.label : `${rate} %`;
}
