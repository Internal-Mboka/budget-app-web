import 'dotenv/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Add it to your .env or environment before running this script.');
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const keep = ['User', 'Role', 'Permission', 'AlertSettings'];

// Liste des modèles présents dans prisma/schema.prisma — mettre à jour si nécessaire
const allModels = [
  'AuditLog',
  'GeneratedExport',
  'CashClosing',
  'Transaction',
  'ClientNote',
  'Client',
  'FinancialPeriodClosure',
  'FiscalPeriod',
  'InvitationToken',
  'PasswordResetToken',
  'Session',
  'User',
  'Role',
  'Permission',
  'AlertSettings',
];

const deleteOrder = allModels.filter(m => !keep.includes(m));

async function main() {
  if (process.env.CONFIRM !== 'true') {
    console.log('Dry run — aucune suppression ne sera effectuée.');
    console.log('Modèles qui seraient supprimés (ordre):', deleteOrder.join(', '));
    await prisma.$disconnect();
    return;
  }

  console.log('CONFIRM=true détecté — suppression en cours.');
  for (const model of deleteOrder) {
    try {
      // appel dynamique: (prisma as any)[model].deleteMany({})
      const result = await (prisma as any)[model].deleteMany({});
      // Prisma v3+ retourne { count }
      console.log(`-> ${model}: supprimés`, result?.count ?? result);
    } catch (err) {
      console.error(`Erreur lors de la suppression de ${model}:`, (err as Error).message);
      // on continue aux autres modèles — décommentez pour arrêter à la première erreur
      // throw err;
    }
  }

  console.log('Nettoyage terminé.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
