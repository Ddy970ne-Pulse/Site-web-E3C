# E3C — Entreprise de Constructions — PRD

## Contexte
Site web professionnel pour E3C, entreprise BTP en Guadeloupe (971).
Pas de numéros de téléphone affichés publiquement sur le site.

## Architecture
- **Frontend**: React + Tailwind CSS (darkMode: ["class"]) + Shadcn UI + React Router
- **Backend**: FastAPI + MongoDB (Motor) + JWT auth
- **Paiement**: Stripe (intégration prévue, clé utilisateur requise)
- **Email**: Brevo (différé, clé utilisateur requise)

```
/app/
├── backend/
│   ├── server.py              # FastAPI — auth, quotes, pricing, gallery, testimonials
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   ├── AuthContext.js  # JWT auth context
│   │   │   └── ThemeContext.js # Dark/Light theme toggle (localStorage: 'e3c-theme')
│   │   ├── components/
│   │   │   ├── admin/          # AdminDashboard, PricingTab, GalleryTab, TestimonialsTab
│   │   │   ├── auth/           # Login.jsx, Register.jsx
│   │   │   ├── client/         # ClientDashboard
│   │   │   └── ...             # Navbar, Hero, Services, Gallery, FAQ, Testimonials, ZoneIntervention, Contact, Footer, Values
│   │   ├── pages/              # ContactPage, DevisWizard (7 steps), MentionsLegales, CGV
│   │   ├── App.js
│   │   └── App.css
│   ├── public/                 # index.html, sitemap.xml, robots.txt
│   ├── tailwind.config.js      # darkMode: ["class"]
│   ├── package.json
│   └── .env
└── memory/
    ├── PRD.md
    ├── test_credentials.md
    ├── CHANGELOG.md
    └── ROADMAP.md
```

## Schéma BD
- `users`: {email, password_hash, role, name, phone, created_at}
- `pricing_grid`: {category, description, unit, unit_price_ht, tva_rate, active}
- `quote_requests`: {client_id, project_type, services, description, commune, estimated_lines, total_ht, total_ttc, status}
- `gallery_images`: {url, category, title, label, tag}
- `testimonials`: {author_name, content, commune, service, stars, status}
- `invoices`: {quote_id, client_id, amount, stripe_session_id, status}

## Comptes de test
- **Admin**: admin@e3c-construction.com / E3C@Admin2026
- Route admin: /admin
- Route client: /espace-client

## Endpoints API clés
- POST /api/auth/login
- POST /api/auth/register
- GET/POST/PUT/DELETE /api/pricing-grid
- POST /api/quote-requests
- GET /api/quote-requests (admin)
- GET/POST /api/gallery
- GET/POST /api/testimonials
- GET /api/admin/stats

---

## Fonctionnalités implémentées

### Phase 1 — Site vitrine public
- [x] Hero avec image construction (dark overlay, conservé en mode clair)
- [x] Section Services (9 prestations BTP)
- [x] Section Values / Pourquoi nous choisir
- [x] Gallery dynamique (admin + images statiques Unsplash)
- [x] Testimonials avec formulaire de soumission + validation admin
- [x] FAQ accordéon
- [x] Zone d'intervention (carte OpenStreetMap, 20 communes)
- [x] Contact (WhatsApp + formulaire)
- [x] Footer complet avec liens légaux

### Phase 2 — SEO & Légal
- [x] SEO dynamique (Open Graph, meta tags)
- [x] sitemap.xml
- [x] robots.txt
- [x] Pages légales: Mentions légales, CGV

### Phase 3 — Authentification
- [x] Login / Register (JWT)
- [x] Admin portal (/admin)
- [x] Client portal (/espace-client)
- [x] Création compte admin (seed script)

### Phase 4 — Business Logic
- [x] Grille tarifaire CRUD admin (PricingTab)
- [x] Devis Wizard 7 étapes (type projet → services → estimation → description → commune → budget/délai → coordonnées)
- [x] Intégration grille tarifaire dans le wizard pour estimation live TTC/HT
- [x] Soumission des demandes de devis
- [x] Admin dashboard avec analytics (stats)

### Phase 5 — UI/UX Thème
- [x] **Dark Mode** (thème sombre par défaut, noir #0A0A0A)
- [x] **Light Mode** (thème crème/beige chaleureux, fond #FAFAF8)
- [x] **Bouton bascule** Dark/Light dans la Navbar (icône Soleil/Lune)
- [x] Bascule aussi dans le menu hamburger (mobile)
- [x] Persistance du thème dans localStorage ('e3c-theme')
- [x] Thème sombre par défaut au premier chargement

### Corrections de bugs
- [x] Suppression de tous les numéros de téléphone publics
- [x] Mise à jour nom entreprise "E3C — Entreprise de constructions"
- [x] Correction Step 4 DevisWizard (commune) manquant dans le rendu

---

*Dernière mise à jour: 25 Mai 2026*
