import "dotenv/config";

import bcrypt from "bcryptjs";

import { notifyAccountProvisionedFromSeed } from "../lib/email/account-notifications";
import { createDevOpenFiscalPeriod } from "../lib/fiscal-period/load-fiscal-periods";
import { prisma } from "../lib/prisma";

const PERMISSIONS = [
  { slug: "finance:create-revenue", description: "Saisie des entrées d'argent" },
  { slug: "finance:create-expense", description: "Saisie des sorties d'argent" },
  { slug: "finance:approve-expense", description: "Approbation des dépenses à seuil élevé" },
  { slug: "finance:validate-payment", description: "Validation des encaissements" },
  { slug: "cash:close", description: "Clôture de caisse" },
  { slug: "cash:approve-closing", description: "Approbation des clôtures à écart" },
  { slug: "finance:cancel-adjustment", description: "Annulation et avoirs" },
  { slug: "finance:archive-transaction", description: "Archivage des transactions" },
  { slug: "users:manage", description: "Gestion des utilisateurs (IAM)" },
  { slug: "audit:view", description: "Consultation des journaux d'audit" },
  { slug: "dashboard:full", description: "Dashboard complet macro/micro" },
  { slug: "dashboard:financial", description: "Vue financière du dashboard" },
  { slug: "dashboard:operational", description: "Vue opérationnelle du dashboard" },
  { slug: "dashboard:macro", description: "Vue macro du dashboard" },
] as const;

const ROLE_DEFINITIONS = [
  {
    name: "PDG",
    description: "Super administrateur — accès complet",
    permissions: PERMISSIONS.map((permission) => permission.slug),
  },
  {
    name: "DIRECTEUR_TECHNIQUE",
    description: "Directeur Technique — accès complet",
    permissions: PERMISSIONS.map((permission) => permission.slug),
  },
  {
    name: "COMPTABLE",
    description: "Responsable financier et caisse",
    permissions: [
      "finance:create-revenue",
      "finance:create-expense",
      "finance:validate-payment",
      "cash:close",
      "finance:cancel-adjustment",
      "audit:view",
      "dashboard:financial",
    ],
  },
  {
    name: "SECRETAIRE",
    description: "Saisie opérationnelle des revenus",
    permissions: ["finance:create-revenue", "dashboard:operational"],
  },
  {
    name: "OBSERVATEUR",
    description: "Consultation macro sans action",
    permissions: ["dashboard:macro"],
  },
] as const;

async function main() {
  console.log("🌱 Seeding Mboka Budget v2.0...");

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { slug: permission.slug },
      update: { description: permission.description },
      create: permission,
    });
  }

  const permissionRecords = await prisma.permission.findMany();
  const permissionBySlug = new Map(permissionRecords.map((record) => [record.slug, record.id]));

  for (const roleDefinition of ROLE_DEFINITIONS) {
    const permissionIds = roleDefinition.permissions
      .map((slug) => permissionBySlug.get(slug))
      .filter((id): id is number => typeof id === "number");

    await prisma.role.upsert({
      where: { name: roleDefinition.name },
      update: {
        description: roleDefinition.description,
        permissions: {
          set: permissionIds.map((id) => ({ id })),
        },
      },
      create: {
        name: roleDefinition.name,
        description: roleDefinition.description,
        permissions: {
          connect: permissionIds.map((id) => ({ id })),
        },
      },
    });
  }

  const dtRole = await prisma.role.findUniqueOrThrow({
    where: { name: "DIRECTEUR_TECHNIQUE" },
  });

  const dtEmail = process.env.SEED_DT_EMAIL ?? "prince.vangu@mboka.studio";
  const plainPassword = process.env.SEED_DT_PASSWORD;

  if (!plainPassword) {
    throw new Error("SEED_DT_PASSWORD est requis pour créer le compte Directeur Technique.");
  }

  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const dtUser = await prisma.user.upsert({
    where: { email: dtEmail },
    update: {
      firstName: "Prince",
      lastName: "Vangu",
      password: passwordHash,
      roleId: dtRole.id,
      isActive: true,
      accountStatus: "ACTIVE",
      mustChangePassword: true,
    },
    create: {
      firstName: "Prince",
      lastName: "Vangu",
      email: dtEmail,
      password: passwordHash,
      roleId: dtRole.id,
      isActive: true,
      accountStatus: "ACTIVE",
      mustChangePassword: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "USER_SEEDED",
      entity: "User",
      entityId: dtUser.id,
      userId: dtUser.id,
      details: {
        message: "Compte initial Directeur Technique créé via seed",
        role: "DIRECTEUR_TECHNIQUE",
      },
    },
  });

  const authUrl = process.env.AUTH_URL?.trim() || "http://localhost:3000";
  const loginUrl = `${authUrl.replace(/\/$/, "")}/login`;

  const emailSent = await notifyAccountProvisionedFromSeed({
    email: dtUser.email,
    firstName: dtUser.firstName,
    lastName: dtUser.lastName,
    roleLabel: "Directeur Technique",
    loginUrl,
  });

  if (emailSent) {
    console.log(`   → Email de bienvenue envoyé à ${dtUser.email}`);
  } else {
    console.warn(`   → Email de bienvenue non envoyé pour ${dtUser.email} (voir logs)`);
  }

  if (process.env.SEED_FISCAL_PERIOD === "open") {
    const existingOpen = await prisma.fiscalPeriod.findFirst({
      where: { status: "OPEN" },
      select: { id: true, label: true },
    });

    if (!existingOpen) {
      const period = await createDevOpenFiscalPeriod({ skipOpeningBalance: true });
      console.log(`   → Trimestre comptable : ${period.label} (OPEN, bypass onboarding)`);
    } else {
      console.log(`   → Trimestre comptable : ${existingOpen.label} (déjà OPEN)`);
    }
  }

  console.log("✅ Seed terminé.");
  console.log(`   → Directeur Technique  : ${dtUser.firstName} ${dtUser.lastName}`);
  console.log(`   → Email DT             : ${dtUser.email}`);
  console.log(`   → ${ROLE_DEFINITIONS.length} rôles, ${PERMISSIONS.length} permissions`);
}

main()
  .catch((error) => {
    console.error("❌ Seed échoué :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
