Stack Technique & Dépendances



1. Authentification & Sécurité RBAC


|                                |                                 |                                                                                                                                                                                                                |
| ------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Librairie**                  | **Utilisation dans le projet**  | **Justification**                                                                                                                                                                                              |
| `next-auth` **(v5 / Auth.js)** | Authentification JWT & Sessions | Gestion native des sessions Next.js App Router (Server Actions & Middlewares). Permet d'injecter facilement le `roleId` et les `permissions` dans la session pour un contrôle d'accès instantané côté serveur. |
| `bcryptjs` ou `argon2`         | Hachage des mots de passe      | Indispensable pour sécuriser le stockage des mots de passe dans le champ `password` de la table `User`.                                                                                                        |




2. Base de Données & Validations (Server-First)


|                                           |                                             |                                                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Librairie**                             | **Utilisation dans le projet**              | **Justification**                                                                                                                                                 |
| `@prisma/client` & `prisma`               | ORM & Migrations BDD                        | Interface de requêtage typée de bout en bout liée directement à notre schéma Postgres/Prisma.                                                                     |
| `zod`                                     | Validation des formulaires & Server Actions | Sécurité absolue des entrate de données. Assure que chaque transaction, création de client ou clôture de caisse respecte le schéma avant même d'atteindre la BDD. |
| `react-hook-form` + `@hookform/resolvers` | Formulaires complexes côté client           | Intégration parfaite avec `zod`. Offre une expérience utilisateur réactive sans rechargement de page pour la saisie des entrées/sorties.                          |




3. Interface Utilisateur (UI/UX) & Composants


|                                     |                                           |                                                                                                                                     |
| ----------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Librairie**                       | **Utilisation dans le projet**            | **Justification**                                                                                                                   |
| `tailwindcss`                       | Framework CSS utility-first               | Standard incontournable pour un style sur-mesure, rapide et entièrement responsive.                                                 |
| `shadcn/ui` (basé sur **Radix UI**) | Composants UI accessibles & customisables | Offre des composants accessibles (Dialogs, Dropdowns, Tables, Selects, Toasts) légers et prêts pour le mode sombre.                 |
| `lucide-react`                      | Iconographie moderne                      | Icônes SVG optimisées pour illustrer les catégories de revenus, dépenses, rôles et statuts.                                         |
| `framer-motion`                     | Animations micro-interactions             | Pour une UX raffinée : transitions fluides entre les étapes de formulaire, ouverture des modals, micro-animations sur le Dashboard. |
| `next-themes`                       | Support du Dark / Light Mode              | Permet un basculement de thème propre sans *flash* au chargement de la PWA.                                                         |




4. Dashboards & Dataviz (Analyse Financière)


|                                 |                                  |                                                                                                                                                   |
| ------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Librairie**                   | **Utilisation dans le projet**   | **Justification**                                                                                                                                 |
| `recharts` ou `@tremor/react`   | Graphiques financiers temps réel | Visualisation dynamique du CA, des dépenses, de la marge nette et du taux d'occupation des studios/véhicules.                                     |
| `tanstack/react-table` **(v8)** | Data Tables avancées             | Indispensable pour les registres de transactions et les `AuditLogs` : gestion du tri, filtrage par date/catégorie, pagination et vue synthétique. |




5. Exports (Archives, Factures & CSV)


|                          |                                       |                                                                                                                   |
| ------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Librairie**            | **Utilisation dans le projet**        | **Justification**                                                                                                 |
| `@react-pdf/renderer`    | Génération de PDF côté client/serveur | Permet de créer des factures, reçus d'acompte et bilans de caisse au format PDF en utilisant de la syntaxe React. |
| `papaparse` ou `exceljs` | Export Google Sheets / CSV / Excel    | Export propre des registres de trésorerie pour le comptable et le PDG en un clic.                                 |






6. PWA, Webhooks & Notifications


|                                                                 |                                     |                                                                                                                                      |
| --------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Librairie**                                                   | **Utilisation dans le projet**      | **Justification**                                                                                                                    |
| `next-pwa` ou `@ducanh27012/next-pwa`                           | Progressive Web App & Offline Cache | Génère le `service-worker.js` et gère la mise en cache pour installer l'application sur mobile/desktop et l'utiliser sur le terrain. |
| `sonner`                                                        | Toasts & Notifications en direct    | Toasts fluides pour confirmer les validations de formulaires, la sécurité anti-doublon ou signaler un écart de caisse.               |
| `resend` + `@react-email/components``ou Brevo (à privilegier)` | Webhooks & Notifications Email      | Envoi automatisé d'alertes par email (rappels d'impayés, alertes d'écart de caisse, envois de reçus clients).                        |






7. Formateurs & Utilitaires Métier


|                            |                                   |                                                                                                                     |
| -------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Librairie**              | **Utilisation dans le projet**    | **Justification**                                                                                                   |
| `date-fns`                 | Manipulation des dates & créneaux | Gestion simple des plages horaires de studio, dates de clôture de caisse et filtres de recherche.                   |
| `numeral` ou `currency.js` | Formatage monétaire               | Affichage propre et sécurisé des montants (ex: `1 500,00 $` ou FC) sans erreurs d'arrondis sur les types `Decimal`. |




8. Testes End-to-End

- cypress.

