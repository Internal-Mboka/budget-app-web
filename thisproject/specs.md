## SPEC 1 : Authentification, IAM & RBAC

### US-01 : Connexion sécurisée & Persistance de session

**En tant qu'** utilisateur du système (PDG, DT, Comptable, Secrétaire, Observateur),

**Je veux** me connecter avec mon email et mot de passe,

**Afin d'** accéder à mon espace de travail sécurisé selon mes droits d'accès.

- **Critères d'acceptation :**
  - Authentification gérée en Server Actions / API Routes Next.js avec gestion de jetons (JWT/Sessions cookies HTTP-only).
  - Redirection automatique vers le dashboard correspondant au rôle après authentification.
  - Blocage d'accès immédiat si le compte a le fanion `isActive: false`.

### US-02 : Management des utilisateurs & Attribution des rôles

**En tant que** PDG ou Directeur Technique (DT),

**Je veux** créer, modifier, bloquer des comptes utilisateurs et leur assigner un rôle (`Role`),

**Afin de** contrôler l'accès aux fonctionnalités de l'application.

- **Critères d'acceptation :**
  - Interface dédiée de gestion des utilisateurs (exclusive aux permissions `users:manage`).
  - Possibilité de basculer le statut `isActive` d'un utilisateur.
  - Historisation de chaque création/modification dans la table `AuditLog`.

### US-03 : Contrôle d'accès basé sur les permissions (Middlewares RBAC)

**En tant que** Système,

**Je veux** vérifier les permissions associées au rôle de l'utilisateur sur les routes API et les pages Next.js via un middleware,

**Afin de** restreindre l'exécution d'actions non autorisées (ex: accès aux dépenses pour une Secrétaire).

- **Critères d'acceptation :**
  - Le middleware Next.js intercepte les requêtes et bloque les accès non autorisés (ex: HTTP 403).
  - Les composants UI masquent ou désactivent les boutons d'action si l'utilisateur ne possède pas la permission requise.

### US-04 : Réinitialisation et gestion mot de passe sécurisée

**En tant qu'** utilisateur authentifié ou administrateur,

**Je veux** modifier mon mot de passe ou déclencher une réinitialisation de mot de passe à la première connexion,

**Afin de** garantir la confidentialité de mes identifiants de connexion.

- **Critères d'acceptation :**
  - Hachage fort des mots de passe en BDD (ex: bcrypt / argon2).
  - Validation de la complexité du mot de passe côté serveur.
  - Notification d'alerte sécurité envoyée à l'utilisateur lors du changement.

### US-05 : Déconnexion sécurisée et invalidation des sessions

**En tant qu'** utilisateur actif,

**Je veux** me déconnecter explicitement du système sur mon appareil,

**Afin de** purger mes cookies de session et d'empêcher un accès non autorisé.

- **Critères d'acceptation :**
  - Invalidation du cookie de session côté serveur (`cookies().delete()`).
  - Redirection vers la page de login et purge du cache local.

### US-06 : Gestion dynamique des permissions par rôle

**En tant que** PDG ou DT,

**Je veux** associer ou dissocier des permissions (`Permission.slug`) à un rôle (`Role`),

**Afin d'** ajuster les habilitations sans devoir redéployer le code applicatif.

- **Critères d'acceptation :**
  - Interface sous forme de grille de checkboxes désignant les permissions par rôle.
  - Mise à jour instantanée des relations Prisma entre `Role` et `Permission`.

### US-07 (Nouveau ++) : Gestion des sessions actives et déconnexion à distance

**En tant qu'** utilisateur ou Administrateur (PDG/DT),

**Je veux** consulter la liste des appareils/sessions actuellement connectés à mon compte et pouvoir les révoquer individuellement,

**Afin de** sécuriser mon accès en cas d'oubli de déconnexion sur un ordinateur partagé du studio.

- **Critères d'acceptation :**
  - Liste des sessions avec type d'appareil, navigateur, IP et date de dernière activité.
  - Bouton "Se déconnecter de tous les autres appareils" invalidant les jetons associés.

### US-08 (Nouveau ++) : Authentification à deux facteurs (2FA / OTP)

**En tant que** PDG ou Comptable,

**Je veux** activer l'authentification à deux facteurs (2FA) sur mon compte,

**Afin de** protéger l'accès aux données financières stratégiques contre le vol de mot de passe.

- **Critères d'acceptation :**
  - Prise en charge des applications Authenticator (TOTP via QR Code) ou envoi d'un code OTP.
  - Saisie obligatoire du code à 6 chiffres après la validation du mot de passe sur les rôles sensibles.

## SPEC 2 : Gestion des Tiers & Clients

### US-09 : Enregistrement et catégorisation des clients (Anciennement US-07)

**En tant que** Secrétaire, Comptable ou DT,

**Je veux** enregistrer un nouveau client en spécifiant sa catégorie (`ClientCategory` : Artiste, Label, Entreprise, Particulier),

**Afin de** constituer un répertoire centralisé pour la facturation et le suivi des prestations.

- **Critères d'acceptation :**
  - Formulaire de saisie avec validation des champs (Nom, Catégorie obligatoire, Téléphone/Email facultatifs).
  - Prévention des doublons par vérification du nom/téléphone lors de la saisie.

### US-10 : Consultation de la fiche client et historique des transactions (Anciennement US-08)

**En tant que** Comptable ou PDG,

**Je veux** consulter la fiche détaillée d'un client avec l'ensemble de ses transactions (`Transaction[]`),

**Afin d'** évaluer son volume d'affaires, ses factures soldées et ses encours/créances.

- **Critères d'acceptation :**
  - Affichage des statistiques individuelles du client (Total dépensé, Solde restant dû).
  - Filtrage rapide de l'historique par statut de paiement (`PaymentStatus`).

### US-11 : Recherche rapide et autocomplétion des clients (Anciennement US-09)

**En tant que** Secrétaire ou Comptable,

**Je veux** rechercher un client par son nom, téléphone ou catégorie lors de la création d'une transaction,

**Afin de** lier la facture au bon profil en quelques secondes.

- **Critères d'acceptation :**
  - Composant d'autocomplétion dynamique avec recherche insensible à la casse.
  - Possibilité de créer un client "à la volée" depuis un modal sans quitter la saisie de facture.

### US-12 : Mise à jour et archivage des fiches tiers (Anciennement US-10)

**En tant que** Secrétaire, Comptable ou DT,

**Je veux** modifier les coordonnées d'un client ou ajouter des notes internes,

**Afin de** conserver des informations de contact et des accords commerciaux toujours à jour.

- **Critères d'acceptation :**
  - Mise à jour fluide avec validation Zod / Server Action.
  - Conservation de l'historique financier intact même en cas de modification des coordonnées.

### US-13 : Import/Export de la base Tiers & Contacts (Anciennement US-11)

**En tant que** Comptable ou PDG,

**Je veux** exporter le répertoire des clients sous format Excel/CSV ou en importer une liste,

**Afin d'** effectuer des campagnes d'information ou des vérifications comptables externes.

- **Critères d'acceptation :**
  - Exportation structurée incluant le statut du compte et le chiffre d'affaires cumulé.
  - Validation du schéma de données lors d'un import de masse.

### US-14 (Nouveau ++) : Tagging et segmentation personnalisée des clients

**En tant que** Secrétaire, DT ou PDG,

**Je veux** attribuer des étiquettes/tags personnalisés aux fiches clients (ex: "VIP", "Mauvais payeur", "Résident", "Abonné Studio"),

**Afin de** catégoriser rapidement la relation commerciale et appliquer des conditions spécifiques.

- **Critères d'acceptation :**
  - Ajout/Suppression de tags colorés depuis la fiche client.
  - Filtre multi-critères dans le répertoire client basé sur ces tags.

### US-15 (Nouveau ++) : Historique d'interactions et notes de suivi client

**En tant que** Secrétaire ou DT,

**Je veux** consignez des notes datées sur les échanges avec le client (ex: "Accord de remise de 10% validé par le DT", "Relance effectuée"),

**Afin de** conserver un historique d'échange partagé entre toute l'équipe administrative.

- **Critères d'acceptation :**
  - Fil d'actualité chronologique rattaché au profil client.
  - Horodatage automatique et mention de l'auteur de la note.

## SPEC 3 : Gestion des Revenus & Réservations

### US-16 : Saisie d'une entrée d'argent (Studio, Mix, Véhicules, Annexes) (Anciennement US-12)

**En tant que** Secrétaire, DT ou Comptable,

**Je veux** enregistrer un revenu en sélectionnant sa catégorie (`RevenueCategory`) et en saisissant les métadonnées spécifiques dans le champ `metadata`,

**Afin de** comptabiliser la prestation dans le système sans déformer la structure de la BDD.

- **Critères d'acceptation :**
  - Génération automatique d'un code unique lisible (ex: `TR-2026-0001`).
  - Enregistrement dynamique du JSON dans `metadata` selon le type (ex: `{ "studioRoom": "A", "durationHours": 4 }` pour une session studio ou `{ "vehiclePlate": "1234-AB", "days": 2 }` pour une location).

### US-17 : Sécurisation UX Anti-doublon lors de la validation (Anciennement US-13)

**En tant qu'** utilisateur réalisant une saisie financière,

**Je veux** que le bouton de validation soit verrouillé immédiatement après le clic lors de l'exécution de la Server Action,

**Afin d'** éviter les double-clics intempestifs et la création de transactions en double.

- **Critères d'acceptation :**
  - Utilisation des états de chargement Next.js (`useFormStatus` / Pending states) pour désactiver le bouton dès la soumission.
  - Redirection ou notification toast instantanée confirmant la création.

### US-18 : Gestion des échéanciers de paiement (Acompte & Solde) (Anciennement US-14)

**En tant que** Secrétaire ou Comptable,

**Je veux** enregistrer un acompte (`paidAmount`) sur une réservation et recalculer automatiquement le reste à payer (`remainingAmount`),

**Afin de** suivre la progression du règlement jusqu'à l'état SOLDE.

- **Critères d me d'acceptation :**
  - Calcul automatique côté serveur de `remainingAmount = totalAmount - paidAmount`.
  - Mise à jour du statut : `RESERVE_ACOMPTE_REQUIS` si un acompte est perçu, `SOLDE` si `remainingAmount == 0`.

### US-19 : Annulations de session et gestion des pénalités (Anciennement US-15)

**En tant que** Comptable ou DT,

**Je veux** passer une transaction au statut `LITIGE_ANNULE` en appliquant les règles d'annulation/retenue d'acompte,

**Afin de** libérer le créneau réservé tout en enregistrant l'impact financier de l'annulation.

- **Critères d'acceptation :**
  - Possibilité de saisir un motif d'annulation conservé dans les métadonnées ou notes.
  - Si un acompte est conservé à titre de pénalité (no-show), ajustement de la transaction en conséquence.

### US-20 : Édition et impression de pro-forma / reçus (Anciennement US-16)

**En tant que** Secrétaire ou Comptable,

**Je veux** générer une facture pro-forma ou un reçu immédiatement après la saisie d'un acompte,

**Afin de** le fournir instantanément au client (au format PDF ou impression thermique/A4).

- **Critères d'acceptation :**
  - Mise en page professionnelle au format du studio avec le code unique `TR-XXXX-XXXX`.
  - Affichage clair du montant versé, du solde restant dû et du mode de règlement.

### US-21 : Gestion des paiements échelonnés complémentaires (Anciennement US-17)

**En tant que** Comptable ou Secrétaire,

**Je veux** ajouter un versement intermédiaire sur une transaction déjà en cours,

**Afin de** réduire le `remainingAmount` au fur et à mesure des encaissements.

- **Critères d'acceptation :**
  - Mise à jour atomique du `paidAmount` et recalcul automatique du solde.
  - Inscription de l'historique du versement dans les métadonnées ou sous-historique.

### US-22 : Vue Planning & Occupations des ressources (Anciennement US-18)

**En tant que** Secrétaire ou DT,

**Je veux** visualiser un calendrier récapitulant les sessions studio et locations de véhicules enregistrées,

**Afin d'** éviter les chevauchements et les doubles réservations d'équipements.

- **Critères d'acceptation :**
  - Vue synoptique alimentée directement par le champ JSON `metadata` des transactions de revenu.
  - Code couleur selon le statut financier de la réservation (En cours, Soldé, Litige).

### US-23 (Nouveau ++) : Tarification dynamique et remises exceptionnelles

**En tant que** DT ou PDG,

**Je veux** appliquer un pourcentage ou un montant fixe de remise sur une transaction de revenu lors de sa création,

**Afin d'** accorder des gestes commerciaux tout en gardant une trace du prix de base avant réduction.

- **Critères d'acceptation :**
  - Calcul explicite du montant de la remise stocké dans les métadonnées.
  - Affichage distinctif sur le reçu généré (Prix d'origine, Remise accordée, Total final).

### US-24 (Nouveau ++) : Détection de conflits de réservation en temps réel

**En tant que** Système,

**Je veux** vérifier l'absence de chevauchement horaire sur la même régie/cabine ou le même véhicule lors de la validation d'une réservation,

**Afin de** refuser la transaction et avertir l'utilisateur avant l'enregistrement.

- **Critères d'acceptation :**
  - Analyse des métadonnées horaires (`startTime`, `endTime`, `resourceId`) au moment d'exécuter la Server Action.
  - Message d'erreur explicite renvoyé si le créneau est déjà occupé par une réservation non annulée.

## SPEC 4 : Gestion des Dépenses & Sorties

### US-25 : Atomisation et enregistrement des dépenses (Anciennement US-19)

**En tant que** Comptable, DT ou PDG,

**Je veux** enregistrer une sortie d'argent sous une catégorie stricte (`ExpenseCategory` : Matériel, Loyer/Charges, Paies/Staff, Investissement),

**Afin de** garantir une classification rigoureuse des charges opérationnelles et d'investissement.

- **Critères d'acceptation :**
  - Champs obligatoires : Libellé, Montant (`totalAmount`), Catégorie de dépense, Mode de paiement (`PaymentMethod`).
  - Interdiction d'accès à cette fonctionnalité pour le rôle Secrétaire.

### US-26 : Immutabilité financière & Création d'Avoirs / Régularisations (Anciennement US-20)

**En tant que** Comptable, DT ou PDG,

**Je veux** corriger une erreur financière en émettant un avoir/régularisation lié (`isAdjustment: true` + `parentTransactionId`),

**Afin de** modifier le solde net sans jamais supprimer directement une transaction en base de données.

- **Critères d'acceptation :**
  - Interdiction de supprimer une entrée dans la table `Transaction`.
  - La transaction d'ajustement fait référence à la transaction d'origine via `parentTransactionId`.
  - Notification/Traçabilité écrite générée dans l'Audit Log.

### US-27 : Attachement de pièces justificatives aux dépenses (Anciennement US-21)

**En tant que** Comptable ou DT,

**Je veux** téléverser une photo/numérisation d'une facture fournisseur ou d'un reçu de caisse sur une dépense,

**Afin de** conserver une preuve comptable dématérialisée.

- **Critères d'acceptation :**
  - Stockage de l'URL du fichier joint dans le champ JSON `metadata`.
  - Visualisation rapide du document dans le détail de la dépense.

### US-28 : Saisie des paies et cachets d'ingénieurs son / staff (Anciennement US-22)

**En tant que** Comptable ou PDG,

**Je veux** enregistrer un paiement de salaire ou un cachet lié à un intervenant/ingénieur du son spécifique,

**Afin de** suivre l'historique des rémunérations au sein de la catégorie PAIES_CACHETS_STAFF.

- **Critères d'acceptation :**
  - Saisie de l'intervenant destinataire et détails des prestations associées.
  - Ventilation claire dans le bilan financier des charges de personnel.

### US-29 : Validation/Approbation des dépenses à seuil élevé (Anciennement US-23)

**En tant que** PDG,

**Je veux** valider ou recevoir une demande de confirmation pour toute dépense supérieure à un montant défini,

**Afin de** garder le contrôle direct sur les décaissements majeurs.

- **Critères d'acceptation :**
  - Si le montant dépasse le seuil fixé, la dépense passe par un statut en attente de validation par le PDG.
  - Validation en 1 clic via notification ou dashboard de direction.

### US-30 (Nouveau ++) : Saisie des dépenses récurrentes automatisées

**En tant que** Comptable ou PDG,

**Je veux** configurer le renouvellement automatique de dépenses périodiques (Loyer, Abonnements Internet, Électricité),

**Afin de** pré-générer les échéances à régler au début de chaque mois.

- **Critères d'acceptation :**
  - Définition de la fréquence (Mensuelle, Trimestrielle) et du montant estimé.
  - Notification de rappel pour validation et décaissement effectif à la date d'échéance.

### US-31 (Nouveau ++) : Gestion des demandes d'avance de caisse / Note de frais

**En tant que** Directeur Technique ou Agent,

**Je veux** soumettre une demande d'avance de caisse pour un achat urgent de matériel,

**Afin que** le Comptable ou le PDG puisse l'approuver avant la sortie de trésorerie.

- **Critères d'acceptation :**
  - Formulaire de demande d'avance spécifiant le motif et le montant estimé.
  - Workflow d'approbation : Soumis -> Approuvé -> Décaissé -> Justifié (avec rattachement de reçu).

## SPEC 5 : Clôture de Caisse & Rapprochement

### US-32 : Saisie des comptages réels de fin de journée (Anciennement US-24)

**En tant que** Comptable, DT ou PDG,

**Je veux** saisir les montants réels comptés en Espèces (`realCash`) et Mobile Money (`realMobileMoney`) lors de la clôture de caisse,

**Afin de** valider la journée comptable et d'identifier d'éventuels écarts.

- **Critères d'acceptation :**
  - Le système calcule les montants théoriques (`theoreticalCash`, `theoreticalMobileMoney`) sur la base des transactions validées de la journée.
  - Calcul automatique de l'écart : `gapAmount = (realCash + realMobileMoney) - (theoreticalCash + theoreticalMobileMoney)`.
  - Activation automatique du drapeau `hasDiscrepancy = true` si `gapAmount != 0`.

### US-33 : Responsabilisation visuelle de l'opérateur de clôture (Anciennement US-25)

**En tant que** PDG ou Directeur Technique,

**Je veux** visualiser clairement l'avatar et le nom de l'utilisateur qui a effectué la clôture de caisse (`operatorId`),

**Afin de** garantir une responsabilisation immédiate de l'agent en cas d'écart de caisse constaté.

- **Critères d'acceptation :**
  - Affichage de la carte d'identité de l'opérateur (`User.firstName`, `User.lastName`, `User.avatarUrl`) sur la fiche de clôture et l'historique des clôtures.

### US-34 : Saisie des notes de justification d'écart (Anciennement US-26)

**En tant que** Comptable ou opérateur de clôture,

**Je veux** ajouter une note explicative obligatoire dans le champ `notes` lorsque le système détecte un écart de caisse,

**Afin d'** documenter les raisons de la différence avant l'enregistrement.

- **Critères d'acceptation :**
  - Si `hasDiscrepancy == true`, le champ `notes` devient obligatoire avant soumission.
  - Traçabilité de l'explication dans la fiche de clôture consultable par le PDG.

### US-35 : Historique et consultation des clôtures passées (Anciennement US-27)

**En tant que** Comptable, DT ou PDG,

**Je veux** consulter un registre chronologique de toutes les clôtures de caisse effectuées,

**Afin de** contrôler la régularité des liquidités en caisse jour après jour.

- **Critères d'acceptation :**
  - Filtre par plage de dates et par présence d'anomalies/écarts (`hasDiscrepancy`).
  - Récapitulatif visuel sous forme de tableau interactif.

### US-36 : Verrouillage des transactions après clôture de caisse (Anciennement US-28)

**En tant que** Système,

**Je veux** empêcher l'ajout ou la modification rétroactive de transactions sur une journée dont la caisse a déjà été clôturée,

**Afin de** préserver l'intégrité des rapports de caisse validés.

- **Critères d'acceptation :**
  - Vérification du statut de clôture pour la date de transaction saisie.
  - Nécessité d'émettre une régularisation sur la journée en cours si une correction s'impose.

### US-37 (Nouveau ++) : Impression du ticket récapitulatif de clôture de caisse (Z de Caisse)

**En tant que** Comptable ou Opérateur de caisse,

**Je veux** imprimer un bon récapitulatif physique à la fin de la procédure de clôture,

**Afin de** le signer et de l'agrafer à la pochette contenant les espèces physiques de la journée.

- **Critères d'acceptation :**
  - Génération d'un format d'impression optimisé (ticket thermique 80mm ou page A5/A4).
  - Récapitulatif clair : Solde initial, Ventes espèces, Ventes Mobile Money, Dépenses du jour, Écart constaté et signatures.

### US-38 (Nouveau ++) : Procédure de validation / Approbation des clôtures à écart par le PDG

**En tant que** PDG,

**Je veux** recevoir une alerte et valider manuellement toute clôture ayant un statut `hasDiscrepancy: true`,

**Afin de** marquer l'écart comme analysé, régularisé ou imputé à l'agent responsable.

- **Critères d'acceptation :**
  - Ajout d'un statut d'approbation sur la fiche de clôture (`PENDING_REVIEW`, `APPROVED`, `RESOLVED`).
  - Possibilité pour le PDG de consigner une instruction de régularisation comptable.

## SPEC 6 : Traçabilité, Audit Logs & Piste d'Audit

### US-39 : Enregistrement automatique des actions critiques (Audit Trail) (Anciennement US-29)

**En tant que** Système,

**Je veux** générer automatiquement une entrée dans `AuditLog` à chaque événement sensible (connexion, ajustement financier, clôture de caisse, modif utilisateur),

**Afin de** maintenir un registre inaltérable des opérations effectuées.

- **Critères d'acceptation :**
  - Capture systématique de l'auteur (`userId`), de l'action (`action`), de l'entité visée (`entity`, `entityId`), de l'adresse IP et de l'état avant/après dans le champ JSON `details`.

### US-40 : Consultation restreinte des journaux d'audit (Anciennement US-30)

**En tant que** PDG, Directeur Technique ou Comptable,

**Je veux** consulter et filtrer les logs de traçabilité système,

**Afin d'** enquêter sur des anomalies financières ou opérationnelles.

- **Critères d'acceptation :**
  - Interface de recherche avancée filtrable par date, utilisateur, type d'action et entité.
  - Accès strictly bloqué pour les rôles Secrétaire et Observateur.

### US-41 : Capture des métadonnées d'accès (IP & User-Agent) (Anciennement US-31)

**En tant que** Directeur Technique ou PDG,

**Je veux** enregistrer l'adresse IP et le type d'appareil/navigateur sur chaque entrée d'audit log,

**Afin de** détecter les connexions suspectes ou l'utilisation d'appareils non autorisés.

- **Critères d'acceptation :**
  - Extraction automatique des en-têtes HTTP (`x-forwarded-for`, `user-agent`) côté Server Actions / Middleware.
  - Affichage dans l'inspecteur de logs de la console d'administration.

### US-42 : Inspection visuelle des états "Avant / Après" (Diff) (Anciennement US-32)

**En tant que** PDG ou DT,

**Je veux** visualiser un comparatif visuel côte à côte de la donnée avant et après modification dans le champ JSON `details`,

**Afin d'** identifier immédiatement la nature exacte d'une altération de donnée.

- **Critères d'acceptation :**
  - Formateur JSON visuel mettant en évidence les clés modifiées (ex: surbrillance rouge/verte).

### US-43 : Export des journaux d'audit à des fins de conformité (Anciennement US-33)

**En tant que** PDG ou DT,

**Je veux** exporter une période donnée des `AuditLogs` au format CSV/JSON,

**Afin de** réaliser une sauvegarde externe ou un contrôle externe en cas de litige majeur.

- **Critères d'acceptation :**
  - Génération sécurisée et horodatée du fichier d'audit.
  - Inscription de l'action d'exportation elle-même dans les logs.

### US-44 (Nouveau ++) : Alertes automatiques sur tentatives d'accès suspectes

**En tant que** Système,

**Je veux** enregistrer un événement d'avertissement dans les `AuditLogs` après 3 échecs consécutifs de connexion sur un compte,

**Afin de** tracer les attaques par force brute ou les tentatives d'usurpation.

- **Critères d'acceptation :**
  - Création automatique d'une entrée avec la catégorie `SECURITY_ALERT`.
  - Blocage temporaire facultatif de l'adresse IP source.

### US-45 (Nouveau ++) : Verrouillage de la politique de conservation des journaux d'audit

**En tant que** PDG ou DT,

**Je veux** garantir que les entrées `AuditLog` enregistrées ne puissent être ni modifiées ni supprimées via l'interface applicative,

**Afin de** répondre aux normes de conformité et de lutte contre la fraude interne.

- **Critères d'acceptation :**
  - Absence de route API ou d'action utilisateur permettant le `DELETE` ou `UPDATE` sur la table `AuditLog`.
  - Garantie d'une écriture seule (*Append-only*).

## SPEC 7 : Dashboard Analytics & Direction

### US-46 : Visualisation du Dashboard Financier Global en temps réel (Anciennement US-34)

**En tant que** PDG, DT ou Comptable,

**Je veux** afficher les indicateurs clés de performance (Chiffre d'affaires, Dépenses totales, Trésorerie nette, Créances restant dues),

**Afin de** piloter la santé financière du studio en temps réel.

- **Critères d'acceptation :**
  - Mises à jour calculées côté serveur avec agrégations Prisma performantes.
  - Graphique de comparaison Revenus vs Dépenses par période (Jour, Semaine, Mois).

### US-47 : Vue condensée/Macro pour les Observateurs (Anciennement US-35)

**En tant qu'** Observateur (Investisseur / Associé),

**Je veux** accéder à un tableau de bord restreint aux métriques macroéconomiques sans détails opérationnels,

**Afin de** suivre la rentabilité de mon investissement en toute confidentialité.

- **Critères d'acceptation :**
  - Masquage complet des listes nominatives de clients, fiches de paie et détails des dépenses.
  - Affichage uniquement des totaux agrégés (CA global, Marge nette, Taux d'occupation).

### US-48 : Ventilation du Chiffre d'Affaires par activité (Anciennement US-36)

**En tant que** PDG ou DT,

**Je veux** consulter un graphique en camembert ou barres répartissant les revenus par sous-catégorie (Studio, Mix/Master, Location Véhicule, Ventes Annexes),

**Afin de** déterminer les services les plus rentables du studio.

- **Critères d'acceptation :**
  - Calcul automatique basé sur l'enum `RevenueCategory`.
  - Filtre temporel interactif (Ce mois, Ce trimestre, Cette année).

### US-49 : Suivi du taux d'occupation des espaces studio (Anciennement US-37)

**En tant que** Directeur Technique ou PDG,

**Je veux** suivre le ratio d'heures vendues versus la capacité d'ouverture des régies/cabines,

**Afin d'** optimiser la tarification et le temps de réservation.

- **Critères d'acceptation :**
  - Analyse extraite du champ `metadata` (`durationHours`) des sessions studio.
  - Indicateur clé de rentabilité des actifs (ROA).

### US-50 : Analyse des créances en souffrance et factures impayées (Anciennement US-38)

**En tant que** Comptable ou PDG,

**Je veux** accéder à un rapport récapitulant l'ensemble des transactions au statut `RESERVE_ACOMPTE_REQUIS` dont la date est dépassée,

**Afin de** relancer les clients pour solder leurs impayés.

- **Critères d'acceptation :**
  - Liste triée par montant de créance restant dû (`remainingAmount`) et ancienneté.
  - Action rapide pour envoyer un rappel ou enregistrer le paiement.

### US-51 (Nouveau ++) : Tableau de bord comparatif des performances périodiques (N vs N-1)

**En tant que** PDG ou Comptable,

**Je veux** comparer les métriques du mois en cours avec celles du même mois de l'année précédente (ou du mois passé),

**Afin d'** évaluer la croissance relative de l'entreprise.

- **Critères d'acceptation :**
  - Calcul des pourcentages de variation (ex: CA +15% vs Mois M-1).
  - Indicateurs visuels colorés (Flèches vertes/rouges).

### US-52 (Nouveau ++) : Projection de trésorerie et prévisions des encaissements

**En tant que** PDG ou Comptable,

**Je veux** visualiser un graphique prévisionnel des encaissements attendus basé sur les soldes de réservations futures déjà enregistrées,

**Afin d'** anticiper les rentrées d'argent à court et moyen terme.

- **Critères d'acceptation :**
  - Agrégation des montants `remainingAmount` ordonnée par date prévue de session/prestation.
  - Estimation du niveau de trésorerie futur.

## SPEC 8 : Archives, Exports & Notifications PWA

### US-53 : Exportation des données comptables et factures (Anciennement US-39)

**En tant que** Comptable ou PDG,

**Je veux** générer et télécharger des rapports au format PDF (factures, reçus, bilans) et CSV/Sheets (registres comptables),

**Afin de** faciliter l'archivage externe et la transmission des pièces justificatives.

- **Critères d'acceptation :**
  - Boutons d'exportation d'état avec génération dynamique côté serveur (PDF/CSV).
  - Les exports respectent la période et les filtres sélectionnés par l'utilisateur.

### US-54 : Webhooks & Alertes automatisées sur événements critiques (Anciennement US-40)

**En tant que** PDG ou Directeur Technique,

**Je veux** recevoir des notifications automatiques (Email / Webhooks Push) lors d'événements à haut risque,

**Afin d'** intervenir rapidement en cas d'anomalie.

- **Critères d'acceptation :**
  - Déclenchement d'alertes en cas de : détection d'un écart de caisse (`hasDiscrepancy: true`), dépassement de seuils de dépenses, ou régularisation de montant élevé.

### US-55 : Installation PWA & Prompt contextuel dynamique (Anciennement US-41)

**En tant qu'** utilisateur mobile ou desktop,

**Je veux** pouvoir installer l'application MBOKA STUDIO MANAGER directement sur mon appareil via un bouton d'installation contextuel,

**Afin de** l'utiliser comme une application native fluide et rapide.

- **Critères d'acceptation :**
  - Le système écoute l'événement JS `beforeinstallprompt`.
  - Le bouton "Télécharger / Installer l'application" apparaît de manière dynamique uniquement si la PWA n'est pas encore installée sur le terminal.
  - Validation du fonctionnement hors-ligne de base via le manifeste PWA (`manifest.json`) et Service Workers.

### US-56 : Mode Hors-Ligne partiel et synchronisation à la reconnexion (Anciennement US-42)

**En tant qu'** utilisateur sur le terrain (ex: location de véhicules),

**Je veux** pouvoir consulter les informations récentes même en cas de coupure réseau temporaire,

**Afin de** maintenir une continuité de travail sans interruption.

- **Critères d'acceptation :**
  - Mise en cache des données essentielles via Service Worker / Cache API Next.js PWA.
  - Détection du retour de la connexion avec indicateur visuel de statut réseau.

### US-57 : Génération de bilan financier Périodique (Clôture mensuelle) (Anciennement US-43)

**En tant que** Comptable ou PDG,

**Je veux** générer un bilan condensé d'un mois civil réunissant Revenus, Dépenses, Avoirs et Solde net,

**Afin de** clôturer officiellement l'exercice mensuel.

- **Critères d'acceptation :**
  - Génération d'un document récapitulatif PDF infalsifiable imprimable et archivable.
  - Blocage automatique d'ajustements postérieurs sur ce mois sans autorisation explicite du PDG.

### US-58 : Personnalisation des alertes Push et Webhooks (Anciennement US-44)

**En tant que** PDG ou DT,

**Je veux** configurer les canaux de réception (Email, Webhook Discord/Slack, Push Web) et les seuils de déclenchement des alertes,

**Afin de** ne recevoir que les notifications pertinentes selon mes priorités.

- **Critères d'acceptation :**
  - Panneau de configuration des intégrations système.
  - Test d'envoi de notification (Ping) pour valider les webhooks enregistrés.

### US-59 (Nouveau ++) : Historique des exports et gestion du stockage

**En tant que** Comptable ou PDG,

**Je veux** accéder à l'historique des documents PDF/CSV précédemment générés pour les télécharger à nouveau,

**Afin d'** éviter de recalculer inutilement des bilans déjà produits.

- **Critères d'acceptation :**
  - Liste chronologique des fichiers générés avec taille et date de création.
  - Téléchargement direct ou régénération à la demande.

### US-60 (Nouveau ++) : Queue de synchronisation hors-ligne pour la création de transactions

**En tant que** Secrétaire ou Agent terrain hors-connexion,

**Je veux** préparer la saisie d'une réservation en mode hors-ligne pour qu'elle s'envoie automatiquement dès que le réseau réapparaît,

**Afin de** ne pas perdre une vente réalisée dans une zone à faible couverture internet.

- **Critères d'acceptation :**
  - Stockage temporaire des données du formulaire dans `IndexedDB`.
  - Exécution automatique de la sync en arrière-plan (Background Sync API) à la reconnexion avec notification de confirmation.

## SPEC 9 : Ergonomie UX, Performance & Robustesse Système

### US-61 : Chargement optimisé avec Skeleton Screen & React Suspense (Anciennement US-45)

**En tant qu'** utilisateur de l'application,

**Je veux** visualiser une structure d'attente (Skeletons) pendant le chargement des données volumineuses sur les dashboards,

**Afin de** bénéficier d'une expérience visuelle réactive sans saccade.

- **Critères d'acceptation :**
  - Utilisation systématique de `<Suspense>` et des pages `loading.tsx` de Next.js App Router.
  - Rendu immédiat des composants layout sans bloquer l'affichage global.

### US-62 : Feedback visuel par toasting instantané (Anciennement US-46)

**En tant qu'** utilisateur effectuant une saisie ou modification,

**Je veux** recevoir une confirmation visuelle sous forme de notification temporaire (toast),

**Afin d'** être certain que mon action a été prise en compte par le serveur.

- **Critères d'acceptation :**
  - Notification verte (succès) ou rouge (erreur) apparaissant au bas ou haut de l'écran.
  - Message clair décrivant le résultat ou le motif du rejet par le serveur.

### US-63 : Raccourcis clavier pour les saisies à haut débit (Anciennement US-47)

**En tant que** Secrétaire ou Comptable à la caisse,

**Je veux** utiliser des raccourcis clavier pour naviguer et valider les formulaires de saisie courante,

**Afin de** réaliser les enregistrements de transactions sans manipuler la souris inutilement.

- **Critères d'acceptation :**
  - Touches d'accès rapide (ex: `Ctrl+Shift+N` pour nouvelle transaction, `Enter` pour valider).
  - Focus automatique sur le premier champ de saisie lors de l'ouverture d'un formulaire modal.

### US-64 : Thème visuel sombre / clair adapté à l'environnement studio (Anciennement US-48)

**En tant qu'** utilisateur opérant en régie ou bureau,

**Je veux** basculer entre un mode sombre (Dark Mode) et un mode clair (Light Mode),

**Afin d'** adapter l'affichage au faible éclairage des cabines d'enregistrement.

- **Critères d'acceptation :**
  - Commutation fluide basée sur les classes CSS / Tailwind.
  - Mémorisation des préférences de l'utilisateur sur son profil ou son terminal.

### US-65 (Nouveau ++) : Gestion globale des erreurs avec écran de secours (Error Boundaries)

**En tant qu'** utilisateur confronté à une défaillance système unexpected,

**Je veux** voir un message d'erreur convivial m'invitant à réessayer au lieu d'un écran blanc ou d'un crash global,

**Afin de** pouvoir recharger uniquement le composant défaillant sans perdre l'accès au reste de l'application.

- **Critères d'acceptation :**
  - Mise en place des fichiers `error.tsx` au niveau de chaque sous-route dans App Router.
  - Bouton "Réessayer" permettant de réexécuter la tentative de rendu sans recharger toute la page.

### US-66 (Nouveau ++) : Responsive Design adapté aux terminaux mobiles et tablettes de régie

**En tant qu'** utilisateur sur tablette en régie ou sur smartphone,

**Je veux** bénéficier d'une interface adaptée aux écrans tactiles et de petites dimensions,

**Afin de** manipuler aisément l'application quel que soit l'équipement à ma disposition.

- **Critères d'acceptation :**
  - Composants de navigation escamotables (Sidebar rétractable / Menu burger).
  - Zones de clic (touch targets) suffisamment larges pour les doigts (minimum 44x44px).

