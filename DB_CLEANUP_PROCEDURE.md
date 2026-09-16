# Procédure de nettoyage de la base de données

Cette procédure sert à nettoyer toutes les données de la base PostgreSQL/Neon tout en conservant les comptes utilisateurs et leurs accès.

Important :
- Toujours faire un dump de sauvegarde avant toute suppression.
- Toujours tester en mode dry run avant la suppression réelle.
- Ne conserver que les tables nécessaires à l’authentification, les rôles et éventuellement les réglages système.

## 1. Objectif

Conserver :
- `User`
- `Role`
- `Permission`
- `AlertSettings` (si le système le nécessite)

Supprimer :
- clients
- transactions
- clôtures / bilans
- sessions de test ou expirées
- logs d’audit
- reset tokens
- données financières historiques

## 2. Connexion à Neon

Exemple de connexion de production :

```bash
export DATABASE_URL='postgresql://neondb_owner:npg_mqD03gXUWPfN@ep-long-morning-asj1jxe1-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

Important :
- Toujours mettre l’URL entre guillemets simples.
- Ne pas oublier le `&` dans l’URL.
- Toujours utiliser `export DATABASE_URL='...'` dans le shell.

## 3. Sauvegarde de sécurité

Installer le client PostgreSQL si nécessaire :

```bash
sudo apt-get update
sudo apt-get install -y postgresql-client
```

Créer le dump :

```bash
mkdir -p backups
export DATABASE_URL='postgresql://neondb_owner:npg_mqD03gXUWPfN@ep-long-morning-asj1jxe1-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
pg_dump "$DATABASE_URL" -Fc -f "backups/backup-prod-$(date +%Y%m%d_%H%M%S).dump"
```

## 4. Vérification avant suppression

Lancer le script en mode dry run :

```bash
export DATABASE_URL='postgresql://neondb_owner:npg_mqD03gXUWPfN@ep-long-morning-asj1jxe1-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
npx tsx scripts/clean-db.ts
```

Résultat attendu :
- le script affiche la liste des modèles qui seraient supprimés
- aucune donnée n’est modifiée

## 5. Suppression réelle

Lancer la suppression réelle avec garde-fou :

```bash
export DATABASE_URL='postgresql://neondb_owner:npg_mqD03gXUWPfN@ep-long-morning-asj1jxe1-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
export CONFIRM=true
npx tsx scripts/clean-db.ts
```

Le script conserve uniquement :
- `User`
- `Role`
- `Permission`
- `AlertSettings`

et supprime :
- `AuditLog`
- `GeneratedExport`
- `CashClosing`
- `Transaction`
- `ClientNote`
- `Client`
- `FinancialPeriodClosure`
- `FiscalPeriod`
- `InvitationToken`
- `PasswordResetToken`
- `Session`

## 6. Vérification finale

Vérifier les tables restantes :

```bash
export DATABASE_URL='postgresql://neondb_owner:npg_mqD03gXUWPfN@ep-long-morning-asj1jxe1-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
npx prisma db execute --stdin <<'SQL'
SELECT 'User' AS table_name, count(*)::text AS rows FROM "User"
UNION ALL SELECT 'Role', count(*)::text FROM "Role"
UNION ALL SELECT 'Permission', count(*)::text FROM "Permission"
UNION ALL SELECT 'AlertSettings', count(*)::text FROM "AlertSettings"
UNION ALL SELECT 'Session', count(*)::text FROM "Session"
UNION ALL SELECT 'Client', count(*)::text FROM "Client"
UNION ALL SELECT 'Transaction', count(*)::text FROM "Transaction"
UNION ALL SELECT 'AuditLog', count(*)::text FROM "AuditLog"
UNION ALL SELECT 'FiscalPeriod', count(*)::text FROM "FiscalPeriod";
SQL
```

## 7. Bonnes pratiques

- Toujours conserver les comptes utilisateurs actifs.
- Vérifier les rôles avant de supprimer les permissions.
- Faire un backup avant toute action destructrice.
- Ne jamais exécuter `CONFIRM=true` sans vérification préalable.
- Pour réinitialiser un environnement propre, re-seeder ensuite les comptes / rôles souhaités.

## 8. Fichiers utiles dans ce projet

- [scripts/clean-db.ts](scripts/clean-db.ts)
- [prisma/schema.prisma](prisma/schema.prisma)
- [lib/prisma.ts](lib/prisma.ts)

## 9. Exemple de commande complète

```bash
cd /home/jordan-nsadisi-kadea/Documents/budget-app-web
mkdir -p backups
export DATABASE_URL='postgresql://neondb_owner:npg_mqD03gXUWPfN@ep-long-morning-asj1jxe1-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
pg_dump "$DATABASE_URL" -Fc -f "backups/backup-prod-$(date +%Y%m%d_%H%M%S).dump"
export CONFIRM=true
npx tsx scripts/clean-db.ts
```
