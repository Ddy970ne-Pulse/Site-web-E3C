# PRD - Site Web E3C Entreprise de Constructions

## Entreprise
**Nom**: E3C — Entreprise de Constructions
**Secteur**: BTP - Tous travaux du Bâtiment et Travaux Publics
**Localisation**: Guadeloupe (971)
**Contact**: 0690 44 97 14 (WhatsApp + Téléphone)

---

## Problème à résoudre
Créer un site web professionnel, moderne et optimisé mobile pour E3C afin d'améliorer leur visibilité en ligne et faciliter la prise de contact client via WhatsApp.

---

## Architecture
- **Frontend**: React (Create React App) + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor)
- **Style**: Dark Premium (fond #0A0A0A, accents dorés #D4AF37)
- **Fonts**: Outfit (titres) + Manrope (corps)
- **Icons**: Lucide React

---

## Ce qui a été implémenté (v1.0 - Février 2026)

### Frontend - Sections du site
1. **Navbar** - Navigation sticky glassmorphic, logo E3C, liens navigation, bouton "Devis Gratuit", menu mobile hamburger
2. **Hero** - Section plein écran avec image de chantier, titre accrocheur, CTA WhatsApp + contact, badges de confiance
3. **Stats** - Barre dorée avec chiffres clés (10+ ans, 200+ chantiers, 100% gratuit, 971 Guadeloupe)
4. **Services** - Bento grid de 9 prestations BTP avec icônes et liens WhatsApp directs
5. **Values** - 6 cartes de valeurs (Qualité, Réactivité, Accompagnement, Normes, Équipe, Local)
6. **Gallery** - Grille photo avec lightbox (8 images de chantiers)
7. **Zone d'intervention** - Liste des 20+ communes de Guadeloupe + carte visuelle
8. **Contact** - Formulaire complet (nom, téléphone, commune, prestation, message) → envoi WhatsApp + stockage MongoDB
9. **FAQ** - 7 questions/réponses en accordion
10. **Footer** - Navigation, prestations, contact, branding E3C

### Bouton WhatsApp flottant
- Toujours visible en bas à droite
- Tooltip "Devis gratuit sur WhatsApp"
- Animation pulse verte

### Backend - API
- `GET /api/` - Santé de l'API
- `POST /api/contact` - Soumission formulaire de contact (stockage MongoDB)
- `GET /api/contact` - Liste des contacts (admin)

---

## Prestations BTP couvertes
1. Maçonnerie & Gros Oeuvre
2. Charpente & Ossature
3. Toiture & Couverture
4. Carrelage & Revêtements
5. Rénovation Intérieure
6. Peinture & Enduits
7. Terrassement & VRD
8. Plomberie & Sanitaire
9. Électricité Générale

---

## Résultats des tests (v1.0)
- Backend: 100% (4/4 tests)
- Frontend: 95% (tous visuels présents, mobile responsive)

---

## Backlog prioritaire (P0 à P2)

### P0 - À faire en priorité
- [ ] Intégration du vrai logo E3C quand disponible
- [ ] Ajout des vraies photos de chantiers E3C dans la galerie
- [ ] Email de contact (adresse email réelle)
- [ ] Intégration Google Maps pour la zone d'intervention

### P1 - Amélioration
- [ ] Page mentions légales / CGV
- [ ] Formulaire de devis plus détaillé (surface, budget, délai)
- [ ] Section témoignages clients
- [ ] Intégration Google Analytics / SEO avancé
- [ ] Optimisation images (WebP, lazy loading)

### P2 - Évolution future
- [ ] Blog/actualités BTP
- [ ] Espace client sécurisé (suivi chantier)
- [ ] Galerie avec catégories filtrables
- [ ] Intégration CRM pour gestion des devis

---

## Identifiants WhatsApp
- Numéro: 0690 44 97 14
- Format international: +590 690 44 97 14
- Lien WhatsApp: https://wa.me/590690449714
