# Momo Premium ⚡

> L'application de gestion de caisse et de transactions Mobile Money pour les cabines de vente au Bénin.

**Momo Premium** permet aux gérants et propriétaires de points de vente Mobile Money de suivre en temps réel leurs soldes d'opérateurs, leurs coffres-forts, de sécuriser leurs transactions et de gérer efficacement les opérations quotidiennes.

---

## 🌟 Fonctionnalités clés

- **Suivi Multi-Opérateurs** : Gestion en temps réel des soldes MTN MoMo, Moov Money, Celtiis et de la caisse physique (Cash).
- **Gestion des Coffres (Start Float)** : Définition des réserves de départ pour calculer précisément les écarts de caisse.
- **Sécurisation par PIN** : Rôles distincts pour le propriétaire (`proprio`) et l'employé (`employe`), protégé par un code PIN.
- **Blacklist Communautaire** : Base de données de numéros signalés pour limiter les risques d'arnaque.
- **Opérations Courantes** :
  - Dépôts et Retraits clients.
  - Vente de Crédit de communication.
  - Activation de Forfaits Internet/Appels (MTN, Moov, Celtiis).
  - Ajustements de caisse et approvisionnements de SIM.
- **Partage WhatsApp** : Génération et envoi instantané de reçus thermiques personnalisés aux clients sur WhatsApp.
- **Export de Données** : Téléchargement de l'historique complet des transactions au format CSV.
- **Base de Données Hybride** : Persistance locale (localStorage) avec synchronisation en temps réel sur Supabase (PostgreSQL).

## 🛠️ Stack Technique

- **Framework** : Next.js 16 (React 19, Tailwind CSS v4, TypeScript)
- **Base de données** : Supabase (PostgreSQL)
- **Animations & Icônes** : Framer Motion, Lucide React

## 🚀 Démarrage Rapide

### 1. Cloner le projet et installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine en vous basant sur `.env.local.example` :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anonyme
```

### 3. Initialiser la Base de Données

Exécutez le script SQL présent dans `supabase-schema.sql` dans l'éditeur SQL de votre projet Supabase pour créer les tables nécessaires (`momo_transactions`, `momo_balances`, `momo_coffres`, `momo_blacklist`, `momo_settings`) et activer la Row Level Security (RLS).

### 4. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.
