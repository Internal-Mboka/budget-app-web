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

> **Statut :** Phase 0 validée — GO reçu.

---

## Phase 1 — Grand Nettoyage & Dépendances (Étape 3)

> **Statut :** terminée — en attente de votre validation / commit.

### 1.1 Nettoyage du code obsolète

- [x] Supprimer le modèle `Expense` / `Category` et tout le code associé (pages, API, scripts)
- [x] Supprimer l'authentification cookie-only sans mot de passe (signup public)
- [x] Supprimer les routes API non sécurisées (`/api/expenses`, `/api/db`, `/api/exports/expenses`)
- [x] Supprimer les scripts de migration legacy (`fix-leadership-duplicates`, `diagnose-role-migration`, etc.)
- [x] Supprimer les pages monolithiques (`app/dashboard/`, `app/historique/`)
- [x] Nettoyer les assets / fichiers boilerplate inutiles (`public/vercel.svg`, `build-full.log`, etc.)
- [x] Conserver : identité visuelle, `lib/prisma.ts`, base PWA (`manifest.ts`, `pwa-register.tsx`), config Next/Tailwind
- [x] *(Étape 4)* Réécrire `prisma/schema.prisma` — migration `init_v2` appliquée

### 1.2 Structure Atomic Design

- [x] Créer l'arborescence `components/{atoms,molecules,organisms,templates}`
- [x] Créer `components/ui/` (shadcn/ui — `button` initial)
- [x] Créer `lib/` métier (`auth`, `permissions`, `audit`, `currency`, `utils`)

### 1.3 Installation des dépendances (`thisproject/dependences.md`)

**Auth & Sécurité**
- [x] `next-auth` (v5 / Auth.js)
- [x] `bcryptjs` (+ `@types/bcryptjs`)

**Formulaires & Validation**
- [x] `react-hook-form`, `@hookform/resolvers` *(zod déjà présent)*

**UI / UX**
- [x] shadcn/ui (Radix UI / Base UI)
- [x] `lucide-react`
- [x] `framer-motion`
- [x] `next-themes`

**Dashboard & Dataviz**
- [x] `recharts`
- [x] `@tanstack/react-table`

**Exports**
- [x] `@react-pdf/renderer`
- [x] `papaparse`

**PWA & Notifications**
- [x] `@ducanh2912/next-pwa` *(corrigé depuis typo pilote `@ducanh27012`)*
- [x] `sonner`
- [ ] Brevo *(SDK + clé API — reporté à US-54)*

**Utilitaires**
- [x] `date-fns`
- [x] `currency.js`

**Tests E2E**
- [x] `cypress` (+ `cypress.config.ts`, spec `home.cy.ts`)

---

## Phase 2 — Prisma, Schéma & Seeding (Étape 4)

> **Statut :** terminée — migration + seed appliqués.

- [x] Réécrire `prisma/schema.prisma` selon `thisproject/schemas.md`
- [x] Appliquer les contraintes d'intégrité (index, `onDelete`, immutabilité via `parentTransactionId`)
- [x] Corriger les doublons du schéma pilote (`TransactionType` dupliqué, typo enum `USD`)
- [x] Générer la migration (`20260726042402_init_v2`) — appliquée sur Neon
- [x] Créer `prisma/seed.ts` (5 rôles, 12 permissions, compte DT Prince Vangu)
- [x] Exécuter le seed

---

## Phase 3 — Fondations Dev (Étape 5 — Prérequis)

> **Statut :** terminée — en attente de validation / commit.

- [x] Configurer **NextAuth v5** (JWT, credentials, `roleId` + `permissions` en session)
- [x] Middleware RBAC Next.js (`middleware.ts` + config Edge séparée)
- [x] Design System : tokens Mboka + **Dark Mode** (`ThemeToggle`)
- [x] Layout principal (`components/templates/app-shell.tsx`)
- [x] **Cypress** — specs `auth.cy.ts`, `users.cy.ts`, `password.cy.ts`, `roles.cy.ts`, `sessions.cy.ts`, `two-factor.cy.ts`, `clients.cy.ts` (US-09), `client-detail.cy.ts` (US-10), `client-search.cy.ts` (US-11), `client-edit.cy.ts` (US-12), `client-import-export.cy.ts` (US-13), `client-tags.cy.ts` (US-14), `client-interactions.cy.ts` (US-15), `revenues.cy.ts` (US-16), `revenue-anti-doublon.cy.ts` (US-17), `revenue-payments.cy.ts` (US-18), `revenue-cancellation.cy.ts` (US-19), `revenue-pdf.cy.ts` (US-20), `revenue-payment-history.cy.ts` (US-21), `revenue-planning.cy.ts` (US-22), `revenue-discount.cy.ts` (US-23), `revenue-conflicts.cy.ts` (US-24)
- [x] Page de login (`/login`) avec redirection dashboard par rôle

---

## Phase 4 — User Stories (Étape 5 — Implémentation)

> Chaque US inclut : UI Atomic Design, benchmark Fintech, Dark Mode, tests Cypress E2E.

### SPEC 1 — Authentification, IAM & RBAC

| US | Titre | Statut |
|----|-------|--------|
| US-01 | Connexion sécurisée & persistance de session | `[x]` |
| US-02 | Management utilisateurs & attribution des rôles | `[x]` |
| US-03 | Middleware RBAC (permissions) | `[x]` |
| US-04 | Réinitialisation / gestion mot de passe | `[x]` |
| US-05 | Déconnexion sécurisée | `[x]` |
| US-06 | Gestion dynamique des permissions par rôle | `[x]` |
| US-07 | Sessions actives & déconnexion à distance | `[x]` |
| US-08 | Authentification 2FA / OTP | `[x]` |

### SPEC 2 — Gestion des Tiers & Clients

| US | Titre | Statut |
|----|-------|--------|
| US-09 | Enregistrement & catégorisation clients | `[x]` |
| US-10 | Fiche client & historique transactions | `[x]` |
| US-11 | Recherche & autocomplétion clients | `[x]` |
| US-12 | Mise à jour & archivage fiches tiers | `[x]` |
| US-13 | Import/Export base Tiers | `[x]` |
| US-14 | Tagging & segmentation clients | `[x]` |
| US-15 | Historique interactions & notes client | `[x]` |

### SPEC 3 — Revenus & Réservations

| US | Titre | Statut |
|----|-------|--------|
| US-16 | Saisie entrée d'argent (Studio, Mix, Véhicules, Annexes) | `[x]` |
| US-17 | Sécurisation UX anti-doublon | `[x]` |
| US-18 | Échéanciers de paiement (Acompte & Solde) | `[x]` |
| US-19 | Annulations & pénalités | `[x]` |
| US-20 | Pro-forma / reçus (PDF) | `[x]` |
| US-21 | Paiements échelonnés complémentaires | `[x]` |
| US-22 | Vue Planning & occupations ressources | `[x]` |
| US-23 | Tarification dynamique & remises | `[x]` |
| US-24 | Détection conflits de réservation | `[x]` |

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
| 2026-07-26 | Phase 0 (Analyse) | GO reçu | — |
| 2026-07-26 | Phase 1 (Nettoyage & Dépendances) | GO reçu | — |
| 2026-07-26 | Phase 2 (Prisma & Migration + Seed) | GO reçu | — |
| 2026-07-26 | Phase 3 (Auth, RBAC, Login + pattern UI) | GO reçu | — |
| 2026-07-26 | US-04 (Gestion mot de passe) | *En attente* | — |
| 2026-07-26 | US-06 (Permissions par rôle) | *En attente* | — |
| 2026-07-26 | US-07 (Sessions actives) | *En attente* | — |
| 2026-07-26 | US-08 (Authentification 2FA) | *En attente* | — |
| 2026-07-26 | US-09 (Répertoire clients) | *En attente* | — |
| 2026-07-26 | US-10 (Fiche client & transactions) | *En attente* | — |
| 2026-07-26 | US-11 (Recherche & autocomplétion clients) | *En attente* | — |
| 2026-07-26 | US-12 (Mise à jour fiches tiers) | *En attente* | — |
| 2026-07-26 | US-13 (Import / export base Tiers) | *En attente* | — |
| 2026-07-26 | US-14 (Tagging & segmentation clients) | *En attente* | — |
| 2026-07-26 | US-15 (Historique interactions & notes client) | *En attente* | — |
| 2026-07-26 | US-16 (Saisie entrée d'argent) | *En attente* | — |
| 2026-07-26 | US-17 (Anti-doublon saisie financière) | *En attente* | — |
