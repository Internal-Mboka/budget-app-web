-- Add missing leadership roles.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DG';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DIRECTEUR_TECHNIQUE';

-- Enforce one person per leadership role in database.
CREATE UNIQUE INDEX IF NOT EXISTS "User_single_pdg_idx"
ON "User" ("role")
WHERE "role" = 'PDG';

CREATE UNIQUE INDEX IF NOT EXISTS "User_single_comptable_idx"
ON "User" ("role")
WHERE "role" = 'COMPTABLE';

CREATE UNIQUE INDEX IF NOT EXISTS "User_single_dg_idx"
ON "User" ("role")
WHERE "role" = 'DG';

CREATE UNIQUE INDEX IF NOT EXISTS "User_single_directeur_technique_idx"
ON "User" ("role")
WHERE "role" = 'DIRECTEUR_TECHNIQUE';
