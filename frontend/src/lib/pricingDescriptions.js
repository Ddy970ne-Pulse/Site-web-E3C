// Descriptions types par catégorie pour la grille tarifaire — aide l'admin à
// saisir des libellés clairs et cohérents, et à retrouver facilement les
// postes de rénovation énergétique (marqués ⚡) qui basculent la TVA à 2,1%
// via la détection de mots-clés dans lib/tva.js. Simples suggestions : le
// champ description reste libre, rien n'est imposé.
export const DESCRIPTION_SUGGESTIONS_BY_CATEGORY = {
  "Maçonnerie": [
    "Mur en agglos 20cm",
    "Fondations béton armé",
    "Dalle béton",
    "Enduit de façade",
    "Chape de ravoirage",
  ],
  "Toiture": [
    "Réfection couverture tuiles",
    "Isolation combles perdus", // ⚡ 2,1%
    "Isolation rampants toiture", // ⚡ 2,1%
    "Réparation charpente toiture",
    "Pose gouttières",
  ],
  "Rénovation": [
    "Rénovation salle de bain complète",
    "Cloisons placo",
    "Isolation intérieure des murs", // ⚡ 2,1%
    "Remplacement fenêtres double vitrage", // ⚡ 2,1%
    "Faux plafond",
  ],
  "Peinture": [
    "Peinture façade acrylique",
    "Peinture intérieure murs et plafonds",
    "Enduit de lissage",
    "Peinture anti-humidité",
  ],
  "Carrelage": [
    "Pose carrelage sol intérieur",
    "Pose carrelage extérieur terrasse",
    "Faïence murale salle de bain",
    "Pose plinthes",
  ],
  "Charpente": [
    "Charpente bois traditionnelle",
    "Ossature métallique",
    "Renfort de charpente existante",
    "Traitement charpente bois",
  ],
  "Terrassement": [
    "Terrassement fondations",
    "Nivellement terrain",
    "Tranchée réseaux",
    "Évacuation terre",
  ],
  "Plomberie": [
    "Installation sanitaire complète",
    "Remplacement robinetterie",
    "Installation pompe à chaleur air/eau", // ⚡ 2,1%
    "Chauffe-eau thermodynamique", // ⚡ 2,1%
    "Mise aux normes réseau eau",
  ],
  "Électricité": [
    "Mise aux normes tableau électrique",
    "Installation prises et éclairage",
    "Câblage réseau électrique",
    "Installation panneaux solaires photovoltaïques", // ⚡ 2,1%
  ],
  "Divers": [
    "Nettoyage fin de chantier",
    "Évacuation gravats",
    "Location matériel",
  ],
};
