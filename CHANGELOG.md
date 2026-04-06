# Changelog

Toutes les modifications notables de ce projet sont documentées ici.

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
Versioning : [Semantic Versioning](https://semver.org/lang/fr/) — `MAJEUR.MINEUR.CORRECTIF`

---

## [1.0.0] — 2026-04-06

Première version stable publique.

### Ajouté
- **Frontend React 19** : site vitrine E3C avec pages Accueil, Services, Galerie, Tarifs, Contact
- **Espace client** : authentification JWT (cookie httpOnly), tableau de bord devis/factures
- **Wizard devis** : générateur de devis estimatif pas à pas basé sur la grille tarifaire
- **Admin dashboard** : gestion des devis, factures, galerie, témoignages, grille tarifaire
- **API FastAPI v1** (`/api/v1`) avec 40+ endpoints REST
- **Paiement en ligne** : intégration Stripe (création session, webhook, suivi)
- **Génération PDF** : devis et factures via ReportLab (exécution non-bloquante)
- **Envoi email** : notifications automatiques via Brevo (devis, confirmations)
- **SEO** : JSON-LD Schema.org `GeneralContractor`, balises Open Graph / Twitter Card
- **Galerie multimédia** : upload JPEG/PNG/WEBP, catégorisation, affichage public
- **Témoignages** : soumission publique, modération admin (pending / approved / rejected)
- **Grille tarifaire** : CRUD admin, TVA DOM 8,5 %, unités variables
- **Rate limiting** : protection anti-spam en mémoire (sans dépendance externe)
- **Code splitting** : `React.lazy` / `Suspense` pour réduire le bundle initial
- **Page 404** : redirection élégante avec boutons de retour

### Sécurité
- Cookies `httpOnly` + `SameSite=Lax/None` selon l'environnement (`SECURE_COOKIES`)
- Mot de passe admin via variable d'environnement (`ADMIN_PASSWORD`)
- Validation Pydantic v2 sur tous les endpoints
- Rate limiting par IP sur les routes publiques (contact, devis, auth)

### Architecture
- Séparation frontend / backend (monorepo)
- Couche API Axios centralisée avec intercepteur 401
- Services PDF extraits dans `backend/services/pdf.py`
- Dépendances FastAPI partagées dans `backend/deps.py`
- Routers modulaires : `gallery`, `testimonials`, `pricing`
- Tabs admin découplés : `GalleryTab`, `TestimonialsTab`, `PricingTab`
- Lifespan FastAPI (remplace `@app.on_event` déprécié)

---

## Versioning — Guide

### Numérotation SemVer

| Changement | Version | Exemple |
|---|---|---|
| Rupture d'API (breaking change) | MAJEUR `X.0.0` | Suppression d'un endpoint |
| Nouvelle fonctionnalité compatible | MINEUR `1.X.0` | Nouvel endpoint `/api/v1/...` |
| Correctif, patch, hotfix | CORRECTIF `1.0.X` | Fix bug calcul TVA |

### Git tags

```bash
# Taguer une release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Lister les tags
git tag --list "v*" --sort=-version:refname
```

### Versionner l'API

- Routes stables : `/api/v1/...` (ce projet)
- Si breaking change : créer `/api/v2/...` en parallèle, maintenir v1 le temps de la migration
- L'endpoint `/api/version` (non versionné) expose toujours la version courante

### Branches Git

| Branche | Rôle |
|---|---|
| `main` | Production stable, protégée |
| `develop` | Intégration continue |
| `feature/xxx` | Nouvelles fonctionnalités |
| `fix/xxx` | Corrections de bugs |
| `release/vX.Y.Z` | Préparation de release |
| `hotfix/xxx` | Correctifs urgents sur `main` |

[1.0.0]: https://github.com/ddy970ne-pulse/site-web-e3c/releases/tag/v1.0.0
