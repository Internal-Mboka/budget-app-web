# 📘 CONCEPTION FINALE : MBOKA budget (v2.0)

## 1. Aperçu & Architecture Système

Application PWA / Web de gestion financière et opérationnelle sous **Next.js Fullstack**, conçue pour centraliser les flux de trésorerie, supprimer les saisies/calculs manuels et offrir un pilotage financier en temps réel.

```
+---------------------------------------------------------------------------------------------------+
|                              MBOKA STUDIO MANAGER v2.0                                            |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ Auth, IAM (Gestion Utilisateurs) & Middlewares RBAC (Permissions) + Audit Log Tracker (Traçabilité réservée PDG & DT) ]          |
|                                                                                                   |
|  +---------------------------+  +---------------------------+  +-------------------------------+  |
|  | REVENUS                   |  | DÉPENSES                  |  | TIERS & CONTRATS              |  |
|  | - Studio (Heures/Sessions)|  | - Matériel (Achat/Maint.) |  | - Clients / Artistes          |  |
|  | - Services / Mix / Master |  | - Loyer & Charges Fixes   |  | - Prestataires / Intervenants |  |
|  | - Location Véhicules      |  | - Paies & Cachets Staff   |  | - Tarifs & Grilles de Prix    |  |
|  | - Ventes Annexes          |  | - Investissements         |  |                               |  |
|  +-------------+-------------+  +-------------+-------------+  +---------------+---------------+  |
|                |                              |                              |                    |
|                v                              v                              v                    |
|  +---------------------------------------------------------------------------------------------+  |
|  | LOGIQUE MÉTIER & GESTION DES FLUX                                                           |  |
|  | - Calculs temps réel (CA, Dépenses, Solde, Marge Nette)                                     |  |
|  | - Gestion des Échéanciers (Acomptes / Solde / Restant dû)                                   |  |
|  | - Politique d'Annulation & Pénalités (No-show)                                              |  |
|  | - Rapprochement & Clôture de Caisse (Espèces vs Mobile Money vs Banque)                     |  |
|  | - Sécurité UX : Anti-doublon & Verrouillage à la validation de formulaire                   |  |
|  | - Immutabilité financière (Avoirs & Régularisations au lieu de suppression directe)         |  |
|  +--------------------------------------------+------------------------------------------------+  |
|                                               |                                                   |
|                                               v                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | ARCHIVES & DASHBOARD                                                                        |  |
|  | Exports Multi-formats automatisés (PDF & Google Sheets / CSV) 
                             | 
|  | Alertes & Notifications Externe (Webhooks Email / Push)    
                                 | 
|  | Installation PWA dynamique (Bouton de téléchargement contextuel)                            
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

## 2. Structuration des Acteurs, Rôles & Permissions

### A. Matrice des Rôles (RBAC)


|                              |                   |                   |                             |                       |                        |                             |                                |                             |                             |
| ---------------------------- | ----------------- | ----------------- | --------------------------- | --------------------- | ---------------------- | --------------------------- | ------------------------------ | --------------------------- | --------------------------- |
| **Rôle**                     | **Saisie Entrée** | **Saisie Sortie** | **Validation Encaissement** | **Clôture de Caisse** | **Annulation / Avoir** | **Modif/Suppr Transaction** | **Gestion Utilisateurs (IAM)** | **Consultation Audit Logs** | **Accessibilité Dashboard** |
| **PDG (Super Admin)**        | ✅                 | ✅                 | ✅                           | ✅                     | ✅                      | ✅ (Archivage)               | ✅                              | ✅                           | **Full Macro/Micro**        |
| **Directeur Technique (DT)** | ✅                 | ✅                 | ✅                           | ✅                     | ✅                      | ✅ (Archivage)               | ✅                              | ✅                           | **Full Macro/Micro**        |
| **Comptable**                | ✅                 | ✅                 | ✅                           | ✅                     | ✅                      | ❌ (Avoir)                   | ❌                              | ❌                           | **Vue Financière**          |
| **Secrétaire**               | ✅                 | ❌                 | ❌                           | ❌                     | ❌                      | ❌                           | ❌                              | ❌                           | **Vue Opérationnelle**      |
| **Observateur**              | ❌                 | ❌                 | ❌                           | ❌                     | ❌                      | ❌                           | ❌                              | ❌                           | **Macro Uniquement**        |


### B. Typologie des Personas & Management Utilisateurs (IAM)

- **PDG & Directeur Technique (DT) :** Administrateurs absolus du système. Ils disposent des accès complets et de la capacité exclusive de **créer, révoquer, bloquer, supprimer des comptes utilisateurs** et d'assigner leurs rôles/permissions.
- **Comptable :** Responsable du registre, des saisies financières, de la caisse, des régularisations et de l'exportation des données.
- **Secrétaire :** Saisit les ventes/réservations sans pouvoir modifier les montants validés ni enregistrer de dépenses.
- **Observateurs :** Investisseurs/Associés nécessitant un suivi financier sans droit d'action.
- **Tiers / Clients (Catégorisation) :**
  - *Artiste Indépendant / Solo :* Réservations ponctuelles de studio, mix/mastering.
  - *Label / Maison de Disque :* Clients B2B réguliers (comptes de groupe, facturation groupée).
  - *Entreprise / Marque :* Locations pour tournages, pubs ou événements.
  - *Particulier (Occasionnel) :* Clients ponctuels (ex. location de véhicules).

## 3. Spécifications Métier & Cycles de Vie

### A. Cycle de Vie d'une Entrée d'Argent (Revenus)

1. **Saisie Opérationnelle :** La Secrétaire, le DT, le Comptable ou le PDG enregistre une prestation (Studio, Services/Mix, Véhicules, Ventes Annexes).
2. **Sécurité UX Anti-Doublon :** Validation via Server Action Next.js + désactivation immédiate du bouton ou redirection vers la fiche de confirmation.
3. **Étapes du Statut Financier :**
  - *Devis / Pro-forma :* Pour validation client B2B / Label.
  - *Réservé (Acompte requis) :* Blocage du créneau dès réception d'un premier virement/acompte.
  - *En cours / Réalisé :* Service effectué sur le terrain.
  - *Soldé :* Paiement intégral validé.
  - *Litige / Annulé :* Application des pénalités/retenues d'acompte si annulation tardive.
4. **Validation & Agrégation :** Validation du canal d'encaissement (Cash, Mobile Money, Virement). Le Dashboard met à jour le solde instantanément.

### B. Atomisation des Sorties d'Argent (Dépenses)

Saisie réservée au **Comptable**, au **DT** et au **PDG**. Catégorisation stricte :

- **Matériel :** Achat, réparation et maintenance des équipements audio/studio.
- **Loyer & Charges Fixes :** Loyer des locaux, électricité, eau, abonnements internet, carburant.
- **Paies & Cachets Staff :** Salaires permanents, rémunération des ingénieurs du son externes, prestations ponctuelles.
- **Investissements :** Gros achats d'actifs amortissables.

### C. Module de Rapprochement & Clôture de Caisse

- En fin de journée, la clôture de caisse est effectuée par le Comptable, le DT ou le PDG.
- Le système compare le montant théorique calculé par Next.js vs le comptage réel (Espèces / Mobile Money).
- **Affichage Visuel de l'Opérateur :** En cas d'écart (positif ou négatif), l'interface affiche explicitement l'identité visuelle et le nom de l'utilisateur qui effectue la clôture de caisse pour garantir une responsabilisation immédiate.

### D. Immutabilité & Piste d'Audit Globale (Audit Trail)

- Aucune transaction validée ne peut être effacée directement de la BDD.
- Toute correction financière passe par un **Avoir / Régularisation**.
- **Registres d'Audit Système Élargis :** La table `audit_logs` enregistre **absolument toutes les actions du système** (connexions, ajouts/modifications/suppressions de données, clôtures de caisse, modifications de rôles, *Auteur, Action, Datetime, Ancien Montant, Nouveau Montant, Motif*. etc.).
- **Accès Restreint :** La consultation et l'analyse de ces logs de traçabilité sont **exclusivement réservées au PDG et au DT et Comptable**.

## 4. Archives, Dashboard & Spécifications PWA

### A. Analytics & Métriques Clés (Dashboard)

- **Indicateurs Financiers :** Chiffre d'affaires global, Dépenses totales, Trésorerie Nette (`Revenus - Dépenses`), Encaissements réels vs Créances en attente.
- **Taux de Rentabilité des Actifs :** Taux d'occupation du Studio et rentabilité de la flotte de Véhicules.
- **Vue Macro pour Observateurs :** Accès limité aux métriques condensées sans détails opérationnels.

### B. Exports Multi-formats & Notifications

- **Module Archives & Data :** Boutons d'exportation intégrés permettant de générer :
  - Des documents au format **PDF** (factures, reçus, bilans).
  - Des tableurs au format **Sheet / CSV** (exports de données comptables et registres).
- **Alertes Externe :** Intégration de Webhooks (Email et Notifications Push) déclenchés sur événements critiques (ex. dépassement de seuil de dépense, écart de caisse, rappel de solde impayé).

### C. Intégration PWA & Installation Dynamique

- **Configuration PWA :** Manifest PWA (`manifest.json`) lié aux icônes stockées dans `/public/icone/`.
- **Bouton d'Installation Contextuel (UX) :** L'application écoute l'événement `beforeinstallprompt`. Un bouton dédié "Télécharger / Installer l'application" s'affiche uniquement si le navigateur détecte que la PWA n'est pas encore installée sur l'appareil de l'utilisateur.
- **Taxes :** Aucune gestion de TVA ou taxe spécifique.

