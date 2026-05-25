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
