# PRD - Site Web E3C Entreprise de Constructions

## Entreprise
**Nom**: E3C — Entreprise de Constructions
**Secteur**: BTP - Tous travaux du Bâtiment et Travaux Publics
**Localisation**: Guadeloupe (971)
**Contact**: 0690 44 97 14 (WhatsApp + Téléphone)

---

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI | Routes: /, /contact, /connexion, /inscription, /admin, /espace-client
- **Backend**: FastAPI + MongoDB (Motor) | Auth JWT + bcrypt
- **Paiements**: Stripe Checkout (test → prod configurable)
- **Emails**: Brevo (RGPD, France) — configurable via BREVO_API_KEY
- **Style**: Dark Premium (#0A0A0A + accents or #D4AF37) | Fonts: Outfit + Manrope

---

## Ce qui a été implémenté (v3.0 - Avril 2026)

## Ce qui a été implémenté (v4.0 - Avril 2026)

### Site vitrine (v1.0)
- Navbar hamburger universel (drawer slide-out tous écrans)
- Hero cinématique + Stats dorées
- Services BTP (9 prestations bento grid)
- Valeurs (6 cartes)
- Galerie photos avec lightbox
- Zone d'intervention Guadeloupe (20+ communes)
- Section contact homepage (2 canaux: WhatsApp, Formulaire — téléphone retiré)
- FAQ accordion (7 questions)
- Footer complet avec liens compte client (téléphone retiré)

## Ce qui a été implémenté (v5.0 - Avril 2026)

### Modifications v4.0
- Icônes "Connexion" et "Créer un compte" déplacées dans le header (hors menu hamburger)
- Section témoignages clients ajoutée (6 avis, section #testimonials)
- Numéro de téléphone entièrement supprimé de toutes les pages visibles
- Wizard Devis en 6 étapes : /devis — POST /api/quote-requests

### Modifications v5.0
- Section Prestations redesignée : grille compacte 3×3 (icône inline + titre + desc, p-5, gap-px)
- Section Valeurs redesignée : même style compact que Prestations (cohérence visuelle)
- Zone d'intervention : carte OpenStreetMap interactive (iframe, filtre CSS dark, badge overlay)
- Admin dashboard enrichi : onglet Analytiques (CA total, CA mensuel, taux de conversion, barres), onglet Demandes wizard
- Pages légales : /mentions-legales + /cgv + liens dans le footer

### Page Contact dédiée /contact (v3.0)
- Hero "Parlons de votre projet"
- 4 infos cards (Téléphone, WhatsApp, Zone, Disponibilité)
- Formulaire complet (nom, email, téléphone, commune, sujet, prestation, message)
- WhatsApp comme option toggle (pas obligation)
- Sauvegarde en DB + option envoi WhatsApp
- Mention RGPD

### Authentification (v2.0)
- JWT + bcrypt, cookies httpOnly sécurisés
- Rôles: admin / client
- Admin auto-seedé au démarrage
- Inscription client: /inscription
- Connexion: /connexion
- Redirection automatique selon le rôle

### Système Devis (v2.0)
- Création par l'admin avec lignes de postes (desc, qté, prix HT, TVA 8.5%)
- Numérotation auto: DEV-YYYY-NNN
- Workflow: draft → sent → accepted/refused → converted
- Signature client "bon pour accord" dans espace perso
- Génération PDF téléchargeable (reportlab)
- Notifications email Brevo (optionnel)

### Système Factures (v2.0)
- Conversion depuis devis accepté
- Numérotation auto: FAC-YYYY-NNN
- Définition tranches de paiement par admin (libellé, montant, échéance)
- Validation: sum tranches = total TTC
- Génération PDF

### Paiements Stripe (v2.0)
- Stripe Checkout 3D Secure (SCA conforme UE)
- Paiement tranche par tranche
- Vérification statut via polling + webhook
- Historique transactions MongoDB

### Espaces personnels
- Admin (/admin): Dashboard stats, Clients, Devis, Factures, Paiements
- Client (/espace-client): Mes Devis (signer/refuser), Mes Factures (payer par tranches)

---

## Résultats des tests
- v1.0: Backend 100% | Frontend 95%
- v2.0: Backend 100% | Frontend 100%
- v3.0: Backend 100% | Frontend 100%
- v4.0: Backend 100% | Frontend 100% (iteration_4.json)
- v5.0: Backend 100% | Frontend 100% (iteration_5.json)

---

## Backlog prioritaire

### P0 — À faire en priorité
- [ ] Logo E3C définitif (remplace initiales stylisées)
- [ ] Vraies photos de chantiers dans la galerie
- [ ] Adresse email professionnelle
- [ ] Compte Stripe réel (remplacer sk_test_emergent)
- [ ] Compte Brevo → BREVO_API_KEY pour activer les emails

### P1 — Amélioration
- [ ] Intégration Brevo emails transactionnels (besoin clé API BREVO_API_KEY)
- [x] Google Maps dans zone d'intervention — OpenStreetMap v5.0
- [ ] SEO avancé (sitemap, meta, Open Graph)
- [x] Dashboard analytics (CA mensuel, taux conversion) — v5.0
- [x] Mentions légales / CGV — v5.0

### P2 — Évolution
- [ ] Galerie avec filtres par catégorie
- [ ] Blog actualités BTP
- [ ] Espace client: historique complet paiements
- [ ] Notifications push
