# CHANGELOG — E3C Site Web

## [2026-05-25] — Thème Clair/Sombre (Toggle Dark/Light)

### Ajouté
- `ThemeContext.js` (/app/frontend/src/contexts/ThemeContext.js) — Gestion état thème + localStorage
- Bouton bascule (Soleil/Lune) dans la Navbar (desktop + hamburger mobile)
- Bouton bascule dans le tiroir de navigation mobile (avec label)

### Modifié — Thème complet
- `App.js` — ThemeProvider wrapper autour de AuthProvider
- `App.css` — body background: #FAFAF8 (light) / html.dark body: #0A0A0A (dark)
- `Navbar.jsx` — Classes light/dark + bouton toggle
- `Services.jsx` — Fond crème, cartes blanches en mode clair
- `Values.jsx` — Fond #F5F4F0 en mode clair
- `Gallery.jsx` — Filtres et grille adaptés
- `Testimonials.jsx` — Cartes et formulaire adaptés
- `FAQ.jsx` — Fond et accordéon adaptés
- `ZoneIntervention.jsx` — Cartes info, badges carte adaptés
- `Contact.jsx` — Cartes canaux adaptées
- `Footer.jsx` — Fond #EEE9DF (light) / #050505 (dark)
- `Login.jsx` — Formulaire fond blanc en mode clair
- `Register.jsx` — Formulaire fond blanc en mode clair
- `ContactPage.jsx` — Formulaire et cartes adaptés
- `DevisWizard.jsx` — Wizard complet adapté + correction Step 4 (commune manquant)
- `MentionsLegales.jsx` — Fond et textes adaptés
- `CGV.jsx` — Fond et textes adaptés

### Corrigé
- **Bug DevisWizard**: Step 4 (sélection commune) n'avait pas de bloc de rendu JSX → wizard bloqué à cette étape → ajout du bloc de rendu avec `<select>` COMMUNES

### Test
- Iteration 9: 100% succès (14/14 tests)
- Dark mode par défaut ✓
- Toggle fonctionne ✓
- Persistance localStorage ✓
- Commune step fonctionne ✓

---

## [2026-06-30] — P1 Conversion 1-click + P2 Acomptes + Refonte PDF

### Ajouté
- **P1**: Endpoint `POST /api/quote-requests/{id}/to-invoice` — conversion directe demande de devis → facture
- **P1**: Bouton "Créer Facture" dans l'onglet "Demandes devis" de l'admin (data-testid: `convert-request-{id}`)
- **P2**: Modèles d'acomptes prédéfinis dans InvoiceDetail (100%, 50/50, 30/70, 30/30/40, 1/3·1/3·1/3) avec auto-calcul des montants et dates suggérées
- **Disclaimer estimatif**: Bannière "Estimation prévisionnelle, non contractuelle" dans DevisWizard (étapes 2 et 6), portail client (vue devis), et PDF devis

### Modifié
- **PDF redesign complet** (server.py `generate_invoice_pdf` + `generate_quote_pdf`):
  - En-tête 2 colonnes: logo E3C gauche + numéro/date sur fond sombre droite
  - Séparateur or
  - Bloc "FACTURER À / ÉTABLI POUR" avec fond gris clair
  - Tableau prestations: header foncé, lignes alternées, montants alignés à droite
  - Bloc totaux right-aligned avec fond ivoire pour TOTAL TTC
  - Calendrier de règlement tabulaire
  - Section signature (devis)
  - Pied de page avec règle et coordonnées
- **AdminDashboard**: Statut "Converti" (badge violet) pour les demandes déjà converties

### Corrigé
- **Bug Race condition DevisWizard**: `data.name` et `data.email` restaient vides si `user` était `undefined` au montage → `useEffect` synchronise les champs dès que l'auth résout
- **Bug 401 ClientDashboard**: `fetchData` sans gestion d'erreur → uncaught 401 bloquait l'UI → catch block redirige vers `/connexion`

### Tests
- Iteration 10: P1+P2+PDF — 100% (9/9)
- Iteration 11: Disclaimer — 100% (4/4)
- Iteration 12: Bugs auth/wizard — 100% (6/6)

---

## [2026-05-XX] — Grille tarifaire & Devis Wizard

### Ajouté
- Admin PricingTab — CRUD grille tarifaire (catégorie, description, unité, prix HT, TVA)
- DevisWizard 7 étapes avec estimation live depuis la grille
- Calcul TTC automatique (TVA Guadeloupe 8.5%)

---

## [2026-05-XX] — Authentification & Portails

### Ajouté
- JWT auth (login/register)
- Admin dashboard /admin avec analytics
- Client dashboard /espace-client

---

## [2026-05-XX] — Site vitrine initial

### Ajouté
- Hero, Services, Values, Gallery, Testimonials, FAQ, ZoneIntervention (OSM), Contact, Footer
- SEO dynamique, sitemap.xml, robots.txt
- Pages légales (Mentions légales, CGV)
- Admin gallery management, testimonials validation
