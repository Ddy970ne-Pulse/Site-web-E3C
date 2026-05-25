# ROADMAP — E3C Site Web

## P0 — Critique (bloquant pour production)
Aucun bloquant actuellement.

## P1 — Haute priorité (prochaines itérations)

### Email transactionnel — Brevo (Sendinblue)
- **Status**: En attente clé API utilisateur
- **Scope**: Email bienvenue à la création de compte, notification nouvelle demande de devis (admin), confirmation de soumission (client)
- **Note**: Utilisateur a différé — attendre la clé API Brevo

### Conversion Devis → Facture (1-click admin)
- **Status**: Suggéré par agent, validation utilisateur requise
- **Scope**: Dans l'admin, bouton pour convertir une demande de devis validée en facture officielle
- **Note**: Faciliterait le flux business principal

## P2 — Priorité moyenne

### Paiement Stripe avec acomptes personnalisés
- **Status**: En attente clé Stripe utilisateur
- **Scope**: Admin peut définir des acomptes personnalisés (ex: 30% à la commande, 70% à la livraison) avant envoi au client
- **Note**: Extension de la fonctionnalité facture existante

### Réinitialisation de mot de passe
- **Status**: Différé explicitement par l'utilisateur
- **Scope**: Flux "mot de passe oublié" avec envoi email (dépend de Brevo)

## P3 — Backlog / Future

### SEO avancé
- Blog / actualités pour contenu SEO régulier
- FAQ structurée (JSON-LD Schema.org)
- Google Search Console integration

### Analytics
- Intégration Google Analytics 4 ou Plausible
- Tableau de bord analytics plus avancé (entonnoir devis → facture → paiement)

### Améliorations UX
- Drag & drop pour réordonner les items de la galerie
- Preview du devis PDF avant envoi
- Historique des modifications d'une demande de devis (audit trail)

### Thème
- Thème sombre/clair sur les portails admin et client (actuellement seulement sur le site public)
