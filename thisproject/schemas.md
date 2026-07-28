1. // ==========================================
  // 1. AUTHENTIFICATION, IAM, SESSIONS & RBAC
  // ==========================================
  model User {
    id            String        @id @default(cuid())
    firstName     String
    lastName      String        // Corrigé (minuscule)
    email         String        @unique
    password      String
    avatarUrl     String?
    isActive      Boolean       @default(true)
    // 2FA / TOTP (US-08)
    twoFactorEnabled Boolean    @default(false)
    twoFactorSecret  String?
    roleId        Int
    role          Role          @relation(fields: [roleId], references: [id])
    // Relations
    sessions            Session[]             // US-07
    transactionsCreated Transaction[]         @relation("TransactionCreator")
    transactionsApproved Transaction[]        @relation("TransactionApprover") // US-29
    cashClosings        CashClosing[]         @relation("CashClosingOperator")
    cashClosingsReviewed CashClosing[]        @relation("CashClosingReviewer") // US-38
    clientNotes         ClientNote[]          // US-15
    auditLogs           AuditLog[]            @relation("UserAuditLogs")
    createdAt     DateTime      @default(now())
    updatedAt     DateTime      @updatedAt
    @@index([roleId])
  }
  // US-07 : Gestion des sessions actives et déconnexion à distance
  model Session {
    id           String   @id @default(cuid())
    userId       String
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    token        String   @unique
    deviceType   String?  // Ex: "Desktop", "Mobile"
    browser      String?  // Ex: "Chrome", "Safari"
    ipAddress    String?
    lastActiveAt DateTime @default(now())
    createdAt    DateTime @default(now())
    @@index([userId])
  }
  model Role {
    id          Int          @id @default(autoincrement())
    name        String       @unique // "PDG", "DIRECTEUR_TECHNIQUE", "COMPTABLE", "SECRETAIRE", "OBSERVATEUR"
    description String?
    permissions Permission[] @relation("RolePermissions")
    users       User[]
    createdAt   DateTime     @default(now())
    updatedAt   DateTime     @updatedAt
  }
  model Permission {
    id          Int      @id @default(autoincrement())
    slug        String   @unique // ex: "users:manage", "audit:view", "finance:create-expense", "cash:close"
    description String?
    roles       Role[]   @relation("RolePermissions")
    createdAt   DateTime @default(now())
  }
  // ==========================================
  // 2. CLIENTS, TIERS, TAGS & INTERACTIONS
  // ==========================================
  enum ClientCategory {
    ARTISTE_INDEPENDANT
    LABEL_MAISON_DE_DISQUE
    ENTREPRISE_MARQUE
    PARTICULIER_OCCASIONNEL
  }
  model Client {
    id           String         @id @default(cuid())
    name         String
    category     ClientCategory
    phone        String?
    email        String?
    address      String?
    notes        String?
    avatarUrl    String?
    // US-14 : Tagging et segmentation personnalisée (Ex: ["VIP", "Mauvais payeur"])
    tags         String[]       @default([])
    // Relations
    transactions Transaction[]
    interactions ClientNote[]   // US-15
    createdAt    DateTime       @default(now())
    updatedAt    DateTime       @updatedAt
    @@index([category])
  }
  // US-15 : Historique d'interactions et notes de suivi client
  model ClientNote {
    id        String   @id @default(cuid())
    content   String
    clientId  String
    client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
    authorId  String
    author    User     @relation(fields: [authorId], references: [id])
    createdAt DateTime @default(now())
    @@index([clientId])
  }
  // ==========================================
  // 3. TRANSACTIONS FINANCIÈRES (ENTRÉES & SORTIES)
  // ==========================================  
  enum CurrencyType {  
  USD  
  CDF  
  }  
  enum TransactionType {  
  USD // Entrées d'argent  
  EXPENSE // Sorties d'argent / Dépenses }
  enum TransactionType {
    REVENUE // Entrées d'argent
    EXPENSE // Sorties d'argent / Dépenses
  }
  enum RevenueCategory {
    STUDIO_SESSION
    SERVICES_MIX_MASTER
    LOCATION_VEHICULE
    VENTE_ANNEXE
  }
  enum ExpenseCategory {
    MATERIEL_EQUIPEMENT
    LOYER_CHARGES_FIXES
    PAIES_CACHETS_STAFF
    INVESTISSEMENT
    AVANCE_CAISSE_NOTE_FRAIS // US-31
  }
  enum PaymentStatus {
    DEVIS_PROFORMA
    RESERVE_ACOMPTE_REQUIS
    EN_COURS_REALISE
    SOLDE
    LITIGE_ANNULE
  }
  enum PaymentMethod {
    CASH
    MOBILE_MONEY
    VIREMENT_BANCAIRE
    AUTRE
  }
  // US-29, US-31 : Approbation des dépenses
  enum ApprovalStatus {
    NOT_REQUIRED
    PENDING
    APPROVED
    REJECTED
  }
  model Transaction {
    id              String           @id @default(cuid())
    code            String           @unique // Référence lisible (ex: TR-2026-0001)
    type            TransactionType
    revenueCategory RevenueCategory?  
    expenseCategory ExpenseCategory?  
    // Montants  
    totalAmount     Decimal          @db.Decimal(12, 2)  
    paidAmount      Decimal          @default(0.00) @db.Decimal(12, 2)  
    currency CurrencyType @default("USD")  
    remainingAmount Decimal          @db.Decimal(12, 2)  
    status          PaymentStatus    @default(RESERVE_ACOMPTE_REQUIS)  
    paymentMethod   PaymentMethod?  
    // US-29 & US-31 : Workflow d'approbation (PDG)  
    approvalStatus  ApprovalStatus   @default(NOT_REQUIRED)  
    approvedById    String?  
    approvedBy      User?            @relation("TransactionApprover", fields: [approvedById], references: [id])  
    // US-30 : Dépense récurrente  
    isRecurring     Boolean          @default(false)  
    recurringPeriod String?          // ex: "MONTHLY", "QUARTERLY"  
    // Métadonnées flexibles (Sessions, locations, pièces jointes PDF/Image [US-27], remises [US-23])  
    metadata        Json?  
    // Immutabilité & Avoirs (US-26)  
    isAdjustment        Boolean       @default(false)  
    parentTransactionId String?  
    parentTransaction   Transaction?  @relation("TransactionAdjustments", fields: [parentTransactionId], references: [id])  
    adjustments         Transaction[] @relation("TransactionAdjustments")  
    // Relations Tiers & Auteur  
    clientId        String?  
    client          Client?          @relation(fields: [clientId], references: [id])  
    createdById     String  
    createdBy       User             @relation("TransactionCreator", fields: [createdById], references: [id])  
    createdAt       DateTime         @default(now())  
    updatedAt       DateTime         @updatedAt  
    @@index([type, status])  
    @@index([createdById])  
    @@index([clientId])  
  }  
  // ==========================================  
  // 4. RAPPROCHEMENT & CLÔTURE DE CAISSE  
  // ==========================================  
  enum ClosingReviewStatus {  
    APPROVED  
    PENDING_REVIEW // US-38 : Écart en attente de revue PDG  
    RESOLVED  
  }  
  model CashClosing {  
    id                     String              @id @default(cuid())  
    date                   DateTime            @default(now())
    theoreticalCash        Decimal             @db.Decimal(12, 2)
    theoreticalMobileMoney Decimal             @db.Decimal(12, 2)
    realCash               Decimal             @db.Decimal(12, 2)
    realMobileMoney        Decimal             @db.Decimal(12, 2)
    gapAmount              Decimal             @db.Decimal(12, 2)
    hasDiscrepancy         Boolean             @default(false)
    notes                  String?
    // US-38 : Revue et instruction de régularisation par le PDG
    reviewStatus           ClosingReviewStatus @default(APPROVED)
    reviewerInstruction    String?
    reviewedById           String?
    reviewedBy             User?               @relation("CashClosingReviewer", fields: [reviewedById], references: [id])
    operatorId             String
    operator               User                @relation("CashClosingOperator", fields: [operatorId], references: [id])
    createdAt              DateTime            @default(now())
    @@index([operatorId])
    @@index([date])
  }
  // ==========================================
  // 5. AUDIT LOG GLOBAL (TRAÇABILITÉ STRATÉGIQUE)
  // ==========================================
  model AuditLog {
    id          String   @id @default(cuid())
    action      String   // Ex: "USER_BLOCKED", "CASH_CLOSING", "SECURITY_ALERT" (US-44)
    entity      String   // Ex: "User", "Transaction", "CashClosing"
    entityId    String?  
    details     Json?    // Avant / Après (US-42)
    ipAddress   String?  // US-41
    userAgent   String?  // US-41
    userId      String
    user        User     @relation("UserAuditLogs", fields: [userId], references: [id])
    createdAt   DateTime @default(now())
    @@index([userId])
    @@index([action])
    @@index([createdAt])
  }

### Justification des choix & des champs `Json`

1. **Champ** `metadata` **sur** `Transaction` **(JSON) :** Les entrées d'argent du studio sont très variées (*Location de véhicule vs Session de studio vs Mixage*). Au lieu de surcharger le schéma avec 10 tables intermédiaires, le champ `metadata` permet de stocker des détails spécifiques en JSON :

// Pour une session studio :

{ "studioRoom": "A", "durationHours": 4, "soundEngineer": "Marc" }

// Pour une location de véhicule :

{ "vehicleModel": "Land Cruiser", "days": 2, "driverIncluded": true }

 **2. Champ** `details` **sur** `AuditLog` **(JSON) :** Permet d'enregistrer la photo exacte d'une donnée avant et après modification (ou le motif de l'action) pour la traçabilité exclusive du PDG, du DT et du Comptable.

1. **Immutabilité via** `parentTransactionId` **&** `isAdjustment` **:** Conforme à la spécification : au lieu d'altérer un montant, on crée une transaction liée avec `isAdjustment = true` qui compense le montant précédent.



### Intégrité des Données & Transactional Isolation (Prisma)

- **Point Technique :** Lors des opérations multi-tables complexes (ex: création d'un versement + recalcul des montants `paidAmount`/`remainingAmount` + mise à jour du statut `PaymentStatus` + création d'une entrée `AuditLog`), une simple suite d'appels BDD peut échouer à mi-chemin.
- **Recommandation :** Imposer l'utilisation stricte des **Transactions Prisma (**`prisma.$transaction([...])`**)** dans les Server Actions Next.js pour garantir l'atomicité des données (ACID).

### UI/UX : Ergonomie de Saisie et Visualisation du Diff dans les Logs

- **Saisie Rapide en Régie :** L'intégration des raccourcis clavier (`US-63`) est excellente. Veillez à ajouter un indicateur visuel discret sur l'interface indiquant ces raccourcis (ex: petits badges `[Ctrl + N]`) pour faciliter l'apprentissage de l'équipe.
- **Diff Avant / Après (**`US-42`**) :** Pour l'affichage comparatif dans les Audit Logs, utilisez une librairie UI légère comme `react-diff-viewer-continued` plutôt que d'afficher du JSON brut. Cela rendra l'inspection visuelle immédiate et accessible pour le PDG.

