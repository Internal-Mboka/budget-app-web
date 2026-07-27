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
- [x] Brevo *(SDK fetch API + clé API — US-54, rappels créances & alertes trimestre)*

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
- [x] **Cypress** — specs `auth.cy.ts`, `users.cy.ts`, `password.cy.ts`, `roles.cy.ts`, `sessions.cy.ts`, `two-factor.cy.ts`, `clients.cy.ts` (US-09), `client-detail.cy.ts` (US-10), `client-search.cy.ts` (US-11), `client-edit.cy.ts` (US-12), `client-import-export.cy.ts` (US-13), `client-tags.cy.ts` (US-14), `client-interactions.cy.ts` (US-15), `revenues.cy.ts` (US-16), `revenue-anti-doublon.cy.ts` (US-17), `revenue-payments.cy.ts` (US-18), `revenue-cancellation.cy.ts` (US-19), `revenue-pdf.cy.ts` (US-20), `revenue-payment-history.cy.ts` (US-21), `revenue-planning.cy.ts` (US-22), `revenue-discount.cy.ts` (US-23), `revenue-conflicts.cy.ts` (US-24), `expenses.cy.ts` (US-25), `expense-adjustments.cy.ts` (US-26), `expense-attachments.cy.ts` (US-27), `expense-staff-payroll.cy.ts` (US-28), `expense-approval.cy.ts` (US-29), `expense-recurring.cy.ts` (US-30), `cash-closing-approval.cy.ts` (US-38), `audit-logs.cy.ts` (US-39–45)
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
| US-25 | Atomisation & enregistrement dépenses | `[x]` |
| US-26 | Immutabilité & Avoirs / Régularisations | `[x]` |
| US-27 | Pièces justificatives (attachments) | `[x]` |
| US-28 | Paies & cachets staff | `[x]` |
| US-29 | Approbation dépenses à seuil élevé | `[x]` |
| US-30 | Dépenses récurrentes automatisées | `[x]` |
| US-31 | Avances de caisse / notes de frais | `[x]` |

### SPEC 5 — Clôture de Caisse & Rapprochement

| US | Titre | Statut |
|----|-------|--------|
| US-32 | Comptages réels fin de journée | `[x]` |
| US-33 | Responsabilisation visuelle opérateur | `[x]` |
| US-34 | Notes de justification d'écart | `[x]` |
| US-35 | Historique clôtures passées | `[x]` |
| US-36 | Verrouillage transactions après clôture | `[x]` |
| US-37 | Impression ticket Z de caisse | `[x]` |
| US-38 | Approbation clôtures à écart (PDG) | `[x]` |

### SPEC 6 — Audit Logs & Traçabilité

| US | Titre | Statut |
|----|-------|--------|
| US-39 | Enregistrement automatique actions critiques | `[x]` |
| US-40 | Consultation restreinte journaux d'audit | `[x]` |
| US-41 | Capture IP & User-Agent | `[x]` |
| US-42 | Inspection visuelle Diff Avant/Après | `[x]` |
| US-43 | Export journaux d'audit | `[x]` |
| US-44 | Alertes tentatives d'accès suspectes | `[x]` |
| US-45 | Politique de conservation des logs | `[x]` |

### SPEC 7 — Dashboard Analytics

| US | Titre | Statut |
|----|-------|--------|
| US-46 | Dashboard financier global temps réel | `[x]` |
| US-47 | Vue macro Observateurs | `[x]` |
| US-48 | Ventilation CA par activité | `[x]` |
| US-49 | Taux d'occupation espaces studio | `[x]` |
| US-50 | Créances & factures impayées | `[x]` |
| US-51 | Comparatif performances N vs N-1 | `[x]` |
| US-52 | Projection trésorerie & prévisions | `[x]` |

### SPEC 8 — Archives, Exports & PWA

| US | Titre | Statut |
|----|-------|--------|
| US-53 | Export données comptables & factures | `[x]` |
| US-54 | Webhooks & alertes événements critiques | `[x]` |
| US-55 | Installation PWA & prompt contextuel | `[x]` |

<!-- US-55 : manifest fr + start_url /dashboard, prompt contextuel (post-login, délai 1,8 s, dismiss 14 j), page /offline brandée, bandeau réseau offline, viewport themeColor. -->
| US-56 | Mode hors-ligne partiel & sync | `[x]` |

<!-- US-56 : cache SW pages essentielles (NetworkFirst), snapshot dashboard sessionStorage, bandeau offline/reconnecté + bouton Actualiser (`router.refresh`). US-60 = queue saisie revenu IndexedDB + sync auto. -->
| US-57 | Bilan financier périodique | `[x]` |
| US-58 | Personnalisation alertes Push/Webhooks | `[x]` |

<!-- US-58 : /admin/alerts (DT uniquement) — toggles canaux, webhook URL/secret, seuil régularisation, types désactivables, ping test. Push web = prochaine version. -->
| US-59 | Historique exports & stockage | `[x]` |

<!-- US-59 : GeneratedExport + storage/exports — historique /exports/history (PDG, DT, Comptable), téléchargement archive ou régénération. -->
| US-60 | Queue sync hors-ligne transactions | `[x]` |

<!-- US-60 : IndexedDB queue saisies revenu, POST /api/revenues, sync auto à la reconnexion + Background Sync SW, toasts confirmation. -->

### SPEC 9 — Ergonomie UX & Robustesse

| US | Titre | Statut |
|----|-------|--------|
| US-61 | Skeleton Screen & React Suspense | `[x]` |
| US-62 | Toasts instantanés (Sonner) | `[x]` |
| US-63 | Raccourcis clavier saisie rapide | `[x]` |
| US-64 | Thème sombre / clair studio | `[x]` |
| US-65 | Error Boundaries globales | `[x]` |
| US-66 | Responsive mobile & tablettes régie | `[x]` |

<!-- SPEC 9 : MbokaSkeleton + loading.tsx (dashboard, revenus, dépenses, clients), Toaster Mboka, Ctrl+Shift+N / Ctrl+Entrée, theme storageKey mboka-theme, error.tsx, touch targets 44px sidebar. -->

---

## Clés API & services tiers (à configurer par le client)

| Service | Variable(s) | Étape concernée |
|---------|-------------|-----------------|
| PostgreSQL / Neon | `DATABASE_URL` | Étape 4 |
| Seuil approbation dépenses | `EXPENSE_APPROVAL_THRESHOLD_USD` (défaut : 500) | US-29 |
| NextAuth | `AUTH_SECRET`, `AUTH_URL` | Étape 5 |
| Brevo (emails) | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | US-54, US-58 |
| Alertes webhooks | `ALERT_WEBHOOK_URL`, `ALERT_WEBHOOK_SECRET`, `ALERTS_ENABLED`, `ALERT_ADJUSTMENT_THRESHOLD_USD` | US-54 |
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

---

## SPEC 10 — Pilotage financier avancé & Périodes comptables trimestrielles

> **Origine :** retour d'expérience post-SPEC 7 (dashboard) + benchmark flux financiers vs `conception.md`.
> **Objectif :** clarifier les KPI (période vs global), offrir deux modes comptables, enrichir la trésorerie par canal, et introduire un **trimestre métier Mboka** (distinct du filtre calendaire dashboard actuel).
> **Principe d'intégration :** extension additive — ne pas supprimer les filtres `kpiPeriod` / `granularity` existants ; les compléter par de nouveaux paramètres URL et loaders dédiés. Réutiliser `paymentHistory`, clôture caisse (SPEC 5), audit (SPEC 6) et notifications (US-54).

### Vue d'ensemble — ordre d'implémentation recommandé

```
Phase A (Dashboard KPI)     → US-67 → US-68 → US-69 → US-70 → US-71 → US-72 → US-73
Phase B (Période comptable) → US-74 → US-75 → US-76 → US-77 → US-78 → US-79 → US-80
Phase C (Bilan PDF)         → US-57 (SPEC 8, existante) — branché sur FiscalPeriod (US-74) `[x]`
```

| État système | Saisies financières | Dashboard |
|--------------|---------------------|-----------|
| Aucune `FiscalPeriod` | Bloquées sauf onboarding T1 (US-75) | Bandeau « Initialiser le 1er trimestre » |
| `OPEN` | Autorisées (période courante) | « Trimestre comptable Tn » + filtres calendaires inchangés |
| `CLOSING` | Bloquées — attente validation | Bandeau + file de clôture PDG/Comptable |
| `CLOSED` | Lecture seule ; régularisations sur période **ouverte** uniquement | Historique archivé |

---

### Bloc A — Clarification KPI dashboard (feedbacks 1.A, 1.B, 1.C, 1.F)

| US | Titre | Statut |
|----|-------|--------|
| US-67 | Segmentation visuelle KPI : « Activité (période) » vs « Position (global) » | `[x]` |
| US-68 | Toggle Période / Global sur les cartes KPI principales | `[x]` |
| US-69 | Carte « Encaissements réels sur la période » | `[x]` |
| US-70 | Mode comptable : Engagement vs Encaissement | `[x]` |
| US-71 | Propagation mode comptable aux graphiques & comparatifs N/N-1 | `[x]` |
| US-72 | KPI « Solde caisse ouvert » (clôture + mouvements du jour) | `[x]` |
| US-73 | Trésorerie globale ventilée par canal de paiement | `[x]` |

<!-- US-67 : Aujourd'hui CA/Dépenses = période (createdAt) alors que Trésorerie/Créances = global → confusion UX (capture dashboard juillet 2026). Deux sous-grilles ou séparateurs visuels dans `dashboard-financial-section` sans changer les calculs. -->

<!-- US-68 : Switch « Période | Global » (URL `kpiScope=period|global`, défaut `period`). En global : CA = Σ totalAmount, Dépenses = Σ totalAmount, Trésorerie/Créances inchangés. En période : comportement actuel. Permet de recoller mentalement les chiffres sans dupliquer toute la page. -->

<!-- US-69 : 5ᵉ carte (ou remplacement dynamique selon scope) : Σ paidAmount revenus sur la période, date = entrées `paymentHistory.recordedAt` (fallback createdAt legacy). Hint explicite « Encaissements réels · [période] ». -->

<!-- US-70 : Param URL `accountingMode=accrual|cash` (défaut `accrual` = engagement/saisie actuelle). Mode encaissement : KPI CA, graphique Revenus vs Dépenses et ventilation CA basés sur dates de paiement. Lib loaders `lib/dashboard/` — pas de breaking change : mode engagement reste le défaut. -->

<!-- US-71 : Étendre `loadPeriodFinancialTotals`, `loadRevenueExpenseSeries`, `loadRevenueByCategory`, `loadDashboardKpiComparison` pour accepter `accountingMode`. Comparatif N/N-1 cohérent avec le mode actif. Macro observateur : engagement uniquement (pas de détail opérationnel). -->

<!-- US-72 : Nouveau KPI distinct de trésorerie nette : dernière `CashClosing` validée (opening + theoretical du jour) + mouvements espèces/Mobile Money du jour non clôturé. Réutilise `lib/cash-closing/`. Complète le verrou journalier US-36 sans le remplacer. -->

<!-- US-73 : Trésorerie nette globale décomposée : Espèces, Mobile Money, Virement bancaire, Autre — via `paymentMethod` revenus/dépenses et `paymentHistory`. Tooltip ou sous-lignes sous la carte Trésorerie. -->

<!-- 1.F : Comparatif N/A en démarrage = comportement conservé. Projection scénarios (US-52) inchangée. Multi-devises : documenter limite USD agrégé si pas de conversion dans cette SPEC. -->

---

### Bloc B — Module période comptable trimestrielle (feedbacks 2, 3, 4, 1.D, 1.E)

| US | Titre | Statut |
|----|-------|--------|
| US-74 | Modèle Prisma `FiscalPeriod` & soldes d'ouverture optionnels | `[x]` |
| US-75 | Onboarding : initialisation manuelle du 1er trimestre (T1) | `[x]` |
| US-76 | Verrous métier selon état période (OPEN / CLOSING / CLOSED) | `[x]` |
| US-77 | Passage automatique OPEN → CLOSING à l'échéance trimestrielle | `[x]` |
| US-78 | Workflow validation clôture (PDG + Comptable) & notifications | `[x]` |
| US-79 | Ouverture automatique T+1 après validation & report créances | `[x]` |
| US-80 | Affichage dashboard « Trimestre comptable Mboka » | `[x]` |

<!-- US-74 : Tables suggérées — `FiscalPeriod` (id, label T1/T2…, startDate, endDate, status: PENDING_SETUP|OPEN|CLOSING|CLOSED, closedAt, validatedByPdgId, validatedByAccountantId, openingBalanceCash?, openingBalanceMobile?, openingBalanceBank?, skipOpeningBalance boolean). Index sur status + dates. Migration additive. -->

<!-- US-75 : Écran `/dashboard/setup` ou wizard modal (PDG ou DT) si aucune période OPEN. Saisie date début T1 (fin = +3 mois − 1 jour). Soldes d'ouverture par canal OPTIONNELS (case « Nouveau départ — sans solde initial »). Débloque revenus/dépenses/paiements. Audit `FISCAL_PERIOD_INITIALIZED`. -->

<!-- US-76 : `lib/fiscal-period/lock.ts` — complète `assertTodayCashDayOpen` (SPEC 5, journalier). CLOSING/CLOSED : bloquer create/update transactions sur la période ; régularisations autorisées uniquement sur période OPEN (vigilance 4). Pas de DELETE. Secrétaire/Comptable/DT/PDG soumis au même verrou période. -->

<!-- US-77 : Job au démarrage app + middleware layout `(app)` : si `endDate < today` et status OPEN → passer CLOSING, figer saisies, audit log. Bandeau UI tous rôles financiers. -->

<!-- US-78 : Page `/dashboard/cloture-trimestre` — file d'attente CLOSING. Visa Comptable puis validation PDG (ou PDG seul configurable). Notification email stub → branchera US-54 (Brevo). Audit `FISCAL_PERIOD_CLOSING_REQUESTED|APPROVED`. Double validation = vigilance 4. -->

<!-- US-79 : Après double validation : status CLOSED, snapshot agrégats trimestre, création auto `FiscalPeriod` T+1 en OPEN (dates enchaînées). `remainingAmount` créances reportées implicitement (pas de perte). -->

<!-- US-80 : Bandeau KPI header : « Trimestre comptable : T2 2026 (15 mar – 14 jun) · OPEN ». Distinct du label « Trimestre en cours » calendaire (`getKpiPeriodRange`). Filtres dashboard existants conservés pour analyse calendaire parallèle. -->

<!-- 1.D : Soldes d'ouverture intégrés à US-74/75 — optionnels. -->
<!-- 1.E : Clôture mensuelle / bilan PDF infalsifiable = US-57 (SPEC 8). US-74 prépare le modèle ; US-57 consommera `FiscalPeriod` pour génération PDF et blocage ajustements rétroactifs mensuels/trimestriels. Ne pas dupliquer ici. -->

---

### Bloc C — Bilan PDF trimestriel (US-57 × FiscalPeriod)

| Élément | Statut |
|---------|--------|
| Lien `FinancialPeriodClosure.fiscalPeriodId` + créances archivées | `[x]` |
| Archivage auto à la finalisation clôture (US-79) | `[x]` |
| API `/api/exports/fiscal-period-balance/pdf` | `[x]` |
| Téléchargement depuis récap clôture trimestre | `[x]` |
| Test Cypress PDF post-clôture | `[x]` |

<!-- US-57 trimestriel : code document `BQ-T1-2026`, hash d'intégrité, synthèse trimestre + créances reportées. Coexiste avec bilan mensuel civil (`BP-YYYY-MM`). -->

---

### Dépendances inter-SPEC restantes

| US existante | Lien avec SPEC 10 | Statut |
|--------------|-------------------|--------|
| US-54 | Emails clôture trimestre (visa → PDG, clôture → équipe) + rappels créances Brevo | `[x]` |
| US-36 | Verrou caisse **journalier** — reste complémentaire au verrou **trimestriel** (US-76) | — |
| US-46–52 | Dashboard analytics — étendus par US-67–73 et US-80, non remplacés | — |

<!-- US-54 trimestre : CLOSING → Comptable+PDG+DT ; visa comptable → PDG ; clôture/T+1 → Comptable+PDG+DT. Rappels créances client via `sendReceivableReminderFormAction`. -->

---

### Notes techniques d'intégration (éviter les régressions)

1. **Loaders dashboard** : extraire une factory `getDashboardMetrics({ kpiPeriod, kpiScope, accountingMode, reference })` plutôt que dupliquer Prisma dans chaque fichier.
2. **URL searchParams** : ajouter `kpiScope`, `accountingMode` à `buildFinancialDashboardHref` (comme `projectionPeriod`) — tous les panneaux dashboard préservent les params existants.
3. **Période comptable** : vérification centralisée dans les Server Actions revenus/dépenses/paiements (`lib/actions/`) + message UI explicite si CLOSING.
4. **Tests Cypress** : specs dédiées `dashboard-kpi-scope.cy.ts`, `fiscal-period.cy.ts` — ne pas modifier les specs US-46–52 existantes sauf assertions additive.
5. **Seed dev** : comptes `SEED_PDG_*` + `SEED_DT_*` ; option `SEED_FISCAL_PERIOD=open` pour bypass onboarding en local/E2E.

---

### SPEC 10 — Journal des validations

| Date | US | Validé par | Commit |
|------|-----|------------|--------|
| — | SPEC 10 (planification) | Retour client juillet 2026 | — |

---

## Refactor — Sessions & appareils (post-livraison v2.0)

> **Standards :** OWASP Session Management — sessions = unité de sécurité, appareils = regroupement UX, révocation des *autres* sessions après changement de mot de passe, limite douce des sessions concurrentes.
> **Statut :** implémenté en continu (retours terrain).

| ID | Titre | Statut |
|----|-------|--------|
| REF-S01 | Vue groupée par appareil (1 carte = 1 device, révocation de toutes les sessions de l'appareil) | `[x]` |
| REF-S02 | Compteur « X appareils · Y sessions » + pagination par appareil | `[x]` |
| REF-S03 | Réutilisation session même poste (24 h) + purge 30 j inactive | `[x]` |
| REF-S04 | Limite douce 10 sessions max avec retrait auto des plus anciennes | `[x]` |
| REF-S05 | Changement mot de passe → option « Déconnecter les autres appareils » (OWASP 3.3.3) | `[x]` |
| REF-S06 | Conserver la session courante après changement de mot de passe (plus de déconnexion forcée) | `[x]` |

<!-- REF-S01–S06 : lib/sessions/device-groups.ts, active-sessions-panel, enforceSessionLimit, changePasswordAction + checkbox. -->

---

## Phase 5 — Backlog post-livraison (v2.1+)

> **Contexte :** la feuille de route v2.0 (SPEC 1 → 10) est implémentée. Cette section recense les évolutions **hors scope livraison actuelle**, identifiées dans le code, les specs ou la dette technique restante.
> **Priorité :** P1 = recommandé avant / juste après prod · P2 = valeur métier forte · P3 = confort / scale.

### Légende

| Priorité | Signification |
|----------|---------------|
| P1 | Bloquant ou fortement recommandé pour la production multi-utilisateurs |
| P2 | Amélioration métier notable |
| P3 | Confort, scale ou polish |

---

### A — Notifications & alertes

| ID | Titre | Priorité | Statut |
|----|-------|----------|--------|
| V2-A01 | **Push Web** pour alertes critiques (Web Push API + SW) — complète US-58 (email/webhook déjà OK) | P2 | `[ ]` |
| V2-A02 | Abonnement push par utilisateur / rôle (opt-in depuis `/admin/alerts` ou profil) | P2 | `[ ]` |
| V2-A03 | Canaux messagerie terrain : SMS ou WhatsApp Business (rappels créances, alertes caisse) | P3 | `[ ]` |
| V2-A04 | Planification automatique des rappels créances (cron / job, au-delà de l'envoi manuel Brevo) | P2 | `[ ]` |

<!-- V2-A01 : US-58 mentionne « Push web = prochaine version » dans TODO. conception.md — Webhooks Email / Push. -->

---

### B — Stockage cloud & infrastructure production

| ID | Titre | Priorité | Statut |
|----|-------|----------|--------|
| V2-B01 | **Stockage cloud S3/R2** des pièces justificatives dépenses (US-27 — local `storage/` aujourd'hui) | P1 | `[ ]` |
| V2-B02 | **Stockage cloud** des exports archivés `GeneratedExport` (US-59 — local `storage/exports/`, incompatible multi-instance Vercel) | P1 | `[ ]` |
| V2-B03 | Pipeline CI/CD (lint, build, migrations, Cypress sur PR) | P1 | `[ ]` |
| V2-B04 | Environnements staging + prod séparés (Neon branch, variables d'env) | P1 | `[ ]` |
| V2-B05 | Monitoring & observabilité (Sentry ou équivalent, logs structurés alertes échouées) | P2 | `[ ]` |
| V2-B06 | Sauvegardes automatisées base Neon + rétention exports | P2 | `[ ]` |

<!-- V2-B01/B02 : TODO.md clés API — « Stockage fichiers S3/R2 » US-27. Exports et attachments partagent le même besoin prod. -->

---

### C — Finances, devises & comptabilité

| ID | Titre | Priorité | Statut |
|----|-------|----------|--------|
| V2-C01 | **Multi-devises agrégées** au dashboard (conversion CDF ↔ USD avec taux configurable ou API) | P2 | `[ ]` |
| V2-C02 | Taux de change journalier / historique (table `ExchangeRate`, audit des conversions) | P2 | `[ ]` |
| V2-C03 | Bilans et exports respectant la devise d'origine + colonne convertie | P3 | `[ ]` |
| V2-C04 | Factory unique `getDashboardMetrics()` — dette SPEC 10 note technique #1 | P3 | `[ ]` |

<!-- V2-C01 : SPEC 10 — « documenter limite USD agrégé si pas de conversion ». Revenus/dépenses en USD et CDF coexistent. -->

---

### D — PWA, offline & terrain

| ID | Titre | Priorité | Statut |
|----|-------|----------|--------|
| V2-D01 | Queue offline **dépenses** (extension US-60 — revenus seuls aujourd'hui) | P2 | `[ ]` |
| V2-D02 | Sync conflict resolution (doublon, conflit réservation après reconnexion) | P2 | `[ ]` |
| V2-D03 | Indicateur UI persistent « N saisies en attente » accessible hors bandeau réseau | P3 | `[ ]` |
| V2-D04 | Cache offline élargi (fiche client, planning réservations du jour) | P3 | `[ ]` |

---

### E — UX, profil & préférences

| ID | Titre | Priorité | Statut |
|----|-------|----------|--------|
| V2-E01 | Préférence **thème clair/sombre sur le profil utilisateur** (US-64 — localStorage `mboka-theme` seulement) | P3 | `[ ]` |
| V2-E02 | Streaming dashboard par panneau (`Suspense` granulaire — approfondissement US-61) | P3 | `[ ]` |
| V2-E03 | Panneau aide raccourcis clavier accessible depuis le menu (US-63 — toast `Ctrl+Shift+?` seulement) | P3 | `[ ]` |
| V2-E04 | `loading.tsx` / skeletons sur routes restantes (audit, exports, admin, clôture trimestre) | P3 | `[ ]` |

---

### F — Facturation, documents & clients

| ID | Titre | Priorité | Statut |
|----|-------|----------|--------|
| V2-F01 | **Module factures** formalisées (numérotation, statut émise/payée/annulée, lien client) | P2 | `[ ]` |
| V2-F02 | Envoi facture / reçu par email au client (Brevo, PDF en pièce jointe) | P2 | `[ ]` |
| V2-F03 | Portail client lecture seule (historique, PDF, solde restant) | P3 | `[ ]` |
| V2-F04 | Relance impayés avec template personnalisable par segment client | P3 | `[ ]` |

<!-- V2-F01 : client-search-panel — « prêt pour une future facture » ; conception.md — factures PDF. -->

---

### G — Sécurité, conformité & exploitation

| ID | Titre | Priorité | Statut |
|----|-------|----------|--------|
| V2-G01 | Rate limiting API (exports, auth, upload attachments) | P2 | `[ ]` |
| V2-G02 | Archivage froid des journaux d'audit au-delà de la politique US-45 (S3 + rétention légale) | P3 | `[ ]` |
| V2-G03 | Export RGPD / suppression compte utilisateur avec anonymisation audit | P3 | `[ ]` |
| V2-G04 | Revue permissions Observateur (accès macro vs fuite de détail opérationnel) | P3 | `[ ]` |

---

### H — Qualité & tests

| ID | Titre | Priorité | Statut |
|----|-------|----------|--------|
| V2-H01 | Suite Cypress complète en CI (tous rôles, parcours clôture trimestre bout-en-bout) | P1 | `[ ]` |
| V2-H02 | Tests de charge sur exports PDF / registres CSV volumineux | P3 | `[ ]` |
| V2-H03 | Documentation opérateur (secrétaire, comptable, PDG) — hors `thisproject/` | P2 | `[ ]` |

---

### Ordre d'implémentation suggéré (v2.1 → v2.3)

```
v2.1 Prod-ready     → V2-B01, V2-B02, V2-B03, V2-B04, V2-H01
v2.2 Métier         → V2-A01, V2-C01, V2-D01, V2-F01, V2-F02
v2.3 Scale & polish → V2-A03, V2-E01, V2-F03, V2-G02, V2-E02
```

> **Note :** ne pas démarrer une entrée v2.1+ tant que la validation client `[✓]` de la livraison v2.0 n'est pas actée (cf. règle en tête de fichier).

