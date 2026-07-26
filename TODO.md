# MBOKA BUDGET v2.0 — Feuille de route

> **Règle de déroulement :** chaque étape terminée nécessite validation / commit avant de passer à la suivante.
> Le dossier `thisproject/` est **strictement en lecture seule**.

---

## Légende des statuts

| Statut | Signification |
|--------|---------------|
| `[ ]` | À faire |
| `[~]` | En cours |
| `[x]` | Terminé — en attente de validation |
| `[✓]` | Validé par le client |

---

## Phase 0 — Analyse (Étapes 1 & 2)

- [x] **Étape 1** — Analyse globale du projet actuel
- [x] **Étape 2** — Analyse du dossier pilote (`conception.md`, `dependences.md`, `schemas.md`, `specs.md`)
- [x] Création de ce fichier `TODO.md`

> **Statut :** en attente de votre **GO** pour lancer l'Étape 3.

---

## Phase 1 — Grand Nettoyage & Dépendances (Étape 3)

### 1.1 Nettoyage du code obsolète

- [ ] Supprimer le modèle `Expense` / `Category` et tout le code associé (pages, API, scripts)
- [ ] Supprimer l'authentification cookie-only sans mot de passe (`app/page.tsx` signup public)
- [ ] Supprimer les routes API non sécurisées (`/api/expenses`, `/api/db`, `/api/exports/expenses`)
- [ ] Supprimer les scripts de migration legacy (`fix-leadership-duplicates`, `diagnose-role-migration`, etc.)
- [ ] Supprimer les pages monolithiques (`app/dashboard/`, `app/historique/`)
- [ ] Nettoyer les assets / fichiers boilerplate inutiles (`public/vercel.svg`, `build-full.log`, etc.)
- [ ] Conserver : identité visuelle, `lib/prisma.ts`, base PWA (`manifest.ts`, `pwa-register.tsx`), config Next/Tailwind

### 1.2 Structure Atomic Design

- [ ] Créer l'arborescence `components/{atoms,molecules,organisms,templates}`
- [ ] Créer `components/ui/` (shadcn/ui)
- [ ] Créer `lib/` métier (`auth`, `permissions`, `audit`, `currency`, etc.)

### 1.3 Installation des dépendances (`thisproject/dependences.md`)

**Auth & Sécurité**
- [ ] `next-auth` (v5 / Auth.js)
- [ ] `bcryptjs` (+ `@types/bcryptjs`)

**Formulaires & Validation**
- [ ] `react-hook-form`, `@hookform/resolvers` *(zod déjà présent)*

**UI / UX**
- [ ] shadcn/ui (Radix UI)
- [ ] `lucide-react`
- [ ] `framer-motion`
- [ ] `next-themes`

**Dashboard & Dataviz**
- [ ] `recharts` *(ou `@tremor/react` — à confirmer)*
- [ ] `@tanstack/react-table`

**Exports**
- [ ] `@react-pdf/renderer`
- [ ] `papaparse` *(ou `exceljs` — à confirmer)*

**PWA & Notifications**
- [ ] `@ducanh27012/next-pwa`
- [ ] `sonner`
- [ ] Brevo *(clé API requise — demander au client)*

**Utilitaires**
- [ ] `date-fns`
- [ ] `currency.js` *(ou `numeral`)*

**Tests E2E**
- [ ] `cypress` (+ config initiale)

---

## Phase 2 — Prisma, Schéma & Seeding (Étape 4)

- [ ] Réécrire `prisma/schema.prisma` selon `thisproject/schemas.md`
- [ ] Appliquer les contraintes d'intégrité (transactions Prisma `$transaction`, index, immutabilité)
- [ ] Corriger les doublons / erreurs du schéma pilote si nécessaire *(sans modifier `thisproject/`)*
- [ ] Générer la migration (`npx prisma migrate dev`)
- [ ] Créer `prisma/seed.ts` :
  - Rôles & permissions par défaut (PDG, DT, Comptable, Secrétaire, Observateur)
  - Compte initial **Directeur Technique — Prince Vangu**
- [ ] Exécuter migration + seed

---

## Phase 3 — Fondations Dev (Étape 5 — Prérequis)

- [ ] Configurer **NextAuth v5** (providers, callbacks `roleId` + `permissions`)
- [ ] Middleware RBAC Next.js (`middleware.ts`)
- [ ] Design System : tokens CSS (`#10579F`, dégradé sky/white) + **Dark Mode** (`next-themes`)
- [ ] Layout principal (Atomic Design : `templates/AppShell`)
- [ ] Initialiser **Cypress** (`cypress.config.ts`, commandes, fixtures)
- [ ] Page de login (remplace le signup public)

---

## Phase 4 — User Stories (Étape 5 — Implémentation)

> Chaque US inclut : UI Atomic Design, benchmark Fintech, Dark Mode, tests Cypress E2E.

### SPEC 1 — Authentification, IAM & RBAC

| US | Titre | Statut |
|----|-------|--------|
| US-01 | Connexion sécurisée & persistance de session | `[ ]` |
| US-02 | Management utilisateurs & attribution des rôles | `[ ]` |
| US-03 | Middleware RBAC (permissions) | `[ ]` |
| US-04 | Réinitialisation / gestion mot de passe | `[ ]` |
| US-05 | Déconnexion sécurisée | `[ ]` |
| US-06 | Gestion dynamique des permissions par rôle | `[ ]` |
| US-07 | Sessions actives & déconnexion à distance | `[ ]` |
| US-08 | Authentification 2FA / OTP | `[ ]` |

### SPEC 2 — Gestion des Tiers & Clients

| US | Titre | Statut |
|----|-------|--------|
| US-09 | Enregistrement & catégorisation clients | `[ ]` |
| US-10 | Fiche client & historique transactions | `[ ]` |
| US-11 | Recherche & autocomplétion clients | `[ ]` |
| US-12 | Mise à jour & archivage fiches tiers | `[ ]` |
| US-13 | Import/Export base Tiers | `[ ]` |
| US-14 | Tagging & segmentation clients | `[ ]` |
| US-15 | Historique interactions & notes client | `[ ]` |

### SPEC 3 — Revenus & Réservations

| US | Titre | Statut |
|----|-------|--------|
| US-16 | Saisie entrée d'argent (Studio, Mix, Véhicules, Annexes) | `[ ]` |
| US-17 | Sécurisation UX anti-doublon | `[ ]` |
| US-18 | Échéanciers de paiement (Acompte & Solde) | `[ ]` |
| US-19 | Annulations & pénalités | `[ ]` |
| US-20 | Pro-forma / reçus (PDF) | `[ ]` |
| US-21 | Paiements échelonnés complémentaires | `[ ]` |
| US-22 | Vue Planning & occupations ressources | `[ ]` |
| US-23 | Tarification dynamique & remises | `[ ]` |
| US-24 | Détection conflits de réservation | `[ ]` |

### SPEC 4 — Dépenses & Sorties

| US | Titre | Statut |
|----|-------|--------|
| US-25 | Atomisation & enregistrement dépenses | `[ ]` |
| US-26 | Immutabilité & Avoirs / Régularisations | `[ ]` |
| US-27 | Pièces justificatives (attachments) | `[ ]` |
| US-28 | Paies & cachets staff | `[ ]` |
| US-29 | Approbation dépenses à seuil élevé | `[ ]` |
| US-30 | Dépenses récurrentes automatisées | `[ ]` |
| US-31 | Avances de caisse / notes de frais | `[ ]` |

### SPEC 5 — Clôture de Caisse & Rapprochement

| US | Titre | Statut |
|----|-------|--------|
| US-32 | Comptages réels fin de journée | `[ ]` |
| US-33 | Responsabilisation visuelle opérateur | `[ ]` |
| US-34 | Notes de justification d'écart | `[ ]` |
| US-35 | Historique clôtures passées | `[ ]` |
| US-36 | Verrouillage transactions après clôture | `[ ]` |
| US-37 | Impression ticket Z de caisse | `[ ]` |
| US-38 | Approbation clôtures à écart (PDG) | `[ ]` |

### SPEC 6 — Audit Logs & Traçabilité

| US | Titre | Statut |
|----|-------|--------|
| US-39 | Enregistrement automatique actions critiques | `[ ]` |
| US-40 | Consultation restreinte journaux d'audit | `[ ]` |
| US-41 | Capture IP & User-Agent | `[ ]` |
| US-42 | Inspection visuelle Diff Avant/Après | `[ ]` |
| US-43 | Export journaux d'audit | `[ ]` |
| US-44 | Alertes tentatives d'accès suspectes | `[ ]` |
| US-45 | Politique de conservation des logs | `[ ]` |

### SPEC 7 — Dashboard Analytics

| US | Titre | Statut |
|----|-------|--------|
| US-46 | Dashboard financier global temps réel | `[ ]` |
| US-47 | Vue macro Observateurs | `[ ]` |
| US-48 | Ventilation CA par activité | `[ ]` |
| US-49 | Taux d'occupation espaces studio | `[ ]` |
| US-50 | Créances & factures impayées | `[ ]` |
| US-51 | Comparatif performances N vs N-1 | `[ ]` |
| US-52 | Projection trésorerie & prévisions | `[ ]` |

### SPEC 8 — Archives, Exports & PWA

| US | Titre | Statut |
|----|-------|--------|
| US-53 | Export données comptables & factures | `[ ]` |
| US-54 | Webhooks & alertes événements critiques | `[ ]` |
| US-55 | Installation PWA & prompt contextuel | `[ ]` |
| US-56 | Mode hors-ligne partiel & sync | `[ ]` |
| US-57 | Bilan financier périodique | `[ ]` |
| US-58 | Personnalisation alertes Push/Webhooks | `[ ]` |
| US-59 | Historique exports & stockage | `[ ]` |
| US-60 | Queue sync hors-ligne transactions | `[ ]` |

### SPEC 9 — Ergonomie UX & Robustesse

| US | Titre | Statut |
|----|-------|--------|
| US-61 | Skeleton Screen & React Suspense | `[ ]` |
| US-62 | Toasts instantanés (Sonner) | `[ ]` |
| US-63 | Raccourcis clavier saisie rapide | `[ ]` |
| US-64 | Thème sombre / clair studio | `[ ]` |
| US-65 | Error Boundaries globales | `[ ]` |
| US-66 | Responsive mobile & tablettes régie | `[ ]` |

---

## Clés API & services tiers (à configurer par le client)

| Service | Variable(s) | Étape concernée |
|---------|-------------|-----------------|
| PostgreSQL / Neon | `DATABASE_URL` | Étape 4 |
| NextAuth | `AUTH_SECRET`, `AUTH_URL` | Étape 5 |
| Brevo (emails) | `BREVO_API_KEY` | US-54, US-58 |
| Stockage fichiers (S3/R2) | `*` | US-27 *(si cloud storage)* |

---

## Journal des validations

| Date | Étape | Validé par | Commit |
|------|-------|------------|--------|
| — | Phase 0 (Analyse) | *En attente* | — |
